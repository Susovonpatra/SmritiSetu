import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, Volume2, ArrowRight } from 'lucide-react';
import { useElderlyTouch } from '../hooks/useElderlyTouch';
import { speakPrompt } from '../services/speechService';
import { db } from '../db/db';

const ROUTINE_STEPS = [
  {
    id: 'tea',
    order: 1,
    title_as: 'ৰাতিপুৱাৰ চাহ খোৱা',
    title_en: '1. Drink Morning Tea',
    image: '/assets/images/tea_cup.svg',
    hint_as: 'প্ৰথমে চাহ খাওঁ',
    hint_en: 'First, hot cup of morning Assam tea'
  },
  {
    id: 'walk',
    order: 2,
    title_as: 'ৰাতিপুৱা খোজ কঢ়া',
    title_en: '2. Morning Walk',
    image: '/assets/images/walking_shoes.svg',
    hint_as: 'তাৰ পিছত বাৰীত খোজ কাঢ়োঁ',
    hint_en: 'Then, leisurely walk in the courtyard'
  },
  {
    id: 'medicine',
    order: 3,
    title_as: 'নিয়মীয়া ঔষধ লোৱা',
    title_en: '3. Take Morning Medicine',
    image: '/assets/images/medicine_box.svg',
    hint_as: 'শেষত ঔষধ পানীৰে খাওঁ',
    hint_en: 'Finally, prescribed morning medicine'
  }
];

