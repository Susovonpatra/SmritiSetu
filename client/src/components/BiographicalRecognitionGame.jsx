import React, { useState, useEffect, useRef, useCallback } from 'react';
import { audioChime } from '../utils/audioChime';
import { BiographicalTelemetryService } from '../services/biographicalTelemetry';
import {
  Heart,
  Coffee,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  Shield,
  Smile
} from 'lucide-react';

export function BiographicalRecognitionGame({ patientId = 1, onExitToRest, dialect = 'English' }) {
  const [questionsPool, setQuestionsPool] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionQuestions, setSessionQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interaction & Feedback States
  const [selectedSlot, setSelectedSlot] = useState(null); // 0, 1, 2, 3
  const [feedbackActive, setFeedbackActive] = useState(false);
  const [lastSelectedCorrect, setLastSelectedCorrect] = useState(null);
  const [showRestConfirmation, setShowRestConfirmation] = useState(false);
  const [completedCountInSession, setCompletedCountInSession] = useState(0);

  // Telemetry Session State
  const sessionIdRef = useRef(`session-${Date.now()}`);
  const questionRenderTimeRef = useRef(performance.now());
  const hesitationCountRef = useRef(0);
  const boardRef = useRef(null);

  // Load questions on mount
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const list = await BiographicalTelemetryService.getQuestions(patientId);
      if (isMounted) {
        setQuestionsPool(list);
        // Shuffle for uncapped, gentle randomized cycles
        const shuffled = [...list].sort(() => Math.random() - 0.5);
        setSessionQuestions(shuffled);
        setCurrentIndex(0);
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [patientId]);

  // Reset timer & hesitation whenever question changes
  useEffect(() => {
    questionRenderTimeRef.current = performance.now();
    hesitationCountRef.current = 0;
    setSelectedSlot(null);
    setFeedbackActive(false);
    setLastSelectedCorrect(null);
  }, [currentIndex, sessionQuestions]);

  // Track hesitation: pointer movements / gestures outside option cards
  const handleContainerPointerMove = useCallback((e) => {
    if (feedbackActive) return;
    // If target is not inside an option button, count as hovering / hesitation
    if (e.target && !e.target.closest('[data-option-slot]')) {
      hesitationCountRef.current += 1;
    }
  }, [feedbackActive]);

  const currentQuestion = sessionQuestions[currentIndex] || null;

  // Handle Option Click
  const handleSelectOption = async (optionText, slotIndex) => {
    if (feedbackActive || !currentQuestion) return;

    const latencyMs = Math.round(performance.now() - questionRenderTimeRef.current);
    const hesitationCount = Math.floor(hesitationCountRef.current / 3); // normalized movements
    const isCorrect = slotIndex === currentQuestion.correctOptionIndex;

    setSelectedSlot(slotIndex);
    setFeedbackActive(true);
    setLastSelectedCorrect(isCorrect);

    // Audio Chime Feedback
    if (isCorrect) {
      audioChime.playCalmSuccessChime();
    } else {
      audioChime.playGentleOrientationTone();
    }

    // Log Immutable Clinical Trial
    try {
      await BiographicalTelemetryService.logTrial({
        sessionId: sessionIdRef.current,
        patientId: patientId,
        questionId: currentQuestion.questionId || `q-${currentIndex}`,
        relationTier: currentQuestion.relationTier || 'TIER_1_CORE',
        selectedOptionIndex: slotIndex,
        correctOptionIndex: currentQuestion.correctOptionIndex,
        isCorrect: isCorrect,
        selectedText: optionText,
        correctText: currentQuestion.options[currentQuestion.correctOptionIndex],
        latencyMs: latencyMs,
        hesitationCount: hesitationCount,
        selectedPosition: slotIndex
      });
    } catch (err) {
      console.warn('Telemetry log failed silently:', err);
    }

    setCompletedCountInSession(prev => prev + 1);

    // Reassuring display duration (2.3s) so the patient has ample time to orient
    setTimeout(() => {
      goToNextQuestion();
    }, 2300);
  };

  const goToNextQuestion = () => {
    if (currentIndex + 1 < sessionQuestions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Seamless uncapped cycle: reshuffle question pool and keep flowing gently
      const reshuffled = [...questionsPool].sort(() => Math.random() - 0.5);
      setSessionQuestions(reshuffled);
      setCurrentIndex(0);
    }
  };

  // Friendly Relational Tier Badge Helper
  const getTierDisplay = (tier) => {
    switch (tier) {
      case 'TIER_1_CORE':
        return { label: 'Primary Family Memory', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
      case 'TIER_2_CHILD':
        return { label: 'Children & Family Circle', color: 'bg-sky-100 text-sky-900 border-sky-300' };
      case 'TIER_3_SIBLING':
        return { label: 'Siblings & Youth Roots', color: 'bg-amber-100 text-amber-900 border-amber-300' };
      case 'TIER_4_EXTENDED':
        return { label: 'Fond Nostalgia & Memories', color: 'bg-violet-100 text-violet-900 border-violet-300' };
      default:
        return { label: 'Family Memory', color: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-[460px] bg-[#fbf9f5] rounded-3xl border-2 border-slate-200 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center animate-pulse mb-4 text-emerald-700">
          <Heart className="w-8 h-8 fill-emerald-600" />
        </div>
        <p className="text-xl font-bold text-slate-800">Preparing your cherished memories...</p>
        <p className="text-sm text-slate-500 mt-1">Take a deep breath and relax.</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-[460px] bg-[#fbf9f5] rounded-3xl border-2 border-slate-200 p-8 text-center flex flex-col items-center justify-center">
        <Sparkles className="w-12 h-12 text-emerald-600 mb-3" />
        <h3 className="text-2xl font-bold text-slate-900">No questions configured yet</h3>
        <p className="text-base text-slate-600 mt-2 max-w-md">
          Please ask your caregiver to add questions in the Caretaker Portal.
        </p>
      </div>
    );
  }

  const tierBadge = getTierDisplay(currentQuestion.relationTier);

  return (
    <div
      ref={boardRef}
      onPointerMove={handleContainerPointerMove}
      className="relative w-full max-w-4xl mx-auto bg-[#faf8f5] text-slate-900 rounded-3xl border-2 border-slate-200/90 shadow-lg p-5 sm:p-8 space-y-6 select-none transition-colors duration-300"
      style={{ minHeight: '520px' }}
    >
      {/* ── TOP CALM HEADER WITH CLEAR "TAKE A REST" BUTTON ── */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-sm">
            <Heart className="w-5 h-5 fill-emerald-600" />
          </span>
          <div>
            <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold border ${tierBadge.color}`}>
              {tierBadge.label}
            </span>
            <div className="text-xs text-slate-500 font-medium mt-0.5">
              Uncapped gentle exploration • {completedCountInSession} questions answered
            </div>
          </div>
        </div>

        {/* Clear, Calm "Take a Rest" Button (Dementia-friendly exit) */}
        <button
          onClick={() => setShowRestConfirmation(true)}
          className="group px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-950 border-2 border-amber-300 rounded-2xl font-bold text-sm sm:text-base flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          title="Take a restful break at any time"
        >
          <Coffee className="w-5 h-5 text-amber-700 group-hover:rotate-6 transition-transform" />
          <span>Take a Rest</span>
        </button>
      </div>

      {/* ── QUESTION CARD (MIN 26PX HIGH CONTRAST FONT) ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm text-center relative overflow-hidden">
        <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
          Biographical Memory Recall
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 leading-snug tracking-normal">
          {currentQuestion.questionText}
        </h2>
      </div>

      {/* ── 4 LARGE TOUCH CARDS (MIN 64PX HEIGHT, WCAG AAA HIGH CONTRAST) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-1">
        {currentQuestion.options.map((optionText, slotIdx) => {
          const isSelected = selectedSlot === slotIdx;
          const isTargetCorrect = slotIdx === currentQuestion.correctOptionIndex;

          let cardStyle = 'bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-300 hover:border-slate-400 shadow-sm';
          let highlightBadge = null;

          if (feedbackActive) {
            if (isSelected && isTargetCorrect) {
              // Gentle emerald glow for correct choice
              cardStyle = 'bg-emerald-50 text-emerald-950 border-2 border-emerald-500 ring-4 ring-emerald-300/80 shadow-md scale-[1.01]';
              highlightBadge = (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Wonderful! That is right.
                </span>
              );
            } else if (isSelected && !isTargetCorrect) {
              // Soft rose/red tint without punitive alerts
              cardStyle = 'bg-rose-50 text-rose-950 border-2 border-rose-300/80 shadow-sm';
            } else if (!isSelected && isTargetCorrect) {
              // Reinforce orientation: immediately highlight correct option in soft green
              cardStyle = 'bg-emerald-50 text-emerald-950 border-2 border-emerald-500 ring-4 ring-emerald-300/80 shadow-md scale-[1.01] animate-pulse';
              highlightBadge = (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300">
                  <Smile className="w-4 h-4 text-emerald-600" />
                  Here it is — let's remember this together
                </span>
              );
            } else {
              // Unselected non-correct cards soften opacity
              cardStyle = 'bg-slate-50 text-slate-400 border border-slate-200 opacity-60';
            }
          }

          return (
            <button
              key={`${currentQuestion.questionId}-opt-${slotIdx}`}
              data-option-slot={slotIdx}
              onClick={() => handleSelectOption(optionText, slotIdx)}
              disabled={feedbackActive}
              className={`w-full min-h-[72px] sm:min-h-[84px] p-5 sm:p-6 rounded-3xl font-bold text-xl sm:text-2xl text-left flex flex-col justify-center items-start transition-all duration-200 cursor-pointer active:scale-[0.98] ${cardStyle}`}
            >
              <div className="flex items-center justify-between w-full gap-3">
                <span className="leading-snug">{optionText}</span>
                {isSelected && isTargetCorrect && (
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                )}
              </div>
              {highlightBadge && (
                <div className="mt-2.5">
                  {highlightBadge}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── GENTLE REASSURANCE CAPTION AT FOOTER ── */}
      <div className="text-center pt-2">
        <p className="text-sm font-medium text-slate-500 flex items-center justify-center gap-2">
          <span>There is never any rush. Take all the time you need.</span>
        </p>
      </div>

      {/* ── CALM REST CONFIRMATION MODAL ── */}
      {showRestConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#faf8f5] rounded-3xl p-6 sm:p-8 border-2 border-slate-300 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
              <Coffee className="w-8 h-8 text-amber-700" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-slate-900">
                Time for a peaceful break?
              </h3>
              <p className="text-base text-slate-600 mt-2 leading-relaxed">
                You did wonderfully today. It is always good to rest your eyes, sip some warm water, and relax.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setShowRestConfirmation(false);
                  if (onExitToRest) onExitToRest();
                }}
                className="flex-1 py-3.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-base rounded-2xl shadow-md transition cursor-pointer"
              >
                Yes, take a rest
              </button>

              <button
                onClick={() => setShowRestConfirmation(false)}
                className="flex-1 py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-800 border-2 border-slate-300 font-bold text-base rounded-2xl shadow-sm transition cursor-pointer"
              >
                Keep playing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
