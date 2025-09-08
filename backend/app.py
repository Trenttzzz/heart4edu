from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from typing import List, Annotated, Dict, Optional
from pydantic import BaseModel, Field
from collections import defaultdict, deque
import asyncio
import anyio
import numpy as np
import onnxruntime as ort
import json, os, socket, time  # hapus threading & serial related

# ========= Konfigurasi =========
CLASS_MAP = {
    0: "stabil",
    1: "ga stabil",
    2: "cenderung atas",
    3: "cenderung bawah",
}

CORS = os.getenv("CORS_ORIGINS", "*")
MODEL_PATH = os.getenv("MODEL_PATH", "model/model_cpr.onnx")


INPUT_NAME = None   # akan diisi setelah sesi ONNX dibuat

# ========= Load Model ONNX =========
_ort_providers = os.getenv("ORT_PROVIDERS", "CPUExecutionProvider")
PROVIDERS = [p.strip() for p in _ort_providers.split(",") if p.strip()]

ort_sess = ort.InferenceSession(MODEL_PATH, providers=PROVIDERS)
INPUT_NAME = ort_sess.get_inputs()[0].name

_model_dir = os.path.dirname(MODEL_PATH)
SCALER_PATH = os.path.join(_model_dir, "scaler_params.json")
if not os.path.exists(SCALER_PATH):
    raise RuntimeError(
        f"Tidak menemukan {SCALER_PATH}. Simpan parameter scaler dari training "
        f"(mean & scale) agar inference konsisten."
    )

with open(SCALER_PATH, "r") as f:
    _scaler = json.load(f)

SCALER_MEAN  = np.array(_scaler["mean"],  dtype=np.float32)  # shape (10,)
SCALER_SCALE = np.array(_scaler["scale"], dtype=np.float32)  # shape (10,)

# (opsional) warmup
_ = ort_sess.run(None, {INPUT_NAME: np.zeros((1,10,1), dtype=np.float32)})

_allow_origins = ["*"] if CORS.strip() == "*" else [o.strip() for o in CORS.split(",") if o.strip()]

# ========= FastAPI =========
app = FastAPI(title="CPR Inference API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# ========= WebSocket Hub per session =========
class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active.setdefault(session_id, []).append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active:
            self.active[session_id].remove(websocket)
            if not self.active[session_id]:
                del self.active[session_id]

    async def broadcast(self, session_id: str, message: dict):
        for ws in list(self.active.get(session_id, [])):
            try:
                await ws.send_json(message)
            except Exception:
                # kalau ada ws yang sudah mati, abaikan
                pass

manager = ConnectionManager()

# Buffer & state
WINDOW_SIZE = 10
DEFAULT_MODE = "nonoverlap"   # Non-overlapping window: buffer di-reset setelah prediksi


buffers = defaultdict(lambda: deque())  # Buffer for inference (max 10)
depth_history = defaultdict(lambda: deque())  # Buffer for depth history (max 120)
session_modes = defaultdict(lambda: DEFAULT_MODE)  # Mode per session
last_result: Dict[str, dict] = {}

# ========= Schemas =========
class PredictIn(BaseModel):
    session_id: str = "default"
    depth_cm: Annotated[List[float], Field(min_length=10, max_length=10)]

class PredictBatchIn(BaseModel):
    session_id: str = "default"
    batches: List[Annotated[List[float], Field(min_length=10, max_length=10)]]

class IngestIn(BaseModel):
    session_id: str = "default"
    depth_cm: float
    mode: Optional[str] = None   # "sliding" | "nonoverlap" (opsional)

class BpmReq(BaseModel):
    bpm: int

# ========= Util =========
def to_model_input(arr: np.ndarray) -> np.ndarray:
    """
    Terima shape:
      - (10,)  -> ubah ke (1,10,1)
      - (10,1) -> ubah ke (1,10,1)
      - (B,10) -> ubah ke (B,10,1)
      - (B,10,1) -> dibiarkan
    """
    if arr.ndim == 1:                    # (10,)
        arr = arr.reshape(1, 10, 1)
    elif arr.ndim == 2 and arr.shape[1] == 10:   # (B,10)
        arr = arr.reshape(-1, 10, 1)
    elif arr.ndim == 2 and arr.shape == (10,1):  # (10,1)
        arr = arr.reshape(1, 10, 1)
    elif arr.ndim == 3 and arr.shape[1:] == (10,1):
        pass
    else:
        raise ValueError(f"Shape input tidak sesuai. Dapat: {arr.shape}, harap pakai [10] atau [B,10] atau [B,10,1].")
    return arr.astype(np.float32)

def softmax(logits: np.ndarray) -> np.ndarray:
    e = np.exp(logits - logits.max(axis=1, keepdims=True))
    return e / e.sum(axis=1, keepdims=True)

def postprocess(probs: np.ndarray):
    preds = probs.argmax(axis=1)
    labels = [CLASS_MAP[int(i)] for i in preds]
    return preds.tolist(), labels

def normalize_windows(x_b10_1: np.ndarray) -> np.ndarray:
    x = x_b10_1[..., 0]                     # [B,10]
    x = (x - SCALER_MEAN) / SCALER_SCALE    # z-score per kolom
    return x[..., None].astype(np.float32)  # [B,10,1]

# ========= Endpoints =========
@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_path": MODEL_PATH,
        "providers": PROVIDERS,
        "cors": CORS,
    }

