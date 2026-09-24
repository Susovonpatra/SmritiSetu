import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, Volume2, ArrowRight } from 'lucide-react';
import { useElderlyTouch } from '../hooks/useElderlyTouch';
import { speakCognitivePrompt } from '../services/speechController';
import { useLocale } from '../context/LocaleContext';
import { db } from '../db/db';

const ROUTINE_STEPS = [
  {
    id: 'tea',
    order: 1,
    title_or: '୧. ସକାଳ ଚା ପିଇବା',
    title_gu: '૧. સવારની ચા પીવી',
    title_as: 'ৰাতিপুৱাৰ চাহ খোৱা',
    title_en: '1. Drink Morning Tea',
    image: '/assets/images/tea_cup.svg',
    hint_or: 'ପ୍ରଥମେ ଗରମ ଚା ପିଇବା',
    hint_gu: 'પહેલા ગરમ ચા પીવો',
    hint_as: 'প্ৰথমে চাহ খাওঁ',
    hint_en: 'First, hot cup of morning tea'
  },
  {
    id: 'walk',
    order: 2,
    title_or: '୨. ସକାଳ ଭ୍ରମଣ (ଖୋଜ କାଢ଼ିବା)',
    title_gu: '૨. સવારનું ભ્રમણ (ચાલવું)',
    title_as: 'ৰাতিপুৱা খোজ কঢ়া',
    title_en: '2. Morning Walk',
    image: '/assets/images/walking_shoes.svg',
    hint_or: 'ତା’ପରେ ବଗିଚାରେ ଚାଲିବା',
    hint_gu: 'ત્યારબાદ થોડું ચાલવું',
    hint_as: 'তাৰ পিছত বাৰীত খোজ কাঢ়োঁ',
    hint_en: 'Then, leisurely morning walk'
  },
  {
    id: 'medicine',
    order: 3,
    title_or: '୩. ଡାକ୍ତରୀ ଔଷଧ ଖାଇବା',
    title_gu: '૩. નિયમિત દવા લેવી',
    title_as: 'নিয়মীয়া ঔষধ লোৱা',
    title_en: '3. Take Morning Medicine',
    image: '/assets/images/medicine_box.svg',
    hint_or: 'ଶେଷରେ ପାଣି ସହ ଔଷଧ ଖାଇବା',
    hint_gu: 'છેલ્લે પાણી સાથે દવા લેવી',
    hint_as: 'শেষত ঔষধ পানীৰে খাওঁ',
    hint_en: 'Finally, prescribed morning medicine'
  }
];

