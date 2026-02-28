'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Timer as TimerIcon, Play, Pause, Square, RotateCcw, X, Settings } from 'lucide-react';
import { useLanguage } from '@/i18n';

/**
 * Timer mode types
 * - countdown: Count down from a set time to zero
 * - countup: Count up from zero to track total time
 * - pomodoro: Pomodoro technique with work/break cycles
 */
export type TimerMode = 'countdown' | 'countup' | 'pomodoro';

/**
 * Timer component props
 */
interface TimerProps {
  isOpen: boolean;  // Whether the timer modal is visible
  onClose: () => void;  // Callback to close the timer modal
  onOpen?: () => void;  // Callback to reopen the timer modal from compact view
  onRunningChange?: (isRunning: boolean) => void;  // Callback when timer running state changes
}

/**
 * Pomodoro timer settings
 */
interface PomodoroSettings {
  workMinutes: number;  // Duration of work sessions (default: 25)
  shortBreakMinutes: number;  // Duration of short breaks (default: 5)
  longBreakMinutes: number;  // Duration of long breaks (default: 15)
  sessionsUntilLongBreak: number;  // Work sessions before long break (default: 4)
}

/**
 * Reading Timer Component
 *
 * Provides three timer modes for focused reading:
 * 1. Countdown: Set a specific reading duration
 * 2. Count-up: Track total reading time
 * 3. Pomodoro: Use the Pomodoro Technique with work/break intervals
 *
 * Features:
 * - Browser notifications when timer completes
 * - Audio alerts
 * - Progress bars for countdown/Pomodoro modes
 * - Session tracking for Pomodoro
 */