export function DailyRoutineGame({ dialect = 'Assamese', onComplete }) {
  // Shuffle initial order
  const [availableBlocks, setAvailableBlocks] = useState(() => 
    [...ROUTINE_STEPS].sort(() => 0.5 - Math.random())
  );
  const [selectedSequence, setSelectedSequence] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const { registerPromptEnd, handlePointerDown, handlePointerUp, lastMetrics } = useElderlyTouch({
    debounceMs: 400,
    onValidTap: async (block, metrics) => {
      // If already selected, do nothing
      if (selectedSequence.find(b => b.id === block.id)) return;

      const newSeq = [...selectedSequence, block];
      setSelectedSequence(newSeq);

      // Check if finished 3 steps
      if (newSeq.length === 3) {
        const isAllCorrect = newSeq[0].id === 'tea' && newSeq[1].id === 'walk' && newSeq[2].id === 'medicine';
        setFeedback({
          correct: isAllCorrect,
          latency: metrics.latencyMs,
          jitter: metrics.jitterPx
        });

        // Save telemetry
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

        if (isAllCorrect) {
          speakPrompt(dialect === 'Assamese' ? 'বৰ ধুনীয়া! আপোনাৰ দৈনিক নিয়ম শুদ্ধ হ\'ল।' : 'Great job! Daily routine sequenced correctly.', dialect);
        } else {
          speakPrompt(dialect === 'Assamese' ? 'ক্ৰমটো অলপ খেলিমেলি হ\'ল। পুনৰ চেষ্টা কৰক।' : 'Sequence was slightly mixed up. Let us try again.', dialect);
        }

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
    const text = dialect === 'Assamese' 
      ? 'আপোনাৰ ৰাতিপুৱাৰ নিয়ম অনুসৰি এটাকৈ স্পৰ্শ কৰক: চাহ, খোজ কঢ়া, আৰু ঔষধ।'
      : 'Tap the routine blocks in daily order: Morning Tea, Morning Walk, then Medicine.';
    speakPrompt(text, dialect, () => {
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
            {dialect === 'Assamese' ? 'দৈনিক কামৰ ক্ৰম (১, ২, ৩)' : '3-Step Daily Routine Sequencer'}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="min-h-[56px] px-5 rounded-xl border-2 border-zinc-900 bg-zinc-100 hover:bg-zinc-200 flex items-center gap-2 font-bold text-lg"
          >
            <RotateCcw className="w-5 h-5" />
            <span>{dialect === 'Assamese' ? 'পুনৰ কৰক' : 'Reset'}</span>
          </button>
        </div>
      </div>

      {/* Zero Drag-and-Drop Explanation Banner */}
      <div className="p-4 rounded-2xl bg-[#FFFDF7] border-3 border-amber-800 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_3px_0_#9A3412]">
        <div>
          <p className="text-zinc-600 font-semibold text-base">
            {dialect === 'Assamese' ? 'স্পৰ্শ কৰক (টানি অনাৰ কোনো প্ৰয়োজন নাই):' : 'Single-Tap Ordering (Zero drag-and-drop friction):'}
          </p>
          <p className="text-2xl font-black text-amber-950 mt-1">
            {dialect === 'Assamese' ? '১ম চাহ ➔ ২য় খোজ কঢ়া ➔ ৩য় ঔষধ' : '1st Tea ➔ 2nd Walk ➔ 3rd Medicine'}
          </p>
        </div>
        <button
          onClick={handleHearPrompt}
          disabled={isSpeaking}
          className="min-h-[64px] px-5 rounded-2xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-lg flex items-center gap-3 border-2 border-zinc-900 shadow-[0_4px_0_#18181B]"
        >
          <Volume2 className={`w-7 h-7 ${isSpeaking ? 'animate-bounce text-amber-300' : ''}`} />
          <span>{isSpeaking ? 'কৈ থকা হৈছে...' : 'নিয়ম শুনক'}</span>
        </button>
      </div>

      {/* Current Sequence Progression Display */}
      <div className="mb-8 p-6 rounded-2xl bg-zinc-50 border-3 border-zinc-400">
        <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider block mb-3">
          Selected Sequence Progression:
        </span>
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((slotIdx) => {
            const assigned = selectedSequence[slotIdx];
            return (
              <div
                key={slotIdx}
                className={`min-h-[100px] rounded-2xl border-3 flex flex-col items-center justify-center p-3 text-center
                  ${assigned ? 'bg-emerald-50 border-emerald-700 shadow-sm' : 'border-dashed border-zinc-400 bg-white'}
                `}
              >
                <span className="text-xs font-bold text-zinc-400 mb-1">
                  Step {slotIdx + 1}
                </span>
                {assigned ? (
                  <div className="flex items-center gap-2">
                    <img src={assigned.image} alt={assigned.title_en} className="w-10 h-10 object-contain" />
                    <span className="text-lg font-black text-zinc-900">
                      {dialect === 'Assamese' ? assigned.title_as : assigned.title_en}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm font-semibold text-zinc-400">
                    Tap block below
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Available Blocks to Tap (72px+ touch targets) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        {availableBlocks.map((block) => {
          const isSelected = selectedSequence.find(b => b.id === block.id);
          const orderAssigned = selectedSequence.findIndex(b => b.id === block.id) + 1;

          return (
            <button
              key={block.id}
              disabled={!!isSelected || !!feedback}
              onPointerDown={handlePointerDown}
              onPointerUp={(e) => handlePointerUp(e, block)}
              className={`min-h-[200px] rounded-3xl p-6 flex flex-col items-center justify-between text-center border-4 transition-all duration-150 relative cursor-pointer
                ${isSelected 
                  ? 'bg-zinc-200 border-zinc-400 opacity-60 pointer-events-none' 
                  : 'bg-white border-zinc-900 hover:border-amber-700 shadow-[0_6px_0_#18181B] active:translate-y-1 active:shadow-[0_2px_0_#18181B]'
                }
              `}
            >
              {orderAssigned > 0 && (
                <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-emerald-700 text-white font-black flex items-center justify-center text-lg shadow">
                  #{orderAssigned}
                </div>
              )}
              <div className="w-24 h-24 flex items-center justify-center">
                <img src={block.image} alt={block.title_en} className="w-full h-full object-contain pointer-events-none" />
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black text-zinc-950 block">
                  {dialect === 'Assamese' ? block.title_as : block.title_en}
                </span>
                <span className="text-sm font-medium text-zinc-500 mt-1 block">
                  {dialect === 'Assamese' ? block.hint_as : block.hint_en}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div className={`p-4 rounded-2xl border-3 flex items-center justify-between ${
          feedback.correct ? 'bg-emerald-100 border-emerald-800 text-emerald-950' : 'bg-rose-100 border-rose-800 text-rose-950'
        }`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-800" />
            <span className="text-xl font-black">
              {feedback.correct 
                ? (dialect === 'Assamese' ? 'উৎকৃষ্ট! সঠিক ক্ৰমত সজোৱা হৈছে।' : 'Excellent! Perfect daily living order.')
                : (dialect === 'Assamese' ? 'ক্ৰমটো ভুল হৈছে। আকৌ চেষ্টা কৰক।' : 'Incorrect order. Try resetting.')
              }
            </span>
          </div>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-bold text-base hover:bg-zinc-800"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