@app.post("/predict")
def predict(payload: PredictIn):
    try:
        x = np.array(payload.depth_cm, dtype=np.float32)
        x = to_model_input(x)          # -> [1,10,1]
        x = normalize_windows(x)

        outputs = ort_sess.run(None, {INPUT_NAME: x})
        probs = outputs[0]             # [1,4]
        if probs.ndim != 2:
            raise HTTPException(500, detail="Output model tidak berukuran [B, num_classes].")

        probs = softmax(probs)
        pred_idx, pred_label = postprocess(probs)

        result = {
            "class_index": int(pred_idx[0]),
            "class_label": pred_label[0],
            "probs": probs[0].round(6).tolist()
        }
        # broadcast dari route sync → gunakan anyio.from_thread.run
        anyio.from_thread.run(manager.broadcast, payload.session_id, {
            "type": "inference",
            **result
        })
        # simpan last
        last_result[payload.session_id] = result
        return result
    except ValueError as e:
        raise HTTPException(400, detail=str(e))

@app.post("/predict/batch")
def predict_batch(payload: PredictBatchIn):
    try:
        x = np.array(payload.batches, dtype=np.float32)  # [B,10]
        x = to_model_input(x)                             # [B,10,1]
        x = normalize_windows(x)

        outputs = ort_sess.run(None, {INPUT_NAME: x})
        probs = outputs[0]                                # [B,4]
        if probs.ndim != 2:
            raise HTTPException(500, detail="Output model tidak berukuran [B, num_classes].")

        probs = softmax(probs)
        pred_idx, pred_label = postprocess(probs)
        result = [
            {
                "class_index": int(i),
                "class_label": l,
                "probs": probs[j].round(6).tolist()
            }
            for j, (i, l) in enumerate(zip(pred_idx, pred_label))
        ]
        # opsional: broadcast agregat atau item terakhir
        if result:
            anyio.from_thread.run(manager.broadcast, payload.session_id, {
                "type": "inference",
                **result[-1]
            })
            last_result[payload.session_id] = result[-1]
        return {"results": result}
    except ValueError as e:
        raise HTTPException(400, detail=str(e))

