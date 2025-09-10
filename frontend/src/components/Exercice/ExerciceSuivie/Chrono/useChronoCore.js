import { useEffect, useRef, useState } from "react";

export default function useChronoCore(startedAt, { resume = true } = {}) {
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [startTs, setStartTs] = useState(null);
  const rafRef = useRef(null);

  const stopAndReset = (resetTime = true) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setRunning(false);
    if (resetTime) {
      setStartTs(null);
      setTime(0);
    }
  };

  useEffect(() => {
    if (!running) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    const compute = () => {
      if (startTs) {
        const now = Date.now();
        const elapsed = Math.max(0, Math.floor((now - startTs) / 1000));
        setTime(elapsed);
      }
      rafRef.current = requestAnimationFrame(compute);
    };
    rafRef.current = requestAnimationFrame(compute);

    const onVis = () => {
      if (document.visibilityState === "visible" && startTs) {
        const now = Date.now();
        setTime(Math.max(0, Math.floor((now - startTs) / 1000)));
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [running, startTs]);

  // Prefill display from startedAt without auto-start
  useEffect(() => {
    if (!resume) return;
    if (startedAt) {
      const ts = new Date(startedAt).getTime();
      if (!Number.isNaN(ts)) {
        setTime(Math.max(0, Math.floor((Date.now() - ts) / 1000)));
      }
    }
  }, [startedAt, resume]);

  // Hard reset when parent clears startedAt or resume is disabled
  useEffect(() => {
    if (!resume || !startedAt) {
      stopAndReset(true);
    }
  }, [startedAt, resume]);

  const freezeClock = (fallbackTime = 0, currentStartTs = null) => {
    const nowTs = Date.now();
    const finalSec = currentStartTs
      ? Math.max(0, Math.floor((nowTs - currentStartTs) / 1000))
      : fallbackTime;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setRunning(false);
    setTime(finalSec);
    return finalSec;
  };

  return {
    time, setTime,
    running, setRunning,
    showConfirm, setShowConfirm,
    startTs, setStartTs,
    stopAndReset,
    freezeClock,
  };
}
