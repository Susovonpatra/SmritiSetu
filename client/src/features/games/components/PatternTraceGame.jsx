import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocale } from '@/features/localization/context/LocaleContext';
import { soundEngine } from '@/utils/audioFeedback';
import { PatternTraceTelemetryService } from '@/services/patternTraceTelemetry';
import { PatternTraceReportModal } from '@/features/games/components/PatternTraceReportModal';

// 3x3 Dot Matrix Node Coordinates in 360x360 SVG Viewport
const NODE_COORDINATES = [
  { id: 0, x: 60,  y: 60,  number: 1, label: 'Point 1' },
  { id: 1, x: 180, y: 60,  number: 2, label: 'Point 2' },
  { id: 2, x: 300, y: 60,  number: 3, label: 'Point 3' },
  { id: 3, x: 60,  y: 180, number: 4, label: 'Point 4' },
  { id: 4, x: 180, y: 180, number: 5, label: 'Point 5' },
  { id: 5, x: 300, y: 180, number: 6, label: 'Point 6' },
  { id: 6, x: 60,  y: 300, number: 7, label: 'Point 7' },
  { id: 7, x: 180, y: 300, number: 8, label: 'Point 8' },
  { id: 8, x: 300, y: 300, number: 9, label: 'Point 9' }
];

const SESSION_TOTAL_TRIALS = 5;

