import { useState, useEffect, useRef, useCallback } from 'react';

export default function useHIITTimer({
  workDuration = 30,
  restDuration = 15,
  rounds = 8,
  onRoundComplete,
  onComplete
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [phase, setPhase] = useState('work'); // 'work' | 'rest'
  const [timeLeft, setTimeLeft] = useState(workDuration);
  const [isPaused, setIsPaused] = useState(false);

  const intervalRef = useRef(null);
  const lastTickRef = useRef(Date.now());

  // Reset timer when config changes
  useEffect(() => {
    setCurrentRound(1);
    setPhase('work');
    setTimeLeft(workDuration);
    setIsRunning(false);
    setIsPaused(false);
  }, [workDuration, restDuration, rounds]);

  const playSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (err) {
      console.log('Audio not available');
    }
  }, []);

  const vibrate = useCallback(() => {
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
  }, []);

  const notifyPhaseChange = useCallback(() => {
    playSound();
    vibrate();
  }, [playSound, vibrate]);

  useEffect(() => {
    if (!isRunning || isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    lastTickRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      setTimeLeft(prev => {
        const next = prev - delta / 1000;

        if (next <= 0) {
          // Phase terminée
          if (phase === 'work') {
            // Round terminé
            if (typeof onRoundComplete === 'function') {
              onRoundComplete(currentRound);
            }

            if (currentRound >= rounds) {
              // Tous les rounds terminés
              notifyPhaseChange();
              if (typeof onComplete === 'function') {
                onComplete();
              }
              setIsRunning(false);
              return 0;
            }

            // Passer au repos
            notifyPhaseChange();
            setPhase('rest');
            return restDuration;
          } else {
            // Repos terminé, passer au prochain round
            notifyPhaseChange();
            setPhase('work');
            setCurrentRound(r => r + 1);
            return workDuration;
          }
        }

        return next;
      });
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused, phase, currentRound, rounds, workDuration, restDuration, onRoundComplete, onComplete, notifyPhaseChange]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentRound(1);
    setPhase('work');
    setTimeLeft(workDuration);
  }, [workDuration]);

  const skip = useCallback(() => {
    if (phase === 'work') {
      if (typeof onRoundComplete === 'function') {
        onRoundComplete(currentRound);
      }

      if (currentRound >= rounds) {
        notifyPhaseChange();
        if (typeof onComplete === 'function') {
          onComplete();
        }
        setIsRunning(false);
        return;
      }

      notifyPhaseChange();
      setPhase('rest');
      setTimeLeft(restDuration);
    } else {
      notifyPhaseChange();
      setPhase('work');
      setCurrentRound(r => r + 1);
      setTimeLeft(workDuration);
    }
  }, [phase, currentRound, rounds, workDuration, restDuration, onRoundComplete, onComplete, notifyPhaseChange]);

  return {
    isRunning,
    isPaused,
    currentRound,
    totalRounds: rounds,
    phase,
    timeLeft,
    start,
    pause,
    resume,
    reset,
    skip,
  };
}