@app.post("/ingest")
async def ingest(
    payload: IngestIn,
    mode: Optional[str] = Query(
        default=None,
        description="Pilih 'sliding' atau 'nonoverlap'. Query param ini override body."
    ),
):
    """
    Terima 1 angka kedalaman (cm) per kompresi dari perangkat.

    Mode window:
      - sliding     -> STRIDE = 1 (prediksi setiap kali ada kompresi baru setelah warmup)
      - nonoverlap  -> STRIDE = WINDOW_SIZE (prediksi tiap 10 kompresi, tanpa overlap)

    Prioritas sumber mode: query param > body.mode > DEFAULT_MODE.
    """
    try:
        sid = payload.session_id
        val = float(payload.depth_cm)
    except Exception as e:
        raise HTTPException(400, detail=f"Payload tidak valid: {e}")

    # Tentukan mode & stride
    # Prioritas: query param > body.mode > session_mode > DEFAULT_MODE
    eff_mode = (mode or payload.mode or session_modes[sid]).lower().replace("-", "").replace("_", "")
    if eff_mode in {"nonoverlap", "nonoverlapping", "block", "batch"}:
        stride = WINDOW_SIZE
        eff_mode = "nonoverlap"
    else:
        stride = 1
        eff_mode = "sliding"
    
    # Update session mode jika ada perubahan
    session_modes[sid] = eff_mode

    buf = buffers[sid]
    buf.append(val)
    
    # Store in depth history (max 120 points with auto-reset)
    hist = depth_history[sid]
    hist.append(val)
    
    # Auto-reset when reaching 120 compressions
    if len(hist) >= 120:
        await manager.broadcast(sid, {
            "type": "session_complete",
            "session_id": sid,
            "total_compressions": len(hist),
            "message": "120 kompresi tercapai! Sesi direset otomatis.",
            "timestamp": asyncio.get_event_loop().time()
        })
        hist.clear()  # Reset depth history
        buf.clear()   # Reset inference buffer too

    # Broadcast depth data setiap kali data baru masuk
    await manager.broadcast(sid, {
        "type": "depth_data",
        "session_id": sid,
        "depth_cm": val,
        "buffer_len": len(buf),
        "total_compressions": len(hist),
        "timestamp": asyncio.get_event_loop().time()
    })

    result = None
    inferred = False
    
    # Untuk sliding window: inference setiap kali buffer >= WINDOW_SIZE
    # Untuk nonoverlap: inference hanya ketika buffer == WINDOW_SIZE dan kosong sebelumnya
    should_infer = False
    
    if eff_mode == "sliding":
        # Sliding: inference setiap kali buffer penuh (>= 10)
        should_infer = len(buf) >= WINDOW_SIZE
    else:
        # Non-overlap: inference hanya ketika buffer tepat 10
        should_infer = len(buf) == WINDOW_SIZE
    
    if should_infer:
        # Ambil 10 data terakhir untuk inference
        window_data = list(buf)[-WINDOW_SIZE:]  # Ambil 10 terakhir
        x = np.array(window_data, dtype=np.float32)    # [10]
        x = to_model_input(x)                         # [1,10,1]
        x = normalize_windows(x)

        def _run():
            return ort_sess.run(None, {INPUT_NAME: x})

        outputs = await asyncio.to_thread(_run)
        probs = outputs[0]                            # [1,4]
        if probs.ndim != 2:
            raise HTTPException(500, detail="Output model tidak berukuran [B, num_classes].")

        probs = softmax(probs)
        pred_idx, pred_label = postprocess(probs)
        result = {
            "class_index": int(pred_idx[0]),
            "class_label": pred_label[0],
            "probs": probs[0].round(6).tolist()
        }
        last_result[sid] = result
        await manager.broadcast(sid, {"type": "inference", **result})
        inferred = True

        # Konsumsi buffer sesuai mode
        if eff_mode == "sliding":
            # Sliding: hapus data lama, biarkan overlap
            while len(buf) > WINDOW_SIZE - stride:
                buf.popleft()
        else:
            # Non-overlap: kosongkan buffer
            buf.clear()

    return {
        "ok": True,
        "mode": eff_mode,
        "window_size": WINDOW_SIZE,
        "stride": stride,
        "session_id": sid,
        "buffer_len": len(buf),  # panjang buffer SETELAH konsumsi
        "inferred": inferred,
        "result": result
    }


@app.get("/last/{session_id}")
def get_last(session_id: str):
    """Ambil hasil prediksi terakhir + panjang buffer."""
    return {
        "session_id": session_id,
        "buffer_len": len(buffers.get(session_id, [])),
        "result": last_result.get(session_id)
    }

