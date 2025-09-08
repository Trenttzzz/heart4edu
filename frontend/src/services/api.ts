// API Service untuk integrasi dengan backend CPR
// Use optional chaining to avoid TS error if env typing not present
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const API_BASE_URL = (import.meta?.env?.VITE_API_URL as string) || 'http://localhost:8000';

export interface PredictionResult {
  class_index: number;
  class_label: string;
  probs: number[];
}

export interface IngestResponse {
  ok: boolean;
  mode: string;
  window_size: number;
  stride: number;
  session_id: string;
  buffer_len: number;
  inferred: boolean;
  result?: PredictionResult;
}

export interface LastResultResponse {
  session_id: string;
  buffer_len: number;
  result?: PredictionResult;
}

// Original DepthDataResponse merged below.

export interface DepthDataPoint {
  time: number;
  depth: number;
  timestamp: number;
}

export interface DepthDataResponse {
  session_id: string;
  buffer_len: number;
  depth_data: Array<{
    depth: number;
    timestamp: number;
    index?: number; // optional index
  }>;
  total_count?: number; // some endpoints may use total_count
  total_points?: number; // compatibility field
}

export interface BatchPredictionResult {
  results: PredictionResult[];
}

export interface HealthResponse {
  status: string;
}

class APIService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Health check
  async checkHealth(): Promise<HealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Single prediction
  async predict(sessionId: string, depthData: number[]): Promise<PredictionResult> {
    if (depthData.length !== 10) {
      throw new Error('Depth data must contain exactly 10 values');
    }

    const response = await fetch(`${this.baseUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        depth_cm: depthData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Prediction failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Batch prediction
  async predictBatch(sessionId: string, batches: number[][]): Promise<BatchPredictionResult> {
    const response = await fetch(`${this.baseUrl}/predict/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        batches: batches,
      }),
    });

    if (!response.ok) {
      throw new Error(`Batch prediction failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Ingest single depth value
  async ingestDepth(
    sessionId: string, 
    depthCm: number, 
    mode: 'sliding' | 'nonoverlap' = 'sliding'
  ): Promise<IngestResponse> {
    const response = await fetch(`${this.baseUrl}/ingest?mode=${mode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: sessionId,
        depth_cm: depthCm,
        mode: mode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ingest failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get last result
  async getLastResult(sessionId: string): Promise<LastResultResponse> {
    const response = await fetch(`${this.baseUrl}/last/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Get last result failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Reset session data
  async resetSession(sessionId: string): Promise<{ok: boolean, session_id: string, message: string, total_compressions_before_reset: number}> {
    const response = await fetch(`${this.baseUrl}/reset/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Reset session failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Update window mode
  async updateMode(sessionId: string, mode: 'sliding' | 'nonoverlap'): Promise<{ok: boolean, session_id: string, old_mode: string, new_mode: string, message: string}> {
    const response = await fetch(`${this.baseUrl}/mode/${sessionId}?mode=${mode}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Update mode failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Get current window mode
  async getMode(sessionId: string): Promise<{session_id: string, mode: string, available_modes: string[]}> {
    const response = await fetch(`${this.baseUrl}/mode/${sessionId}`);
    if (!response.ok) {
      throw new Error(`Get mode failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Get depth history data
  async getDepthData(sessionId: string, limit: number = 50): Promise<DepthDataResponse> {
    const response = await fetch(`${this.baseUrl}/depth/${sessionId}?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Get depth data failed: ${response.statusText}`);
    }
    return response.json();
  }

  // Create WebSocket connection
  createWebSocket(sessionId: string): WebSocket {
    const wsUrl = `${this.baseUrl.replace('http', 'ws')}/ws/${sessionId}`;
    return new WebSocket(wsUrl);
  }

  // Get monitoring UI URL
  getMonitoringUIUrl(sessionId: string): string {
    return `${this.baseUrl}/ui?session_id=${sessionId}`;
  }
}

export const apiService = new APIService();
export default apiService;
