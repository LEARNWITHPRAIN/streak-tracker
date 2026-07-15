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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Create beep function using AudioContext
  const playBeep = useCallback((isComplete: boolean = false) => {
    if (!settings.soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (required for user interaction policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const playTone = (frequency: number, delay: number, duration: number = 0.3) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + delay;
        gainNode.gain.setValueAtTime(0.5, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      if (isComplete) {
        // Play a more noticeable sound pattern for completion: 3 ascending beeps
        playTone(600, 0, 0.15);
        playTone(800, 0.2, 0.15);
        playTone(1000, 0.4, 0.3);
      } else {
        // Single beep for countdown
        playTone(800, 0, 0.2);
      }
      
      // Close context after sounds finish
      setTimeout(() => audioContext.close(), 1000);
    } catch (e) {
      console.log('Audio playback failed:', e);
    }
  }, [settings.soundEnabled]);

  // Store playBeep in ref so it's accessible in timer effect
  const playBeepRef = useRef(playBeep);
  useEffect(() => {
    playBeepRef.current = playBeep;
  }, [playBeep]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            // Play completion sound (more prominent)
            playBeepRef.current(true);
            return 0;
          }
          // Play tick sound at 3, 2, 1 seconds
          if (prev <= 4) {
            playBeepRef.current(false);
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