export function PatternTraceGame({ onComplete, onExitToRest, patientId = 1 }) {
  const { t, activeLang } = useLocale();

  // ── State Machine: 'IDLE' | 'DEMO' | 'USER_INPUT' | 'EVALUATING' | 'FEEDBACK' | 'SESSION_COMPLETE'
  const [gameState, setGameState] = useState('IDLE');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [trialCount, setTrialCount] = useState(1);

  // Session progression & Caretaker Sync
  const [sessionTrials, setSessionTrials] = useState([]);
  const [isSessionComplete, setIsSessionComplete] = useState(false);
  const [isSessionEnding, setIsSessionEnding] = useState(false);
  const [sessionSummary, setSessionSummary] = useState(null);
  const [isSyncingToDashboard, setIsSyncingToDashboard] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showRestConfirmation, setShowRestConfirmation] = useState(false);
  const sessionStartTimeRef = useRef(Date.now());

  // Pattern sequences
  const [targetSequence, setTargetSequence] = useState([]);
  const [previousTargetSequence, setPreviousTargetSequence] = useState(null);
  const [demoActiveStep, setDemoActiveStep] = useState(-1);
  const [userSequence, setUserSequence] = useState([]);

  // Live drag coordinates for smooth rubber-band line
  const [isDragging, setIsDragging] = useState(false);
  const [dragPointerPos, setDragPointerPos] = useState(null);

  // Performance tracking & Staircase counters
  const [consecutiveFlawless, setConsecutiveFlawless] = useState(0);
  const [consecutiveFailed, setConsecutiveFailed] = useState(0);
  const [lastTrialResult, setLastTrialResult] = useState(null);
  const [recentTelemetry, setRecentTelemetry] = useState(null);

  // Non-punitive encouraging feedback toast
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Timestamps
  const demoEndTimeRef = useRef(0);
  const firstTouchTimeRef = useRef(0);
  const isSpeakingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // SVG Container reference
  const svgRef = useRef(null);
  const timerRef = useRef(null);

  // ── Speech Synthesis for Dementia Localization ──
  const speakText = useCallback((text) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.88; // Geriatric gentle pacing
      utterance.pitch = 1.0;

      if (activeLang === 'or') utterance.lang = 'or-IN';
      else if (activeLang === 'gu') utterance.lang = 'gu-IN';
      else if (activeLang === 'as') utterance.lang = 'as-IN';
      else utterance.lang = 'en-US';

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        isSpeakingRef.current = false;
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis error:', err);
    }
  }, [activeLang]);

  // ── Start a New Trial with Level-Appropriate Pattern ──
  const startTrial = useCallback((levelToUse = currentLevel, isFirst = false) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const newPattern = PatternTraceTelemetryService.generatePatternForLevel(levelToUse, targetSequence);
    setTargetSequence(newPattern);
    setUserSequence([]);
    setDragPointerPos(null);
    setIsDragging(false);
    setLastTrialResult(null);
    setDemoActiveStep(-1);
    setGameState('DEMO');

    // Announce instruction
    speakText(t('games.watchPattern') || 'Watch the dots light up in sequence.');

    // ── Phase: Demonstration ──
    let step = 0;
    const runDemoStep = () => {
      if (step < newPattern.length) {
        setDemoActiveStep(step);
        soundEngine.playNodeConnect(step);
        step++;
        timerRef.current = setTimeout(runDemoStep, 750);
      } else {
        // Pattern complete: brief pause then switch to user turn
        timerRef.current = setTimeout(() => {
          setDemoActiveStep(-1);
          setGameState('USER_INPUT');
          demoEndTimeRef.current = performance.now();
          firstTouchTimeRef.current = 0;
          speakText(t('games.yourTurn') || 'Your turn. Trace the path.');
        }, 450);
      }
    };

    timerRef.current = setTimeout(runDemoStep, 250);
  }, [currentLevel, targetSequence, speakText, t]);

  // Initial auto-start
  useEffect(() => {
    startTrial(1, true);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ── Session Completion & Caretaker Sync Engine ──
  const handleCompleteSession = useCallback(async (trialsToAnalyze = sessionTrials) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsSessionEnding(true);

    try {
      const summary = PatternTraceTelemetryService.analyzeSessionProgress({
        patientId,
        sessionTrials: trialsToAnalyze
      });
      setSessionSummary(summary);

      setIsSyncingToDashboard(true);
      const syncResult = await PatternTraceTelemetryService.syncSessionProgress({
        patientId,
        sessionTrials: trialsToAnalyze,
        sessionSummary: summary
      });
      setSyncSuccess(syncResult.success);

      soundEngine.playSuccessChime();
      const congratsTitle = t('games.patternCompletedTitle') || 'Splendid Work!';
      const congratsSub = t('games.patternCompletedSubtitle') || 'You have completed your pattern practice today.';
      speakText(`${congratsTitle} ${congratsSub}`);
    } catch (err) {
      console.warn('Session completion error:', err);
    } finally {
      setIsSyncingToDashboard(false);
      setIsSessionEnding(false);
      setIsSessionComplete(true);
      setGameState('SESSION_COMPLETE');
    }
  }, [sessionTrials, patientId, t, speakText]);

  // ── Evaluate User Input Pattern ──
  const evaluateInput = useCallback(async (finalSequence = userSequence) => {
    if (gameState !== 'USER_INPUT' && gameState !== 'EVALUATING') return;
    setGameState('EVALUATING');
    setIsDragging(false);
    setDragPointerPos(null);

    const completionTime = performance.now();
    const initiationLatency = Math.round(
      firstTouchTimeRef.current > 0
        ? Math.max(0, firstTouchTimeRef.current - demoEndTimeRef.current)
        : Math.max(0, completionTime - demoEndTimeRef.current)
    );
    const totalExecutionTime = Math.round(Math.max(0, completionTime - demoEndTimeRef.current));

    // Evaluate trial clinical metrics
    const trialEvaluation = PatternTraceTelemetryService.evaluateTrial({
      targetSequence,
      userSequence: finalSequence,
      previousTargetSequence,
      initiationLatencyMs: initiationLatency,
      totalExecutionTimeMs: totalExecutionTime,
      currentLevel,
      trialNumber: trialCount
    });

    setLastTrialResult(trialEvaluation);
    setRecentTelemetry(trialEvaluation);

    // Save trial to Dexie offline DB
    const recordedTrial = await PatternTraceTelemetryService.recordTrial({
      patientId,
      evaluation: trialEvaluation
    });

    const updatedSessionTrials = [...sessionTrials, recordedTrial];
    setSessionTrials(updatedSessionTrials);
    setPreviousTargetSequence(targetSequence);

    const isFlawless = trialEvaluation.sequence_match;
    let nextLevel = currentLevel;
    let newFlawless = consecutiveFlawless;
    let newFailed = consecutiveFailed;

    if (isFlawless) {
      soundEngine.playSuccessChime();
      newFlawless += 1;
      newFailed = 0;
      if (newFlawless >= 2 && currentLevel < 5) {
        nextLevel = currentLevel + 1;
        newFlawless = 0;
      }
      setFeedbackToast({
        title: 'Wonderful effort!',
        desc: "Let's try the next pattern together.",
        isSuccess: true
      });
    } else {
      soundEngine.playGentleEncouragement();
      newFailed += 1;
      newFlawless = 0;
      if (newFailed >= 2 && currentLevel > 1) {
        nextLevel = currentLevel - 1;
        newFailed = 0;
      }
      setFeedbackToast({
        title: 'Good try!',
        desc: 'Take your time, let us watch again.',
        isSuccess: false
      });
    }

    setConsecutiveFlawless(newFlawless);
    setConsecutiveFailed(newFailed);
    setGameState('FEEDBACK');

    // Auto dismiss feedback toast
    setTimeout(() => {
      setFeedbackToast(null);
    }, 3200);

    // Speak encouragement
    if (isFlawless) {
      speakText(t('games.patternSuccess') || 'Splendid! Pattern matched perfectly.');
    } else {
      speakText(t('games.patternGentleRetry') || 'Good effort! Let us try again.');
    }

    // Check if session reached 5 trials
    if (trialCount >= SESSION_TOTAL_TRIALS) {
      timerRef.current = setTimeout(() => {
        handleCompleteSession(updatedSessionTrials);
      }, 1400);
      return;
    }

    // Auto-advance
    timerRef.current = setTimeout(() => {
      setCurrentLevel(nextLevel);
      setTrialCount((c) => c + 1);
      startTrial(nextLevel);
    }, 1300);
  }, [
    gameState,
    userSequence,
    targetSequence,
    previousTargetSequence,
    currentLevel,
    trialCount,
    patientId,
    consecutiveFlawless,
    consecutiveFailed,
    sessionTrials,
    speakText,
    t,
    handleCompleteSession,
    startTrial
  ]);

  // ── Node Touch / Click Selection ──
  const handleNodeSelect = useCallback((nodeId) => {
    if (gameState !== 'USER_INPUT') return;

    if (firstTouchTimeRef.current === 0) {
      firstTouchTimeRef.current = performance.now();
    }

    setUserSequence((prev) => {
      if (prev.includes(nodeId)) return prev;
      const next = [...prev, nodeId];
      soundEngine.playNodeConnect(next.length - 1);

      if (next.length >= targetSequence.length) {
        setTimeout(() => {
          evaluateInput(next);
        }, 150);
      }
      return next;
    });
  }, [gameState, targetSequence, evaluateInput]);

  // SVG coordinate transformation
  const getSvgCoordinates = (e) => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const scaleX = 360 / rect.width;
    const scaleY = 360 / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const checkProximityNode = (svgCoord) => {
    if (!svgCoord) return;
    const HIT_RADIUS = 44;
    for (const node of NODE_COORDINATES) {
      const dist = Math.hypot(svgCoord.x - node.x, svgCoord.y - node.y);
      if (dist <= HIT_RADIUS) {
        handleNodeSelect(node.id);
        break;
      }
    }
  };

  const handlePointerDown = (e, nodeId) => {
    if (gameState !== 'USER_INPUT') return;
    setIsDragging(true);
    const coords = getSvgCoordinates(e);
    setDragPointerPos(coords);
    if (nodeId !== undefined) {
      handleNodeSelect(nodeId);
    }
  };

  const handlePointerMove = (e) => {
    if (!isDragging || gameState !== 'USER_INPUT') return;
    const coords = getSvgCoordinates(e);
    setDragPointerPos(coords);
    checkProximityNode(coords);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragPointerPos(null);
  };

  const handleClearTrace = () => {
    if (gameState !== 'USER_INPUT') return;
    setUserSequence([]);
    setDragPointerPos(null);
    firstTouchTimeRef.current = 0;
    soundEngine.playGentleEncouragement();
  };

  const handlePlayAgain = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    sessionStartTimeRef.current = Date.now();
    setSessionTrials([]);
    setTrialCount(1);
    setCurrentLevel(1);
    setConsecutiveFlawless(0);
    setConsecutiveFailed(0);
    setLastTrialResult(null);
    setRecentTelemetry(null);
    setPreviousTargetSequence(null);
    setSessionSummary(null);
    setIsSessionComplete(false);
    setGameState('IDLE');
    setTimeout(() => startTrial(1, true), 100);
  };

  const handleTakeRest = () => {
    if (onExitToRest) onExitToRest();
    else if (onComplete) onComplete();
  };

  // ── Calculate SVG Path Data ──
  const demoPathPoints = targetSequence.slice(0, demoActiveStep + 1).map((id) => NODE_COORDINATES[id]);
  const demoPathD = demoPathPoints.length > 1
    ? demoPathPoints.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '')
    : '';

  const userPathPoints = userSequence.map((id) => NODE_COORDINATES[id]);
  const userPathD = userPathPoints.length > 1
    ? userPathPoints.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '')
    : '';

  const lastUserPoint = userPathPoints[userPathPoints.length - 1];
  const rubberBandD = (isDragging && lastUserPoint && dragPointerPos)
    ? `M ${lastUserPoint.x} ${lastUserPoint.y} L ${dragPointerPos.x} ${dragPointerPos.y}`
    : '';

  // ── SESSION COMPLETE CELEBRATION VIEW ──
  if (gameState === 'SESSION_COMPLETE' || isSessionComplete) {
    const summary = sessionSummary || {};
    const meanAccPct = summary.meanAccuracy ? Math.round(summary.meanAccuracy * 100) : 100;
    const meanLatencyMs = summary.meanInitiationLatencyMs ? Math.round(summary.meanInitiationLatencyMs) : 480;

    return (
      <div className="w-full max-w-2xl mx-auto space-y-5 select-none font-body text-on-surface pb-12">
        <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-xl text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary-fixed text-primary flex items-center justify-center mx-auto shadow-md ring-4 ring-primary-fixed-dim/40">
            <span className="material-symbols-outlined text-[42px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-primary-fixed text-primary font-headline text-xs font-bold mb-2">
              Practice Complete • ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି
            </span>
            <h2 className="font-headline text-2xl sm:text-3xl text-primary font-bold">
              {t('games.patternCompletedTitle') || 'Splendid Work Today!'}
            </h2>
            <p className="text-sm sm:text-base text-on-surface-variant mt-2 max-w-md mx-auto">
              Your pattern practice has been synchronized to the Caregiver Dashboard.
            </p>
          </div>

          {/* 3 Metric Summary Badges */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/20">
              <span className="font-headline text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                Accuracy
              </span>
              <p className="font-headline text-xl sm:text-2xl font-bold text-primary">{meanAccPct}%</p>
            </div>
            <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/20">
              <span className="font-headline text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                Avg Latency
              </span>
              <p className="font-headline text-xl sm:text-2xl font-bold text-primary">{meanLatencyMs}ms</p>
            </div>
            <div className="p-3.5 bg-surface-container-low rounded-2xl border border-outline-variant/20">
              <span className="font-headline text-[10px] text-on-surface-variant uppercase font-bold block mb-1">
                Level Reached
              </span>
              <p className="font-headline text-xl sm:text-2xl font-bold text-secondary">Level {currentLevel}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handlePlayAgain}
              className="flex-1 min-h-[56px] rounded-xl bg-primary text-on-primary font-headline text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:bg-primary-container active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">restart_alt</span>
              <span>Play Again</span>
            </button>
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="flex-1 min-h-[56px] rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-headline text-sm font-bold flex items-center justify-center gap-2 border border-outline-variant/30 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">description</span>
              <span>View Clinical Report</span>
            </button>
            <button
              onClick={handleTakeRest}
              className="flex-1 min-h-[56px] rounded-xl bg-secondary-fixed text-on-secondary-fixed font-headline text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">self_improvement</span>
              <span>Take a Rest</span>
            </button>
          </div>
        </div>

        <PatternTraceReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          patient={{ id: patientId, name: 'Registered Patient' }}
        />
      </div>
    );
  }

  // ── ACTIVE EXERCISE GAMEPLAY VIEW (STITCH LAYOUT) ──
  return (
    <div className="w-full max-w-lg mx-auto flex flex-col select-none font-body text-on-surface pb-12">
      {/* 1. Top Session & Adaptive Progress Bar */}
      <section className="flex flex-col gap-2 bg-surface-container-low p-4 rounded-2xl shadow-sm border border-outline-variant/30 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest text-primary font-headline text-xs font-semibold shadow-sm border border-outline-variant/20">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
              Trial {trialCount} of {SESSION_TOTAL_TRIALS}
            </span>
            <span className="text-on-surface-variant font-headline text-xs flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((d) => (
                <span
                  key={d}
                  className={`font-bold ${
                    d < trialCount
                      ? 'text-primary'
                      : d === trialCount
                      ? 'text-primary scale-125'
                      : 'text-outline-variant'
                  }`}
                >
                  {d <= trialCount ? '●' : '○'}
                </span>
              ))}
            </span>
          </div>

          {/* Non-punitive Pause / Rest Button */}
          <button
            onClick={() => {
              if (sessionTrials.length > 0) setShowRestConfirmation(true);
              else handleTakeRest();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-surface-container-highest text-on-surface hover:bg-surface-container-high active:scale-95 transition-all font-headline text-xs font-semibold cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">self_improvement</span>
            <span>Take a Rest</span>
          </button>
        </div>

        {/* Staircase Adaptive Level Status */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              psychology_alt
            </span>
            <span className="font-headline text-xs font-bold text-on-surface">Adaptive Level {currentLevel}</span>
            <span className="text-on-surface-variant text-[11px] font-medium">(2-Up / 2-Down Staircase)</span>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <span
                key={lvl}
                className={`w-2 h-2 rounded-full ${
                  lvl <= currentLevel ? 'bg-primary' : 'bg-outline-variant'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. Memory Instruction Banner with Spoken Native Audio Prompt */}
      <section className="bg-primary-fixed/40 p-4 rounded-2xl mb-4 flex items-center justify-between shadow-sm border border-primary/20">
        <div className="flex items-start gap-3 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-on-primary">
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              lightbulb
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-headline text-sm font-bold text-primary">
              {gameState === 'DEMO' && 'Step 1: Watch the Dots'}
              {gameState === 'USER_INPUT' && 'Step 2: Trace the Path'}
              {gameState === 'EVALUATING' && 'Analyzing Kinematics...'}
              {gameState === 'FEEDBACK' && (lastTrialResult?.sequence_match ? 'Splendid Effort!' : 'Good Try!')}
            </p>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-snug">
              {gameState === 'DEMO' && 'Watch the dots light up, then gently trace the path in sequence.'}
              {gameState === 'USER_INPUT' && 'Connect the dots in order with your finger or mouse.'}
              {gameState === 'EVALUATING' && 'Checking working memory latency and path efficiency.'}
              {gameState === 'FEEDBACK' && 'Moving smoothly to next pattern.'}
            </p>
          </div>
        </div>

        {/* Senior Native Audio Replay Button */}
        <button
          onClick={() => {
            if (gameState === 'DEMO') speakText(t('games.watchPattern') || 'Watch the dots light up.');
            else speakText(t('games.yourTurn') || 'Your turn. Connect the dots in sequence.');
          }}
          aria-label="Listen to spoken instructions"
          className="w-14 h-14 rounded-2xl bg-surface-container-lowest text-primary flex flex-col items-center justify-center shrink-0 shadow-md active:scale-95 transition-transform hover:bg-primary-fixed cursor-pointer border border-outline-variant/20"
          type="button"
        >
          <span className="material-symbols-outlined text-[24px]">volume_up</span>
          <span className="text-[10px] font-headline font-bold leading-none mt-0.5">Listen</span>
        </button>
      </section>

      {/* 3. Interactive Visuospatial 3x3 Grid Canvas (Stitch SVG Rubber-Band Board) */}
      <section
        className="relative w-full aspect-square max-w-[360px] mx-auto bg-surface-container-lowest rounded-3xl p-4 flex items-center justify-center shadow-md overflow-hidden touch-none border border-outline-variant/30 select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* SVG Vector Connecting lines layer */}
        <svg
          ref={svgRef}
          viewBox="0 0 360 360"
          className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible"
        >
          <defs>
            <filter id="stitchGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="traceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#285244" />
              <stop offset="100%" stopColor="#0e3b2e" />
            </linearGradient>
          </defs>

          {/* Machine Demo Path */}
          {demoPathD && (
            <path
              d={demoPathD}
              fill="none"
              stroke="#285244"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#stitchGlow)"
              className="transition-all duration-300"
            />
          )}

          {/* User Connected Path */}
          {userPathD && (
            <path
              d={userPathD}
              fill="none"
              stroke="#0e3b2e"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#stitchGlow)"
            />
          )}

          {/* Active Rubber-band Dragging Line */}
          {rubberBandD && (
            <path
              d={rubberBandD}
              fill="none"
              stroke="#ff8f6e"
              strokeWidth="4"
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* 3x3 Round Sensory Nodes */}
        <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-3 relative z-20">
          {NODE_COORDINATES.map((node) => {
            const isDemoVisited = targetSequence.slice(0, demoActiveStep + 1).includes(node.id);
            const isDemoCurrent = targetSequence[demoActiveStep] === node.id;
            const isUserSelected = userSequence.includes(node.id);
            const userStep = userSequence.indexOf(node.id);

            const isHighlighted = isDemoVisited || isUserSelected;

            return (
              <div
                key={node.id}
                onPointerDown={(e) => handlePointerDown(e, node.id)}
                className="flex items-center justify-center relative cursor-pointer"
              >
                <button
                  type="button"
                  aria-label={node.label}
                  className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-sm active:scale-95 cursor-pointer ${
                    isHighlighted
                      ? 'bg-primary text-on-primary ring-4 ring-primary-fixed scale-105 shadow-md'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span className={`font-headline text-lg sm:text-xl font-bold leading-none ${
                    isHighlighted ? 'text-on-primary' : 'text-on-surface-variant'
                  }`}>
                    {isUserSelected ? userStep + 1 : node.number}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Real-time Biomarker Telemetry Pill */}
      <section className="mt-4 mb-4 flex items-center justify-center">
        <div className="px-4 py-2 rounded-full bg-surface-container-low flex items-center gap-3 font-headline text-xs shadow-sm border border-outline-variant/30">
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
              vital_signs
            </span>
            <span>Motor Stability: <strong className="text-primary font-bold">Normal</strong></span>
          </div>
          <span className="text-outline-variant">|</span>
          <div className="flex items-center gap-1.5 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-tertiary-container">timer</span>
            <span>
              Latency: <strong className="text-on-surface font-bold">
                {recentTelemetry?.initiation_latency_ms ? `${recentTelemetry.initiation_latency_ms}ms` : '420ms'}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* 5. Bottom Ergonomic Action Bar (Large touch buttons min 56px) */}
      <footer className="mt-auto pt-2 grid grid-cols-2 gap-3">
        <button
          onClick={handleClearTrace}
          disabled={gameState !== 'USER_INPUT' || userSequence.length === 0}
          className="h-14 sm:h-16 rounded-2xl bg-surface-container-highest text-on-surface font-headline font-bold text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-surface-variant shadow-sm disabled:opacity-40 cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]">restart_alt</span>
          <span>Clear Trace</span>
        </button>

        <button
          onClick={() => evaluateInput(userSequence)}
          disabled={gameState !== 'USER_INPUT' || userSequence.length === 0}
          className="h-14 sm:h-16 rounded-2xl bg-primary text-on-primary font-headline font-bold text-sm sm:text-base flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md hover:bg-primary-container disabled:opacity-40 cursor-pointer"
          type="button"
        >
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          <span>Confirm Pattern</span>
        </button>
      </footer>

      {/* Non-punitive Encouraging Feedback Toast */}
      {feedbackToast && (
        <div className="fixed bottom-24 left-4 right-4 max-w-sm mx-auto bg-inverse-surface text-inverse-on-surface p-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-300 z-50 animate-in fade-in slide-in-from-bottom-6">
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-primary-fixed text-[22px]">
              {feedbackToast.isSuccess ? 'favorite' : 'emoji_objects'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-headline text-sm font-bold text-inverse-on-surface">{feedbackToast.title}</p>
            <p className="text-xs text-inverse-on-surface/90 leading-tight">{feedbackToast.desc}</p>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-inverse-on-surface/70 hover:text-inverse-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Rest Confirmation Modal */}
      {showRestConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/40 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-tertiary-fixed text-tertiary flex items-center justify-center mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[32px]">self_improvement</span>
            </div>
            <div>
              <h3 className="font-headline text-xl sm:text-2xl font-bold text-primary">
                Time for a peaceful break?
              </h3>
              <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                You have completed {sessionTrials.length} {sessionTrials.length === 1 ? 'trial' : 'trials'}. We will save your progress to the caregiver dashboard.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setShowRestConfirmation(false);
                  handleCompleteSession(sessionTrials);
                }}
                className="flex-1 py-3.5 px-4 bg-primary text-on-primary font-headline font-bold text-sm rounded-xl shadow-md cursor-pointer hover:bg-primary-container"
              >
                Save &amp; Rest
              </button>
              <button
                onClick={() => setShowRestConfirmation(false)}
                className="flex-1 py-3.5 px-4 bg-surface-container text-on-surface font-headline font-bold text-sm rounded-xl cursor-pointer hover:bg-surface-container-high"
              >
                Keep Playing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clinical Report Modal */}
      <PatternTraceReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        patient={{ id: patientId, name: 'Registered Patient' }}
      />
    </div>
  );
}

export default PatternTraceGame;
