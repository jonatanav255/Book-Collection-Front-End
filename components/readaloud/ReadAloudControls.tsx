'use client';

import React, { useState } from 'react';
import { Play, Pause, Square, Settings, Volume2 } from 'lucide-react';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';

interface ReadAloudControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  speed: number;
  voice: SpeechSynthesisVoice | null;
  voices: SpeechSynthesisVoice[];
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onSpeedChange: (speed: number) => void;
  onVoiceChange: (voice: SpeechSynthesisVoice) => void;
}

export function ReadAloudControls({
  isPlaying,
  isPaused,
  speed,
  voice,
  voices,
  onPlay,
  onPause,
  onResume,
  onStop,
  onSpeedChange,
  onVoiceChange,
}: ReadAloudControlsProps) {
  const [showSettings, setShowSettings] = useState(false);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const handlePlayPause = () => {
    if (!isPlaying) {
      onPlay();
    } else if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  return (
    <>
      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 border border-gray-200 dark:border-gray-700">
        {/* Play/Pause Button */}
        <button
          onClick={handlePlayPause}
          className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          title={!isPlaying ? 'Play' : isPaused ? 'Resume' : 'Pause'}
        >
          {!isPlaying || isPaused ? (
            <Play className="w-5 h-5" fill="currentColor" />
          ) : (
            <Pause className="w-5 h-5" fill="currentColor" />
          )}
        </button>

        {/* Stop Button */}
        {isPlaying && (
          <button
            onClick={onStop}
            className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
            title="Stop"
          >
            <Square className="w-5 h-5" fill="currentColor" />
          </button>
        )}

        {/* Status */}
        <div className="flex items-center gap-2 px-3 text-sm">
          <Volume2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300">
            {isPlaying ? (isPaused ? 'Paused' : 'Playing') : 'Ready'}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {speed}x
          </span>
        </div>

        {/* Settings Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="ml-auto p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Read Aloud Settings"
        >
          <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Read Aloud Settings"
        size="md"
      >
        <div className="space-y-6">
          {/* Speed Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Playback Speed
            </label>
            <div className="grid grid-cols-6 gap-2">
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    speed === s
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Voice
            </label>
            <select
              value={voice?.name || ''}
              onChange={(e) => {
                const selected = voices.find((v) => v.name === e.target.value);
                if (selected) onVoiceChange(selected);
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {voices.length} voice{voices.length !== 1 ? 's' : ''} available
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Read Aloud will automatically advance to the next page when finished reading
              the current page.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