export function Timer({ isOpen, onClose, onOpen, onRunningChange }: TimerProps) {
  const { t } = useLanguage();

  // Timer mode and running state
  const [mode, setMode] = useState<TimerMode>('countdown');
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Notify parent when running state changes
  useEffect(() => {
    onRunningChange?.(isRunning);
  }, [isRunning, onRunningChange]);

  // Countdown timer state (total seconds)
  const [countdownTotalSeconds, setCountdownTotalSeconds] = useState(25 * 60);

  // Count-up timer state (total seconds elapsed)
  const [countUpSeconds, setCountUpSeconds] = useState(0);

  // Pomodoro timer state
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    workMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    sessionsUntilLongBreak: 4,
  });
  const [pomodoroPhase, setPomodoroPhase] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [pomodoroSessionCount, setPomodoroSessionCount] = useState(0);  // Track completed work sessions
  const [pomodoroSeconds, setPomodoroSeconds] = useState(pomodoroSettings.workMinutes * 60);

  // Ref for interval
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Main timer logic - runs every second when timer is active
   * Handles countdown, count-up, and Pomodoro timer modes
   */
  useEffect(() => {
    if (isRunning) {
      // Update timer every second based on current mode
      intervalRef.current = setInterval(() => {
        if (mode === 'countdown') {
          // Countdown mode: Decrement total seconds
          setCountdownTotalSeconds((prev) => {
            if (prev <= 0) {
              handleTimerComplete();
              return 0;
            }
            return prev - 1;
          });
        } else if (mode === 'countup') {
          // Count-up mode: Simply increment seconds
          setCountUpSeconds((prev) => prev + 1);
        } else if (mode === 'pomodoro') {
          // Pomodoro mode: Decrement seconds for current phase
          setPomodoroSeconds((prev) => {
            if (prev === 0) {
              handlePomodoroComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      // Clear interval when timer is paused
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, mode]);

  /**
   * Handle countdown timer completion
   * Plays sound and shows notification
   */
  const handleTimerComplete = () => {
    setIsRunning(false);
    playSound();
    if (Notification.permission === 'granted') {
      new Notification(t('timer.timerComplete'), {
        body: t('timer.timerCompleteBody'),
        icon: '/icon.png',
      });
    }
  };

  /**
   * Start timer and close modal
   */
  const handleStart = () => {
    setIsRunning(true);
    onClose(); // Close the modal when starting
  };

  /**
   * Handle Pomodoro phase completion
   * Transitions between work sessions and breaks
   * - After work: Short break (or long break after 4 sessions)
   * - After break: Return to work session
   */
  const handlePomodoroComplete = () => {
    setIsRunning(false);
    playSound();

    if (pomodoroPhase === 'work') {
      const newSessionCount = pomodoroSessionCount + 1;
      setPomodoroSessionCount(newSessionCount);

      if (newSessionCount % pomodoroSettings.sessionsUntilLongBreak === 0) {
        setPomodoroPhase('longBreak');
        setPomodoroSeconds(pomodoroSettings.longBreakMinutes * 60);
        if (Notification.permission === 'granted') {
          new Notification(t('timer.timeForLongBreak'), {
            body: t('timer.longBreakBody', { minutes: pomodoroSettings.longBreakMinutes }),
          });
        }
      } else {
        setPomodoroPhase('shortBreak');
        setPomodoroSeconds(pomodoroSettings.shortBreakMinutes * 60);
        if (Notification.permission === 'granted') {
          new Notification(t('timer.timeForBreak'), {
            body: t('timer.shortBreakBody', { minutes: pomodoroSettings.shortBreakMinutes }),
          });
        }
      }
    } else {
      setPomodoroPhase('work');
      setPomodoroSeconds(pomodoroSettings.workMinutes * 60);
      if (Notification.permission === 'granted') {
        new Notification(t('timer.breakOver'), {
          body: t('timer.breakOverBody', { minutes: pomodoroSettings.workMinutes }),
        });
      }
    }
  };

  /**
   * Play timer completion sound using Web Audio API
   * Creates a pleasant 2-second chime at 50% volume
   */
  const playSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const masterGain = audioContext.createGain();
      masterGain.gain.value = 0.5; // 50% volume
      masterGain.connect(audioContext.destination);

      // Create a pleasant three-tone chime
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Envelope: fade in and fade out
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;
      // Pleasant chime: C5, E5, G5 (major chord)
      playTone(523.25, now, 0.8);           // C5
      playTone(659.25, now + 0.15, 0.9);    // E5
      playTone(783.99, now + 0.3, 1.2);     // G5
    } catch {
      // Audio play failed silently
    }
  };

  /**
   * Request browser notification permission from user
   * Only requests if notifications are supported and not already granted/denied
   */
  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  /**
   * Reset timer to initial state based on current mode
   * - Countdown: Resets to 25:00
   * - Count-up: Resets to 0:00
   * - Pomodoro: Resets to work phase with session count cleared
   */
  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'countdown') {
      setCountdownTotalSeconds(25 * 60);
    } else if (mode === 'countup') {
      setCountUpSeconds(0);
    } else if (mode === 'pomodoro') {
      setPomodoroPhase('work');
      setPomodoroSessionCount(0);
      setPomodoroSeconds(pomodoroSettings.workMinutes * 60);
    }
  };

  /**
   * Format seconds into time string (HH:MM:SS or MM:SS)
   * @param totalSeconds - Total seconds to format
   * @returns Formatted time string
   */
  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    // Include hours only if > 0
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Get current time display string based on active timer mode
   * @returns Formatted time string for current mode
   */
  const getCurrentTime = (): string => {
    if (mode === 'countdown') {
      return formatTime(countdownTotalSeconds);
    } else if (mode === 'countup') {
      return formatTime(countUpSeconds);
    } else {
      return formatTime(pomodoroSeconds);
    }
  };

  /**
   * Calculate progress percentage for progress bar
   * Returns 0-100 percentage for countdown and Pomodoro modes
   * Count-up mode doesn't use progress bar, so returns 0
   * @returns Progress percentage (0-100)
   */
  const getProgress = (): number => {
    if (mode === 'countdown') {
      const total = 25 * 60; // Default 25 minutes
      return ((total - countdownTotalSeconds) / total) * 100;
    } else if (mode === 'pomodoro') {
      // Calculate progress based on current phase duration
      let total = pomodoroSettings.workMinutes * 60;
      if (pomodoroPhase === 'shortBreak') total = pomodoroSettings.shortBreakMinutes * 60;
      if (pomodoroPhase === 'longBreak') total = pomodoroSettings.longBreakMinutes * 60;
      return ((total - pomodoroSeconds) / total) * 100;
    }
    return 0;  // Count-up mode has no progress bar
  };

  // Show compact view when running or paused (hasStarted) but modal is closed
  const hasStarted = isRunning || (mode === 'countdown' && countdownTotalSeconds < 25 * 60 && countdownTotalSeconds > 0)
    || (mode === 'countup' && countUpSeconds > 0)
    || (mode === 'pomodoro' && pomodoroSeconds < pomodoroSettings.workMinutes * 60);

  if (hasStarted && !isOpen) {
    return (
      <div className="fixed top-3 right-2 sm:right-48 z-50">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
          <button
            onClick={onOpen}
            className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title={t('timer.openTimer')}
          >
            {getCurrentTime()}
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
            title={isRunning ? t('timer.pauseTimer') : t('timer.continueTimer')}
          >
            {isRunning ? (
              <Pause className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <Play className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          <button
            onClick={handleReset}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
            title={t('timer.stopTimer')}
          >
            <Square className="w-4 h-4 text-red-500 dark:text-red-400" />
          </button>
        </div>
      </div>
    );
  }

  // Full modal view for setup and configuration
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - click to close */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      {/* Timer modal */}
      <div className="fixed top-4 right-2 left-2 sm:left-auto sm:right-8 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full sm:w-80 p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TimerIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t('timer.readingTimer')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-1 mb-4">
          <button
            onClick={() => setMode('countdown')}
            disabled={isRunning}
            className={`flex-1 py-1.5 px-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'countdown'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t('timer.countdown')}
          </button>
          <button
            onClick={() => setMode('countup')}
            disabled={isRunning}
            className={`flex-1 py-1.5 px-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'countup'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t('timer.countUp')}
          </button>
          <button
            onClick={() => setMode('pomodoro')}
            disabled={isRunning}
            className={`flex-1 py-1.5 px-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'pomodoro'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t('timer.pomodoro')}
          </button>
        </div>

        {/* Pomodoro Phase Indicator */}
        {mode === 'pomodoro' && (
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <div className={`w-2 h-2 rounded-full ${
                pomodoroPhase === 'work' ? 'bg-red-500' : 'bg-green-500'
              }`} />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {pomodoroPhase === 'work' ? t('timer.workSession') : pomodoroPhase === 'shortBreak' ? t('timer.shortBreak') : t('timer.longBreak')}
              </span>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                ({pomodoroSessionCount % pomodoroSettings.sessionsUntilLongBreak}/{pomodoroSettings.sessionsUntilLongBreak})
              </span>
            </div>
          </div>
        )}

        {/* Timer Display */}
        <div className="mb-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 font-mono">
              {getCurrentTime()}
            </div>
          </div>
        </div>

        {/* Countdown Settings */}
        {mode === 'countdown' && !isRunning && (
          <div className="mb-4 flex items-center justify-center gap-3">
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">{t('timer.minutes')}</label>
              <input
                type="text"
                inputMode="numeric"
                value={Math.floor(countdownTotalSeconds / 60).toString()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  if (raw === '') {
                    const seconds = countdownTotalSeconds % 60;
                    setCountdownTotalSeconds(seconds);
                    return;
                  }
                  const minutes = parseInt(raw);
                  const seconds = countdownTotalSeconds % 60;
                  setCountdownTotalSeconds(minutes * 60 + seconds);
                }}
                onBlur={() => {
                  const minutes = Math.max(0, Math.min(180, Math.floor(countdownTotalSeconds / 60)));
                  const seconds = countdownTotalSeconds % 60;
                  setCountdownTotalSeconds(minutes * 60 + seconds);
                }}
                className="w-16 px-2 py-1.5 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">{t('timer.seconds')}</label>
              <input
                type="text"
                inputMode="numeric"
                value={(countdownTotalSeconds % 60).toString()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  if (raw === '') {
                    const minutes = Math.floor(countdownTotalSeconds / 60);
                    setCountdownTotalSeconds(minutes * 60);
                    return;
                  }
                  const minutes = Math.floor(countdownTotalSeconds / 60);
                  const seconds = parseInt(raw);
                  setCountdownTotalSeconds(minutes * 60 + seconds);
                }}
                onBlur={() => {
                  const minutes = Math.floor(countdownTotalSeconds / 60);
                  const seconds = Math.max(0, Math.min(59, countdownTotalSeconds % 60));
                  setCountdownTotalSeconds(minutes * 60 + seconds);
                }}
                className="w-16 px-2 py-1.5 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        )}

        {/* Pomodoro Settings */}
        {mode === 'pomodoro' && showSettings && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('timer.pomodoroSettings')}</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t('timer.done')}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">{t('timer.workMin')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={pomodoroSettings.workMinutes}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (raw === '') return;
                    const value = parseInt(raw);
                    setPomodoroSettings({ ...pomodoroSettings, workMinutes: value });
                    if (pomodoroPhase === 'work') {
                      setPomodoroSeconds(value * 60);
                    }
                  }}
                  onBlur={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const value = Math.max(1, Math.min(90, parseInt(raw) || 25));
                    setPomodoroSettings({ ...pomodoroSettings, workMinutes: value });
                    if (pomodoroPhase === 'work') {
                      setPomodoroSeconds(value * 60);
                    }
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">{t('timer.shortBreakMin')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={pomodoroSettings.shortBreakMinutes}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (raw === '') return;
                    setPomodoroSettings({ ...pomodoroSettings, shortBreakMinutes: parseInt(raw) });
                  }}
                  onBlur={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const value = Math.max(1, Math.min(30, parseInt(raw) || 5));
                    setPomodoroSettings({ ...pomodoroSettings, shortBreakMinutes: value });
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">{t('timer.longBreakMin')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={pomodoroSettings.longBreakMinutes}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (raw === '') return;
                    setPomodoroSettings({ ...pomodoroSettings, longBreakMinutes: parseInt(raw) });
                  }}
                  onBlur={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const value = Math.max(1, Math.min(60, parseInt(raw) || 15));
                    setPomodoroSettings({ ...pomodoroSettings, longBreakMinutes: value });
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">{t('timer.sessionsUntilLongBreak')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={pomodoroSettings.sessionsUntilLongBreak}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (raw === '') return;
                    setPomodoroSettings({ ...pomodoroSettings, sessionsUntilLongBreak: parseInt(raw) });
                  }}
                  onBlur={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const value = Math.max(2, Math.min(10, parseInt(raw) || 4));
                    setPomodoroSettings({ ...pomodoroSettings, sessionsUntilLongBreak: value });
                  }}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>
        )}

        {/* Pomodoro Settings Button */}
        {mode === 'pomodoro' && !showSettings && !isRunning && (
          <div className="mb-4 text-center">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 mx-auto text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              <Settings className="w-3 h-3" />
              {t('timer.customizePomodoro')}
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => isRunning ? setIsRunning(false) : handleStart()}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                {t('timer.pauseTimer')}
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {t('timer.start')}
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            {t('timer.reset')}
          </button>
        </div>

        {/* Notification Permission */}
        {Notification.permission === 'default' && (
          <button
            onClick={requestNotificationPermission}
            className="w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('timer.enableNotifications')}
          </button>
        )}
        </div>
      </div>
    </>
  );
}