export function DailyRoutineGame({ onComplete }) {
  const { activeLang, t } = useLocale();

  const [availableBlocks, setAvailableBlocks] = useState(() => 
    [...ROUTINE_STEPS].sort(() => 0.5 - Math.random())
  );
  const [selectedSequence, setSelectedSequence] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const getStepTitle = (step) => {
    if (activeLang === 'or') return step.title_or || step.title_en;
    if (activeLang === 'gu') return step.title_gu || step.title_en;
    if (activeLang === 'as') return step.title_as || step.title_en;
    return step.title_en;
  };

  const getStepHint = (step) => {
    if (activeLang === 'or') return step.hint_or || step.hint_en;
    if (activeLang === 'gu') return step.hint_gu || step.hint_en;
    if (activeLang === 'as') return step.hint_as || step.hint_en;
    return step.hint_en;
  };

  const { registerPromptEnd, handlePointerDown, handlePointerUp } = useElderlyTouch({
    debounceMs: 350,
    onValidTap: async (tappedBlock, metrics) => {
      if (selectedSequence.find(b => b.id === tappedBlock.id)) return;

      const newSequence = [...selectedSequence, tappedBlock];
      setSelectedSequence(newSequence);

      if (newSequence.length === ROUTINE_STEPS.length) {
        const isAllCorrect = newSequence.every((block, idx) => block.order === idx + 1);

        setFeedback({
          correct: isAllCorrect,
          message: isAllCorrect
            ? t('games.routineSuccess')
            : t('games.routineMixed')
        });

        try {
          await db.telemetry.add({
            patient_id: 1,
            game_type: 'routine_sequencer',
            timestamp: new Date().toISOString(),
            latency_ms: metrics.latencyMs,
            jitter_px: metrics.jitterPx,
            accuracy_score: isAllCorrect ? 1.0 : 0.5,
            source: 'PWA'
          });
        } catch (err) {
          console.error(err);
        }

        const voiceMsg = isAllCorrect ? t('games.routineSuccess') : t('games.routineMixed');
        speakCognitivePrompt(voiceMsg, activeLang);

        if (onComplete) onComplete();
      }
    }
  });

  const handleReset = () => {
    setSelectedSequence([]);
    setFeedback(null);
    setAvailableBlocks([...ROUTINE_STEPS].sort(() => 0.5 - Math.random()));
  };

  const handleHearPrompt = () => {
    setIsSpeaking(true);
    let promptMsg = 'Tap the routine blocks in daily order: Morning Tea, Morning Walk, then Medicine.';
    if (activeLang === 'or') {
      promptMsg = 'ଆପଣଙ୍କ ସକାଳର ନିୟମ ଅନୁସାରେ ଗୋଟିଏ ପରେ ଗୋଟିଏ ଛୁଅନ୍ତୁ: ଚା, ଭ୍ରମଣ, ଏବଂ ଔଷଧ।';
    } else if (activeLang === 'gu') {
      promptMsg = 'તમારા સવારના ક્રમ મુજબ એક પછી એક સ્પર્શ કરો: ચા, ચાલવું અને દવા.';
    } else if (activeLang === 'as') {
      promptMsg = 'আপোনাৰ ৰাতিপুৱাৰ নিয়ম অনুসৰি এটাকৈ স্পৰ্শ কৰক: চাহ, খোজ কঢ়া, আৰু ঔষধ।';
    }

    speakCognitivePrompt(promptMsg, activeLang, () => {
      setIsSpeaking(false);
      registerPromptEnd(Date.now());
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white rounded-3xl border-4 border-zinc-900 shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-3 border-zinc-200 pb-4 mb-6">
        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-sm mb-1">
            Modality 2: Zero-Friction Cognitive Sequencer
          </span>
          <h2 className="text-3xl font-black text-zinc-900">
            {t('games.routineTitle')}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="min-h-[56px] px-5 rounded-xl border-2 border-zinc-900 bg-zinc-100 hover:bg-zinc-200 flex items-center gap-2 font-bold text-lg"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Zero Drag-and-Drop Explanation Banner */}
      <div className="p-6 rounded-2xl bg-amber-50 border-3 border-amber-800 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4px_0_#92400E]">
        <div>
          <p className="text-amber-950 font-black text-xl">
            {t('games.routineSubtitle')}
          </p>
          <p className="text-sm font-semibold text-amber-900 mt-1">
            Zero Drag-and-Drop: Simply tap cards in morning sequence (1 → 2 → 3)
          </p>
        </div>
        <button
          onClick={handleHearPrompt}
          disabled={isSpeaking}
          className="min-h-[64px] px-6 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-black text-lg flex items-center gap-2 border-3 border-zinc-900 shadow-[0_4px_0_#18181B] active:translate-y-1 transition-all"
        >
          <Volume2 className={`w-6 h-6 ${isSpeaking ? 'animate-pulse text-amber-300' : 'text-white'}`} />
          <span>{isSpeaking ? 'Speaking...' : t('games.replayVoice')}</span>
        </button>
      </div>

      {/* Available Blocks Pool */}
      <div className="mb-8">
        <h3 className="text-xl font-black text-zinc-900 mb-4">
          Tap an activity below to place it into your daily timeline:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {availableBlocks.map((block) => {
            const isChosen = selectedSequence.find(b => b.id === block.id);
            return (
              <button
                key={block.id}
                disabled={!!isChosen || !!feedback}
                onPointerDown={handlePointerDown}
                onPointerUp={(e) => handlePointerUp(e, block)}
                className={`min-h-[160px] p-5 rounded-3xl flex flex-col items-center justify-center text-center transition-all duration-150 border-4 select-none
                  ${isChosen 
                    ? 'opacity-40 bg-zinc-200 border-zinc-400 cursor-not-allowed' 
                    : 'bg-white border-zinc-900 hover:border-amber-700 hover:bg-amber-50 shadow-[0_6px_0_#18181B] active:translate-y-1 active:shadow-[0_2px_0_#18181B] cursor-pointer'
                  }`}
              >
                <div className="w-20 h-20 mb-3 flex items-center justify-center">
                  <img src={block.image} alt={block.title_en} className="w-full h-full object-contain pointer-events-none" />
                </div>
                <span className="text-xl font-black text-zinc-950 block">
                  {getStepTitle(block)}
                </span>
                <span className="text-xs font-semibold text-zinc-600 mt-1">
                  {getStepHint(block)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Sequence Slots */}
      <div className="p-6 rounded-3xl bg-zinc-100 border-3 border-zinc-400 mb-6">
        <h3 className="text-xl font-black text-zinc-900 mb-4">
          Your Ordered Morning Timeline:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[0, 1, 2].map((slotIdx) => {
            const item = selectedSequence[slotIdx];
            return (
              <div
                key={slotIdx}
                className={`min-h-[100px] p-4 rounded-2xl border-3 flex items-center gap-4 ${
                  item 
                    ? 'bg-white border-zinc-900 shadow-[0_4px_0_#18181B]' 
                    : 'bg-zinc-200 border-dashed border-zinc-400 justify-center'
                }`}
              >
                {item ? (
                  <>
                    <span className="w-8 h-8 rounded-full bg-amber-800 text-white font-black flex items-center justify-center text-base shrink-0">
                      {slotIdx + 1}
                    </span>
                    <div className="text-left">
                      <span className="text-lg font-black text-zinc-950 block">
                        {getStepTitle(item)}
                      </span>
                      <span className="text-xs font-bold text-zinc-600">
                        Step {slotIdx + 1}
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-zinc-500 font-bold text-base">
                    Step {slotIdx + 1} (Waiting for tap)
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-6 rounded-2xl border-3 flex items-center justify-between gap-4 ${
          feedback.correct 
            ? 'bg-emerald-100 border-emerald-800 text-emerald-950' 
            : 'bg-rose-100 border-rose-800 text-rose-950'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 shrink-0 text-emerald-800" />
            <span className="text-2xl font-black">{feedback.message}</span>
          </div>
          <button
            onClick={handleReset}
            className="min-h-[56px] px-6 rounded-xl bg-zinc-900 text-white font-bold text-lg hover:bg-zinc-800"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
