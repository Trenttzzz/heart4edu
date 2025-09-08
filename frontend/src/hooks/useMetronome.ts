import { useCallback, useEffect, useRef, useState } from 'react';

interface UseMetronomeOptions {
  bpm?: number; // default 120
  volume?: number; // 0..1
  beatsPerBar?: number; // accent every n beats, default 4
}

export const useMetronome = (opts: UseMetronomeOptions = {}) => {
  const bpm = opts.bpm ?? 120;
  const volume = Math.min(Math.max(opts.volume ?? 0.6, 0), 1);
  const beatsPerBar = opts.beatsPerBar ?? 4;

  const [isRunning, setIsRunning] = useState(false);
  const [beatCount, setBeatCount] = useState(0); // overall count
  const [barBeat, setBarBeat] = useState(0); // position in bar

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0); // absolute time in AudioContext
  const schedulerIdRef = useRef<number | null>(null);

  const secondsPerBeat = 60 / bpm;
  const scheduleAheadTime = 0.15; // seconds to schedule ahead
  const lookAhead = 25; // ms interval for scheduler loop

  const ensureContext = () => {
    if (!audioCtxRef.current) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
      audioCtxRef.current = new Ctx();
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playClick = (time: number, isAccent: boolean) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(isAccent ? 1400 : 1000, time);

    // simple envelope
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.09);

    osc.connect(gain).connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.1);
  };

  const schedule = useCallback(() => {
    if (!isRunning) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
      const currentBarBeat = beatCount % beatsPerBar; // 0-based
      const isAccent = currentBarBeat === 0;
      playClick(nextNoteTimeRef.current, isAccent);

      nextNoteTimeRef.current += secondsPerBeat;
      setBeatCount(prev => prev + 1);
      setBarBeat((currentBarBeat + 1) % beatsPerBar);
    }

    schedulerIdRef.current = window.setTimeout(schedule, lookAhead);
  }, [isRunning, beatCount, beatsPerBar, secondsPerBeat]);

  const start = useCallback(() => {
    if (isRunning) return;
    ensureContext();
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    nextNoteTimeRef.current = ctx.currentTime + 0.05; // small delay before first click
    setBeatCount(0);
    setBarBeat(0);
    setIsRunning(true);
  }, [isRunning]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (schedulerIdRef.current) {
      clearTimeout(schedulerIdRef.current);
      schedulerIdRef.current = null;
    }
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) stop(); else start();
  }, [isRunning, start, stop]);

  useEffect(() => {
    if (isRunning) {
      schedule();
    } else if (schedulerIdRef.current) {
      clearTimeout(schedulerIdRef.current);
      schedulerIdRef.current = null;
    }
    return () => {
      if (schedulerIdRef.current) clearTimeout(schedulerIdRef.current);
    };
  }, [isRunning, schedule]);

  // Cleanup audio context on unmount (optional keep alive?)
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, []);

  return { isRunning, start, stop, toggle, bpm, beatCount, barBeat };
};
