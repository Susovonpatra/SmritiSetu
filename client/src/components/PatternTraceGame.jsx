import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  Brain,
  Eye,
  HandMetal,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useLocale } from '../context/LocaleContext';
import { soundEngine } from '../utils/audioFeedback';
import { PatternTraceTelemetryService } from '../services/patternTraceTelemetry';

// 3x3 Dot Matrix Node Coordinates in 360x360 SVG Viewport
const NODE_COORDINATES = [
  { id: 0, x: 60,  y: 60,  label: 'Top Left' },
  { id: 1, x: 180, y: 60,  label: 'Top Middle' },
  { id: 2, x: 300, y: 60,  label: 'Top Right' },
  { id: 3, x: 60,  y: 180, label: 'Center Left' },
  { id: 4, x: 180, y: 180, label: 'Center Core' },
  { id: 5, x: 300, y: 180, label: 'Center Right' },
  { id: 6, x: 60,  y: 300, label: 'Bottom Left' },
  { id: 7, x: 180, y: 300, label: 'Bottom Middle' },
  { id: 8, x: 300, y: 300, label: 'Bottom Right' }
];

export function PatternTraceGame({ onComplete, patientId = 1 }) {
  const { t, activeLang } = useLocale();

  // ── State Machine: 'IDLE' | 'DEMO' | 'USER_INPUT' | 'EVALUATING' | 'FEEDBACK'
  const [gameState, setGameState] = useState('IDLE');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [trialCount, setTrialCount] = useState(1);

  // Pattern sequences
  const [targetSequence, setTargetSequence] = useState([]);
  const [previousTargetSequence, setPreviousTargetSequence] = useState(null);
  const [demoActiveStep, setDemoActiveStep] = useState(-1); // Index in targetSequence being shown
  const [userSequence, setUserSequence] = useState([]);

  // Live drag coordinates for smooth rubber-band line
  const [isDragging, setIsDragging] = useState(false);
  const [dragPointerPos, setDragPointerPos] = useState(null);

  // Performance tracking & Staircase counters
  const [consecutiveFlawless, setConsecutiveFlawless] = useState(0);
  const [consecutiveFailed, setConsecutiveFailed] = useState(0);
  const [lastTrialResult, setLastTrialResult] = useState(null);
  const [recentTelemetry, setRecentTelemetry] = useState(null);

  // Timestamps
  const demoEndTimeRef = useRef(0);
  const firstTouchTimeRef = useRef(0);
  const isSpeakingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // SVG Container reference for relative coordinate tracking
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
    speakText(t('games.watchPattern') || 'Watch the pattern.');

    // ── Phase 2: Demonstration (Snappy & Clear) ──
    let step = 0;
    const runDemoStep = () => {
      if (step < newPattern.length) {
        setDemoActiveStep(step);
        soundEngine.playNodeConnect(step);
        step++;
        timerRef.current = setTimeout(runDemoStep, 750);
      } else {
        // Pattern complete: quick 450ms pause, then immediately switch to User Turn
        timerRef.current = setTimeout(() => {
          setDemoActiveStep(-1);
          setGameState('USER_INPUT');
          demoEndTimeRef.current = performance.now();
          firstTouchTimeRef.current = 0;
          speakText(t('games.yourTurn') || 'Your turn. Connect the dots.');
        }, 450);
      }
    };

    // Small delay before demonstration begins
    timerRef.current = setTimeout(runDemoStep, 250);
  }, [currentLevel, targetSequence, speakText, t]);

  // Initial auto-start
  useEffect(() => {
    startTrial(1, true);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // ── Handle Node Selection (Tap or Snap during Drag) ──
  const handleNodeSelect = useCallback((nodeId) => {
    if (gameState !== 'USER_INPUT') return;

    // Record initiation latency on first touch
    if (firstTouchTimeRef.current === 0) {
      firstTouchTimeRef.current = performance.now();
    }

    setUserSequence((prev) => {
      // Don't add duplicate if already in sequence
      if (prev.includes(nodeId)) return prev;

      const next = [...prev, nodeId];
      soundEngine.playNodeConnect(next.length - 1);

      // If full sequence length reached, trigger evaluation after slight crisp tactile pause
      if (next.length >= targetSequence.length) {
        setTimeout(() => {
          evaluateInput(next);
        }, 120);
      }
      return next;
    });
  }, [gameState, targetSequence]);

  // ── Phase 4: Analysis & Evaluation ──
  const evaluateInput = useCallback(async (finalUserSeq = userSequence) => {
    if (gameState === 'EVALUATING' || gameState === 'FEEDBACK') return;
    setGameState('EVALUATING');
    setIsDragging(false);
    setDragPointerPos(null);

    const now = performance.now();
    const demoEnd = demoEndTimeRef.current || now - 1000;
    const firstTouch = firstTouchTimeRef.current || now - 500;

    const initiationLatency = Math.max(80, Math.round(firstTouch - demoEnd));
    const executionTime = Math.max(150, Math.round(now - firstTouch));

    // Compute Clinical Dementia Telemetry
    const trialPayload = PatternTraceTelemetryService.evaluateTrial({
      patientId,
      level: currentLevel,
      targetSequence,
      userSequence: finalUserSeq,
      previousTargetSequence,
      initiationLatencyMs: initiationLatency,
      totalExecutionTimeMs: executionTime
    });

    // Persist to Dexie DB
    await PatternTraceTelemetryService.recordTrial(trialPayload);
    setLastTrialResult(trialPayload);
    setRecentTelemetry(trialPayload);
    setPreviousTargetSequence(targetSequence);

    // ── Adaptive Staircase Difficulty Adjustment ──
    const isFlawless = trialPayload.sequence_match;
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
    } else {
      soundEngine.playGentleEncouragement();
      newFailed += 1;
      newFlawless = 0;

      if (newFailed >= 2 && currentLevel > 1) {
        nextLevel = currentLevel - 1;
        newFailed = 0;
      }
    }

    setConsecutiveFlawless(newFlawless);
    setConsecutiveFailed(newFailed);
    setGameState('FEEDBACK');

    // Gentle spoken feedback
    if (isFlawless) {
      speakText(t('games.patternSuccess') || 'Splendid! Pattern matched perfectly.');
    } else {
      speakText(t('games.patternGentleRetry') || 'Good effort! Let us watch the pattern again.');
    }

    // Auto-advance to next trial after smooth, reduced 1.1s pause (decreased from 2.4s)
    timerRef.current = setTimeout(() => {
      setCurrentLevel(nextLevel);
      setTrialCount((c) => c + 1);
      startTrial(nextLevel);
    }, 1100);
  }, [
    gameState,
    userSequence,
    patientId,
    currentLevel,
    targetSequence,
    previousTargetSequence,
    consecutiveFlawless,
    consecutiveFailed,
    speakText,
    t,
    startTrial
  ]);

  // ── Drag & Touch Handlers (Fluid SVG coordinate mapping) ──
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
    const HIT_RADIUS = 42; // Generous 42px radius (84px hitbox)
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

  // Replay Pattern Demo
  const handleReplayDemo = () => {
    if (gameState === 'FEEDBACK' || gameState === 'EVALUATING') return;
    startTrial(currentLevel);
  };

  // Clear current user attempt
  const handleClearUserSequence = () => {
    if (gameState !== 'USER_INPUT') return;
    setUserSequence([]);
    setDragPointerPos(null);
    firstTouchTimeRef.current = 0;
    soundEngine.playGentleEncouragement();
  };

  // ── Calculate Active SVG Path Coordinates ──
  // 1. Demonstrated path during machine turn
  const demoPathPoints = targetSequence
    .slice(0, demoActiveStep + 1)
    .map((id) => NODE_COORDINATES[id]);

  const demoPathD = demoPathPoints.length > 1
    ? demoPathPoints.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '')
    : '';

  // 2. User connected path during patient turn
  const userPathPoints = userSequence.map((id) => NODE_COORDINATES[id]);
  let userPathD = userPathPoints.length > 1
    ? userPathPoints.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '')
    : '';

  // Rubber-band live trailing line to active finger/cursor
  const lastUserPoint = userPathPoints[userPathPoints.length - 1];
  const rubberBandD = (isDragging && lastUserPoint && dragPointerPos)
    ? `M ${lastUserPoint.x} ${lastUserPoint.y} L ${dragPointerPos.x} ${dragPointerPos.y}`
    : '';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6 select-none font-sans">
      {/* ── Top Level & Clinical Working Memory Header ── */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-7 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] sm:text-xs font-bold border border-indigo-500/30">
                PatternTrace • MCI Working Memory
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-xs font-bold border border-emerald-500/30">
                Adaptive
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mt-0.5 sm:mt-1 truncate">
              {t('games.patternTitle') || 'PatternTrace Memory'}
            </h2>
          </div>
        </div>

        {/* Level & Trial Badge */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800/80 rounded-2xl border border-slate-700 text-center flex-1 sm:flex-none">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t('games.level') || 'Level'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-indigo-300">
              {currentLevel} <span className="text-xs text-slate-400 font-normal">/ 5</span>
            </span>
          </div>

          <div className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800/80 rounded-2xl border border-slate-700 text-center flex-1 sm:flex-none">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Trial
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-300">
              #{trialCount}
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Dementia-Friendly Calming Interaction Board ── */}
      <div className="bg-white rounded-3xl border-2 sm:border-3 border-slate-300 shadow-xl p-3 xs:p-5 sm:p-8 md:p-10 space-y-5 sm:space-y-8">
        {/* Instruction & Status Phase Banner (Clutter-free, high-contrast, zero timer stress) */}
        <div className={`p-3.5 sm:p-5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
          gameState === 'DEMO'
            ? 'bg-indigo-50/90 border-indigo-300 text-indigo-950 shadow-sm'
            : gameState === 'FEEDBACK'
            ? lastTrialResult?.sequence_match
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm'
              : 'bg-amber-50 border-amber-300 text-amber-950 shadow-sm'
            : 'bg-teal-50/90 border-teal-300 text-teal-950 shadow-sm'
        }`}>
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            {gameState === 'DEMO' ? (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-700 text-white flex items-center justify-center animate-pulse shrink-0">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            ) : gameState === 'USER_INPUT' ? (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-teal-700 text-white flex items-center justify-center shrink-0">
                <HandMetal className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}

            <div className="min-w-0">
              <p className="text-base sm:text-xl md:text-2xl font-black tracking-tight leading-tight">
                {gameState === 'DEMO' && (t('games.watchPattern') || 'Watch the pattern.')}
                {gameState === 'USER_INPUT' && (t('games.yourTurn') || 'Your turn. Connect the dots.')}
                {gameState === 'EVALUATING' && 'Analyzing pattern...'}
                {gameState === 'FEEDBACK' && (
                  lastTrialResult?.sequence_match
                    ? (t('games.patternSuccess') || 'Splendid! Pattern matched perfectly.')
                    : (t('games.patternGentleRetry') || 'Good effort! Let us watch the pattern again.')
                )}
              </p>
              <p className="text-[11px] sm:text-xs md:text-sm font-semibold opacity-80 mt-0.5 truncate">
                {gameState === 'DEMO' && `Step ${demoActiveStep + 1} of ${targetSequence.length} nodes`}
                {gameState === 'USER_INPUT' && `Connected ${userSequence.length} of ${targetSequence.length} target nodes (Drag or tap)`}
                {gameState === 'FEEDBACK' && `Response time: ${lastTrialResult?.initiation_latency_ms || 0}ms`}
              </p>
            </div>
          </div>

          {/* Voice Prompt Play Button (Sleek circular icon) */}
          <button
            onClick={() => {
              if (gameState === 'DEMO') speakText(t('games.watchPattern'));
              else if (gameState === 'USER_INPUT') speakText(t('games.yourTurn'));
            }}
            disabled={isSpeaking}
            title={t('games.replayVoice') || 'Replay Voice Instruction'}
            aria-label={t('games.replayVoice') || 'Replay Voice Instruction'}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-800 hover:bg-indigo-900 text-white flex items-center justify-center border-2 border-slate-900 shadow-md active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
          >
            <Volume2 className={`w-5 h-5 sm:w-6 sm:h-6 ${isSpeaking ? 'animate-pulse text-amber-300' : 'text-white'}`} />
          </button>
        </div>

        {/* ── Central Interactive 3x3 Dot Matrix (SVG & HTML Canvas Canvas Layer) ── */}
        <div className="flex justify-center items-center py-2 sm:py-4">
          <div
            className="relative w-full max-w-[280px] xs:max-w-[320px] sm:max-w-[380px] aspect-square rounded-3xl bg-slate-950/5 p-2 xs:p-3 sm:p-4 border-2 border-slate-200/80 shadow-inner select-none touch-none mx-auto"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <svg
              ref={svgRef}
              viewBox="0 0 360 360"
              className="w-full h-full overflow-visible touch-none cursor-pointer"
            >
              {/* Decorative Subtle Grid Lines for spatial reference */}
              <line x1="60" y1="60" x2="300" y2="60" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="60" y1="180" x2="300" y2="180" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="60" y1="300" x2="300" y2="300" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="60" y1="60" x2="60" y2="300" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="180" y1="60" x2="180" y2="300" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="300" y1="60" x2="300" y2="300" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="4 4" />

              {/* 1. Demonstration Path (Machine Turn - Glowing Indigo Line) */}
              {demoPathD && (
                <path
                  d={demoPathD}
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="filter drop-shadow-[0_0_8px_rgba(79,70,229,0.6)] transition-all duration-300"
                />
              )}

              {/* 2. User Connected Path (Patient Turn - Serene Emerald Line) */}
              {userPathD && (
                <path
                  d={userPathD}
                  fill="none"
                  stroke="#059669"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="filter drop-shadow-[0_0_8px_rgba(5,150,105,0.5)] transition-all"
                />
              )}

              {/* 3. Live Rubber-band Trailing Line */}
              {rubberBandD && (
                <path
                  d={rubberBandD}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                  className="opacity-80"
                />
              )}

              {/* ── 9 Interactive Dot Nodes (Large 64px+ Hit Targets with generous touch padding) ── */}
              {NODE_COORDINATES.map((node) => {
                const isDemoVisited = targetSequence.slice(0, demoActiveStep + 1).includes(node.id);
                const isDemoCurrent = targetSequence[demoActiveStep] === node.id;
                const demoStepIndex = targetSequence.indexOf(node.id);

                const isUserSelected = userSequence.includes(node.id);
                const userStepIndex = userSequence.indexOf(node.id);

                return (
                  <g
                    key={node.id}
                    onPointerDown={(e) => handlePointerDown(e, node.id)}
                    className="cursor-pointer"
                  >
                    {/* Generous Invisible Touch Target (88px diameter for motor tremor safety) */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="44"
                      fill="transparent"
                    />

                    {/* Outer Glow Halo on Active Node */}
                    {(isDemoCurrent || isUserSelected) && (
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r="34"
                        fill="none"
                        stroke={isDemoCurrent ? '#818CF8' : '#34D399'}
                        strokeWidth="4"
                        className="animate-pulse opacity-70"
                      />
                    )}

                    {/* Main Circular Dot Body (High Contrast, Dementia Friendly) */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="24"
                      fill={
                        isDemoVisited
                          ? '#4338CA' // Indigo during Demo
                          : isUserSelected
                          ? '#047857' // Emerald during User Turn
                          : '#FFFFFF' // Clean off-white
                      }
                      stroke={
                        isDemoVisited
                          ? '#1E1B4B'
                          : isUserSelected
                          ? '#064E3B'
                          : '#64748B'
                      }
                      strokeWidth="4"
                      className="filter drop-shadow-md transition-colors duration-200"
                    />

                    {/* Inner Core Accent */}
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="7"
                      fill={
                        isDemoVisited || isUserSelected
                          ? '#FFFFFF'
                          : '#94A3B8'
                      }
                    />

                    {/* Sequential Number Badge for Recall Assistance */}
                    {isDemoVisited && demoStepIndex !== -1 && (
                      <text
                        x={node.x}
                        y={node.y + 5}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="14"
                        fontWeight="900"
                        fontFamily="sans-serif"
                        className="select-none pointer-events-none"
                      >
                        {demoStepIndex + 1}
                      </text>
                    )}

                    {isUserSelected && userStepIndex !== -1 && (
                      <text
                        x={node.x}
                        y={node.y + 5}
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="14"
                        fontWeight="900"
                        fontFamily="sans-serif"
                        className="select-none pointer-events-none"
                      >
                        {userStepIndex + 1}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* ── Accessible Controls (Large, Calm, Dementia-Friendly) ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t-2 border-slate-100">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Replay Pattern Button */}
            <button
              onClick={handleReplayDemo}
              disabled={gameState === 'DEMO' || gameState === 'EVALUATING'}
              className="min-h-[46px] sm:min-h-[56px] px-3.5 sm:px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border-2 border-slate-300 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-700" />
              <span>Watch Again</span>
            </button>

            {/* Clear User Attempt */}
            <button
              onClick={handleClearUserSequence}
              disabled={gameState !== 'USER_INPUT' || userSequence.length === 0}
              className="min-h-[46px] sm:min-h-[56px] px-3.5 sm:px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border-2 border-slate-300 shadow-sm disabled:opacity-40 transition-all cursor-pointer"
            >
              <span>{t('games.clearPattern') || 'Clear'}</span>
            </button>
          </div>

          {/* Submit / Done Button */}
          {gameState === 'USER_INPUT' && userSequence.length > 0 && (
            <button
              onClick={() => evaluateInput(userSequence)}
              className="min-h-[46px] sm:min-h-[56px] px-5 sm:px-7 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm sm:text-base flex items-center gap-2 shadow-md border-2 border-emerald-900 active:translate-y-0.5 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200" />
              <span>{t('games.submitPattern') || 'Check Pattern'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Caregiver Clinical Insight Bar (Longitudinal Telemetry Snapshot) ── */}
      {recentTelemetry && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-100 border-2 border-slate-300 text-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-sm text-xs">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                Trial #{trialCount} Neurocognitive Metrics:
              </span>
              <span className="text-slate-600 text-[11px] sm:text-xs">
                Latency: <strong>{recentTelemetry.initiation_latency_ms}ms</strong> | Time: <strong>{recentTelemetry.total_execution_time_ms}ms</strong> | Accuracy: <strong>{Math.round(recentTelemetry.accuracy_score * 100)}%</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {recentTelemetry.perseveration_detected && (
              <span className="px-2.5 sm:px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-bold border border-amber-300 flex items-center gap-1.5 text-[10px] sm:text-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Perseveration</span>
              </span>
            )}
            <span className="px-2.5 sm:px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full font-bold border border-emerald-300 text-[10px] sm:text-xs">
              Synced to Caregiver Hub
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
