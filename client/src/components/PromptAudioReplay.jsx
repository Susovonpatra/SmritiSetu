import React, { useState } from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { speakCognitivePrompt, cancelSpeech } from '../services/speechController';
import { useLocale } from '../context/LocaleContext';

/**
 * Dementia-Friendly Tactile Audio Prompt & Replay Button
 * - Extra-large 60px touch target
 * - Visual pulse feedback during playback
 * - Cancel/Replay capability
 */
export function PromptAudioReplay({
  text,
  label = 'Listen',
  className = '',
  size = 'default' // 'default' (60px) or 'large' (72px)
}) {
  const { activeLang } = useLocale();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = (e) => {
    e.stopPropagation();

    if (isPlaying) {
      cancelSpeech();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    speakCognitivePrompt(text, activeLang, () => {
      setIsPlaying(false);
    });
  };

  const isLarge = size === 'large';

  return (
    <button
      type="button"
      onClick={handleSpeak}
      aria-label={isPlaying ? 'Stop audio instruction' : `Replay audio instruction: ${text}`}
      className={`touch-card flex items-center justify-center gap-3 px-6 rounded-2xl font-black text-lg transition-all ${
        isPlaying
          ? 'bg-amber-100 text-amber-950 border-amber-800 shadow-[0_4px_0_#92400e] animate-pulse'
          : 'bg-[#064E3B] text-white border-zinc-950 shadow-[0_4px_0_#18181B] hover:bg-emerald-900'
      } ${isLarge ? 'min-h-[72px] text-xl' : 'min-h-[60px]'} ${className}`}
    >
      {isPlaying ? (
        <>
          <RotateCcw className="w-6 h-6 animate-spin text-amber-800" />
          <span>Speaking... (Tap to Stop)</span>
        </>
      ) : (
        <>
          <Volume2 className="w-7 h-7 text-emerald-300" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
