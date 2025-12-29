import { useState, useEffect, useCallback, useRef } from 'react';
import { TimerSettings } from '@/types/exercise';

const DEFAULT_SETTINGS: TimerSettings = {
  restDuration: 60,
  soundEnabled: true,
};

export const useTimer = () => {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_SETTINGS.restDuration);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('timer-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      setTimeRemaining(parsed.restDuration);
    }
  }, []);

  // Create audio context for beep
  useEffect(() => {
    // Create a simple beep using Web Audio API or use a data URL
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create beep function
    const playBeep = () => {
      if (!settings.soundEnabled) return;
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    (window as any).playTimerBeep = playBeep;

    return () => {
      audioContext.close();
    };
  }, [settings.soundEnabled]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            if ((window as any).playTimerBeep) {
              (window as any).playTimerBeep();
            }
            return 0;
          }
          // Play tick sound at 3, 2, 1 seconds
          if (prev <= 4 && (window as any).playTimerBeep) {
            (window as any).playTimerBeep();
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const startTimer = useCallback(() => {
    setIsComplete(false);
    setTimeRemaining(settings.restDuration);
    setIsRunning(true);
  }, [settings.restDuration]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resumeTimer = useCallback(() => {
    if (timeRemaining > 0) {
      setIsRunning(true);
    }
  }, [timeRemaining]);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setIsComplete(false);
    setTimeRemaining(settings.restDuration);
  }, [settings.restDuration]);

  const updateSettings = useCallback((newSettings: Partial<TimerSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('timer-settings', JSON.stringify(updated));
    
    if (!isRunning) {
      setTimeRemaining(updated.restDuration);
    }
  }, [settings, isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = settings.restDuration > 0 
    ? ((settings.restDuration - timeRemaining) / settings.restDuration) * 100
    : 0;

  return {
    settings,
    isRunning,
    timeRemaining,
    isComplete,
    progress,
    formattedTime: formatTime(timeRemaining),
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    updateSettings,
  };
};
