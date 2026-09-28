import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, CheckCircle2, RotateCcw, Activity } from 'lucide-react';
import { useElderlyTouch } from '../hooks/useElderlyTouch';
import { speakCognitivePrompt, cancelSpeech } from '../services/speechController';
import { useLocale } from '../context/LocaleContext';
import { db } from '../db/db';

const CULTURAL_ITEMS = [
  {
    id: 'japi',
    name_or: 'ଜାପି / ଛତା (Japi)',
    name_gu: 'ટોપી / છત્ર (Japi)',
    name_as: 'জাপি (Japi)',
    name_en: 'Japi (Conical Sunshade)',
    image: '/assets/images/japi.svg',
    prompt_or: 'ଜାପି କିମ୍ବା ଛତା ଉପରେ ସ୍ପର୍ଶ କରନ୍ତୁ',
    prompt_gu: 'છત્ર અથવા ટોપી પર સ્પર્શ કરો',
    prompt_as: 'জাপিটোত স্পৰ্শ কৰক',
    prompt_en: 'Tap the Japi'
  },
  {
    id: 'xorai',
    name_or: 'ପୂଜା ଥାଳି (Xorai)',
    name_gu: 'પૂજા થાળી (Xorai)',
    name_as: 'শৰাই (Xorai)',
    name_en: 'Xorai (Offering Tray)',
    image: '/assets/images/xorai.svg',
    prompt_or: 'ପୂଜା ଥାଳି ଉପରେ ସ୍ପର୍ଶ କରନ୍ତୁ',
    prompt_gu: 'પૂજા થાળી પર સ્પર્શ કરો',
    prompt_as: 'শৰাইখনত স্পৰ্শ কৰক',
    prompt_en: 'Tap the Xorai'
  },
  {
    id: 'bihu_dhol',
    name_or: 'ଢୋଲ / ବାଦ୍ୟ (Dhol)',
    name_gu: 'ઢોલ (Dhol)',
    name_as: 'বিহু ঢোল (Bihu Dhol)',
    name_en: 'Bihu Dhol (Drum)',
    image: '/assets/images/bihu_dhol.svg',
    prompt_or: 'ଢୋଲ ଉପରେ ସ୍ପର୍ଶ କରନ୍ତୁ',
    prompt_gu: 'ઢોલ પર સ્પર્શ કરો',
    prompt_as: 'বিহু ঢোলটোত স্পৰ্শ কৰক',
    prompt_en: 'Tap the Bihu Dhol'
  },
  {
    id: 'pepa',
    name_or: 'ବଂଶୀ (Flute)',
    name_gu: 'વાંસળી (Flute)',
    name_as: 'পেঁপা (Pepa)',
    name_en: 'Pepa (Horn Flute)',
    image: '/assets/images/pepa.svg',
    prompt_or: 'ବଂଶୀ ଉପରେ ସ୍ପର୍ଶ କରନ୍ତୁ',
    prompt_gu: 'વાંસળી પર સ્પર્શ કરો',
    prompt_as: 'পেঁপাটিত স্পৰ্শ কৰক',
    prompt_en: 'Tap the Pepa'
  },
  {
    id: 'gamosa',
    name_or: 'ଗାମୁଛା (Gamosa)',
    name_gu: 'ખેસ / રૂમાલ (Gamosa)',
    name_as: 'গামোচা (Gamosa)',
    name_en: 'Gamosa (Cultural Scarf)',
    image: '/assets/images/gamosa.svg',
    prompt_or: 'ଗାମୁଛା ଉପରେ ସ୍ପର୍ଶ କରନ୍ତୁ',
    prompt_gu: 'ખેસ પર સ્પર્શ કરો',
    prompt_as: 'গামোচাত স্পৰ্শ কৰক',
    prompt_en: 'Tap the Gamosa'
  }
];