@app.get("/depth/{session_id}")
def get_depth_data(session_id: str, limit: int = 50):
    """Ambil data depth terakhir untuk charting."""
    hist = depth_history.get(session_id, deque())
    depth_list = list(hist)[-limit:]  # Ambil N data terakhir
    
    depth_data = [
        {
            "depth": float(depth),
            "timestamp": int(time.time()),  # Current timestamp as placeholder
            "index": i
        }
        for i, depth in enumerate(depth_list)
    ]
    
    return {
        "session_id": session_id,
        "buffer_len": len(buffers.get(session_id, [])),  # Inference buffer length
        "depth_data": depth_data,
        "total_count": len(depth_list)
    }

@app.post("/reset/{session_id}")
async def reset_session(session_id: str):
    """Reset session data - clear buffers and history."""
    buf = buffers.get(session_id, deque())
    hist = depth_history.get(session_id, deque())
    
    total_before_reset = len(hist)
    
    # Clear all buffers
    buf.clear()
    hist.clear()
    
    # Clear last result
    if session_id in last_result:
        del last_result[session_id]
    
    # Broadcast reset event
    await manager.broadcast(session_id, {
        "type": "session_reset",
        "session_id": session_id,
        "total_compressions_before_reset": total_before_reset,
        "message": "Sesi direset manual oleh pengguna.",
        "timestamp": asyncio.get_event_loop().time()
    })
    
    return {
        "ok": True,
        "session_id": session_id,
        "message": "Session berhasil direset",
        "total_compressions_before_reset": total_before_reset
    }

@app.post("/mode/{session_id}")
async def update_mode(session_id: str, mode: str = Query(..., description="Mode: 'sliding' atau 'nonoverlap'")):
    """Update window mode untuk session."""
    if mode.lower() not in ["sliding", "nonoverlap"]:
        raise HTTPException(400, detail="Mode harus 'sliding' atau 'nonoverlap'")
    
    old_mode = session_modes[session_id]
    session_modes[session_id] = mode.lower()
    
    # Broadcast mode change
    await manager.broadcast(session_id, {
        "type": "mode_change",
        "session_id": session_id,
        "old_mode": old_mode,
        "new_mode": mode.lower(),
        "message": f"Mode berubah dari {old_mode} ke {mode.lower()}",
        "timestamp": asyncio.get_event_loop().time()
    })
    
    return {
        "ok": True,
        "session_id": session_id,
        "old_mode": old_mode,
        "new_mode": mode.lower(),
        "message": f"Mode berhasil diubah ke {mode.lower()}"
    }

@app.get("/mode/{session_id}")
def get_mode(session_id: str):
    """Get current window mode untuk session."""
    return {
        "session_id": session_id,
        "mode": session_modes[session_id],
        "available_modes": ["sliding", "nonoverlap"]
    }

@app.websocket("/ws/{session_id}")
async def ws_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    try:
        while True:
            # keep-alive/echo opsional
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)

@app.get("/ui", response_class=HTMLResponse)
def ui(session_id: str = "default"):
    """UI mini untuk monitor via WebSocket."""
    return f"""
<!doctype html>
<meta charset="utf-8"/>
<title>CPR Monitor - {session_id}</title>
<body style="font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto;">
  <h2>CPR Monitor — session: <code>{session_id}</code></h2>
  <pre id="log" style="padding:1rem;border:1px solid #ccc;border-radius:8px;white-space:pre-wrap;"></pre>
  <script>
    const el = document.getElementById('log');
    const ws = new WebSocket(`ws://${{location.host}}/ws/{session_id}`);
    ws.onopen = () => el.textContent += 'WS connected\\n';
    ws.onmessage = (e) => {{
      const m = JSON.parse(e.data);
      if (m.type === 'inference') {{
        el.textContent =
          'Label: ' + m.class_label + '\\n' +
          'Index: ' + m.class_index + '\\n' +
          'Probs: ' + JSON.stringify(m.probs) + '\\n' +
          '(auto-updates tiap 10 peak)\\n';
      }}
    }};
    ws.onerror = () => el.textContent += 'WS error\\n';
    ws.onclose = () => el.textContent += 'WS closed\\n';
  </script>
</body>
"""

# ========= Helper =========
def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))   # tidak kirim data, hanya pilih interface
        return s.getsockname()[0]
    except:
        return "127.0.0.1"
    finally:
        s.close()

@app.on_event("startup")
def show_ip():
    print(f"===> FastAPI reachable at: http://{get_local_ip()}:8000")
