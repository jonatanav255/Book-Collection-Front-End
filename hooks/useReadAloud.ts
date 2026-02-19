import { useState, useCallback, useEffect, useRef } from 'react';

interface UseReadAloudOptions {
  onPageComplete?: () => void;
}

export function useReadAloud(options: UseReadAloudOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Set default voice (prefer English)
      if (!voice && availableVoices.length > 0) {
        const englishVoice = availableVoices.find(v => v.lang.startsWith('en'));
        setVoice(englishVoice || availableVoices[0]);
      }
    };

    loadVoices();

    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [voice]);

  const speak = useCallback((text: string) => {
    if (!text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      options.onPageComplete?.();
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  }, [speed, voice, options]);

  const pause = useCallback(() => {
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPlaying, isPaused]);

  const resume = useCallback(() => {
    if (isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isPlaying, isPaused]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    }
  }, [isPlaying, isPaused, pause, resume]);

  const changeSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);

    // If currently playing, we need to restart with new speed
    if (isPlaying && utteranceRef.current) {
      const currentText = utteranceRef.current.text;
      stop();
      // Give a small delay before restarting
      setTimeout(() => speak(currentText), 100);
    }
  }, [isPlaying, speak, stop]);

  const changeVoice = useCallback((newVoice: SpeechSynthesisVoice) => {
    setVoice(newVoice);

    // If currently playing, restart with new voice
    if (isPlaying && utteranceRef.current) {
      const currentText = utteranceRef.current.text;
      stop();
      setTimeout(() => speak(currentText), 100);
    }
  }, [isPlaying, speak, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    isPlaying,
    isPaused,
    speed,
    voice,
    voices,
    speak,
    pause,
    resume,
    stop,
    togglePlayPause,
    changeSpeed,
    changeVoice,
  };
}