export function VisualSemanticGame({ onGameComplete }) {
  const { activeLang, t } = useLocale();
  const [targetItem, setTargetItem] = useState(CULTURAL_ITEMS[0]);
  const [candidateItems, setCandidateItems] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [round, setRound] = useState(1);
  const [totalRounds] = useState(5);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Helper to extract localized prompt for item
  const getItemPrompt = useCallback((item, lang) => {
    if (lang === 'or') return item.prompt_or || item.prompt_en;
    if (lang === 'gu') return item.prompt_gu || item.prompt_en;
    if (lang === 'as') return item.prompt_as || item.prompt_en;
    return item.prompt_en;
  }, []);

  // Helper to extract localized name for item
  const getItemName = useCallback((item, lang) => {
    if (lang === 'or') return item.name_or || item.name_en;
    if (lang === 'gu') return item.name_gu || item.name_en;
    if (lang === 'as') return item.name_as || item.name_en;
    return item.name_en;
  }, []);

  const { registerPromptEnd, handlePointerDown, handlePointerUp, lastMetrics } = useElderlyTouch({
    debounceMs: 400,
    onValidTap: async (selectedItem, metrics) => {
      const isCorrect = selectedItem.id === targetItem.id;
      setFeedback({
        selectedId: selectedItem.id,
        correct: isCorrect
      });

      // Telemetry log to Dexie
      try {
        await db.telemetry.add({
          patient_id: 1,
          game_type: 'visual_matching',
          timestamp: new Date().toISOString(),
          latency_ms: metrics.latencyMs,
          jitter_px: metrics.jitterPx,
          accuracy_score: isCorrect ? 1.0 : 0.0,
          source: 'PWA'
        });
      } catch (err) {
        console.error('Dexie telemetry write error:', err);
      }

      // Bilingual Audio feedback
      const feedbackText = isCorrect
        ? t('games.correctFeedback')
        : t('games.tryAgainFeedback');

      speakCognitivePrompt(feedbackText, activeLang);

      // Next round after delay
      setTimeout(() => {
        if (round < totalRounds) {
          setRound(r => r + 1);
          startNewRound();
        } else {
          if (onGameComplete) onGameComplete();
        }
      }, 1600);
    }
  });

  const startNewRound = useCallback(() => {
    setFeedback(null);
    cancelSpeech();

    const randomTarget = CULTURAL_ITEMS[Math.floor(Math.random() * CULTURAL_ITEMS.length)];
    setTargetItem(randomTarget);

    const others = CULTURAL_ITEMS.filter(i => i.id !== randomTarget.id);
    const shuffledOthers = others.sort(() => 0.5 - Math.random()).slice(0, 2);
    const options = [randomTarget, ...shuffledOthers].sort(() => 0.5 - Math.random());
    setCandidateItems(options);

    // Speak audio prompt in active language
    const promptText = getItemPrompt(randomTarget, activeLang);
    setIsSpeaking(true);
    speakCognitivePrompt(promptText, activeLang, () => {
      setIsSpeaking(false);
      registerPromptEnd(Date.now());
    });
  }, [activeLang, getItemPrompt, registerPromptEnd]);

  useEffect(() => {
    startNewRound();
  }, [activeLang]);

  const handlePlayAudioAgain = () => {
    const promptText = getItemPrompt(targetItem, activeLang);
    setIsSpeaking(true);
    speakCognitivePrompt(promptText, activeLang, () => {
      setIsSpeaking(false);
      registerPromptEnd(Date.now());
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-3.5 sm:p-6 bg-white rounded-3xl border-2 sm:border-4 border-zinc-900 shadow-xl">
      {/* Game Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 sm:border-b-3 border-zinc-200 pb-3 sm:pb-4 mb-4 sm:mb-6">
        <div>
          <span className="inline-block px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs sm:text-sm mb-1">
            Modality 1: Bilingual Semantic Matching
          </span>
          <h2 className="text-xl sm:text-3xl font-black text-zinc-900">
            {t('games.visualTitle')}
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-sm sm:text-xl font-bold px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-zinc-100 border-2 border-zinc-400">
            Round {round} / {totalRounds}
          </span>
          <button
            onClick={startNewRound}
            className="min-h-[44px] sm:min-h-[56px] px-3 sm:px-4 rounded-xl border-2 border-zinc-900 bg-zinc-100 hover:bg-zinc-200 flex items-center gap-1.5 sm:gap-2 font-bold cursor-pointer"
            title="Reset Round"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-800" />
            <span className="text-xs sm:text-sm">Reset</span>
          </button>
        </div>
      </div>

      {/* Audio Prompt Banner (Oversized 72px target) */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#FFFDF7] border-2 sm:border-3 border-emerald-800 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shadow-[0_4px_0_#065F46]">
        <div className="text-center sm:text-left min-w-0">
          <p className="text-zinc-600 font-semibold text-sm sm:text-lg">
            {t('games.visualSubtitle')}
          </p>
          <p className="text-2xl sm:text-4xl font-black text-emerald-950 mt-1 leading-tight break-words">
            "{getItemPrompt(targetItem, activeLang)}"
          </p>
        </div>
        <button
          onClick={handlePlayAudioAgain}
          disabled={isSpeaking}
          title={t('games.replayVoice')}
          aria-label={t('games.replayVoice')}
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white flex items-center justify-center border-2 sm:border-3 border-zinc-900 shadow-[0_4px_0_#18181B] active:translate-y-1 active:shadow-none transition-all shrink-0 cursor-pointer"
        >
          <Volume2 className={`w-5 h-5 sm:w-7 sm:h-7 ${isSpeaking ? 'animate-pulse text-amber-300' : 'text-white'}`} />
        </button>
      </div>

      {/* Oversized Cultural Cards (72px+ minimum touch target, high contrast) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {candidateItems.map((item) => {
          const isSelected = feedback?.selectedId === item.id;
          const isCorrect = feedback?.correct && isSelected;
          const isWrong = feedback && !feedback.correct && isSelected;

          return (
            <button
              key={item.id}
              onPointerDown={handlePointerDown}
              onPointerUp={(e) => handlePointerUp(e, item)}
              disabled={!!feedback}
              className={`min-h-[170px] sm:min-h-[220px] rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center text-center transition-all duration-150 border-3 sm:border-4 cursor-pointer select-none
                ${isCorrect ? 'bg-emerald-100 border-emerald-700 scale-102 sm:scale-105 shadow-[0_6px_0_#047857]' : ''}
                ${isWrong ? 'bg-rose-100 border-rose-700 shadow-[0_6px_0_#BE123C]' : ''}
                ${!isSelected ? 'bg-white border-zinc-900 hover:border-emerald-800 hover:bg-zinc-50 shadow-[0_4px_0_#18181B] sm:shadow-[0_6px_0_#18181B] active:translate-y-1 active:shadow-[0_2px_0_#18181B]' : ''}
              `}
            >
              <div className="w-24 h-24 sm:w-32 sm:h-32 mb-2 sm:mb-4 flex items-center justify-center">
                <img
                  src={item.image}
                  alt={item.name_en}
                  className="w-full h-full object-contain pointer-events-none drop-shadow-md"
                />
              </div>
              <span className="text-lg sm:text-2xl font-black text-zinc-950 block">
                {getItemName(item, activeLang)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Real-time Geriatric Biomarker Telemetry Monitor */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-100 border-2 border-zinc-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 text-xs sm:text-base font-semibold text-zinc-700">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-800 shrink-0" />
          <span>Live Touch Biomarkers:</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
          <span>Latency: <strong className="text-zinc-900 font-mono">{lastMetrics.latencyMs} ms</strong></span>
          <span>Tremor: <strong className="text-zinc-900 font-mono">{lastMetrics.jitterPx} px</strong></span>
          <span className="text-[10px] sm:text-xs bg-zinc-200 px-2 py-0.5 rounded-md text-zinc-600">Debounced</span>
        </div>
      </div>
    </div>
  );
}
