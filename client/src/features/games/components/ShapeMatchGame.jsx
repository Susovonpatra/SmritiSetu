import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  RotateCcw,
  Coffee,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Hand
} from 'lucide-react';
import {
  SHAPES_CONFIG,
  SHAPES_BY_ID,
  generateShapeGameRounds
} from '../shapes/shapeConfig';
import { ShapeSvg } from '../shapes/ShapeSvg';
import { ShapeGameTelemetryService } from '@/services/shapeGameTelemetry';
import { shapeGameApi } from '@/services/api/shapeGameApi';
import { soundEngine } from '@/utils/audioFeedback';
import { useLocale } from '@/features/localization/context/LocaleContext';

const AFFIRMATION_PHRASES = [
  'Well done',
  'Wonderful',
  'Very good',
  'Lovely',
  'Splendid',
  'Nicely done'
];

export function ShapeMatchGame({
  patientId = 1,
  dialect = 'Assamese',
  onExitToRest = () => {},
  soundEnabledDefault = true
}) {
  const { activeLang } = useLocale();

  // ── Session & Rounds State ──
  const [sessionSeed, setSessionSeed] = useState(() => String(Date.now()));
  const [rounds, setRounds] = useState(() => generateShapeGameRounds(Date.now()));
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [placedShapes, setPlacedShapes] = useState({}); // { [shapeId]: slotId }
  const [isComplete, setIsComplete] = useState(false);
  const [encouragementText, setEncouragementText] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(soundEnabledDefault);

  // ── Active Drag State ──
  const [draggingShapeId, setDraggingShapeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragCurrentPos, setDragCurrentPos] = useState({ x: 0, y: 0 });
  const [activePointerId, setActivePointerId] = useState(null);

  // ── Adaptive Hint State ──
  // hintLevel: 0 (none), 1 (pulse/glow), 2 (ghost glide), 3 (ghost glide + audio)
  const [activeHint, setActiveHint] = useState({ shapeId: null, level: 0, ghostPos: null });

  // ── Refs ──
  const telemetryRef = useRef(null);
  const sessionStartTimeRef = useRef(Date.now());
  const lastProgressTimeRef = useRef(Date.now());
  const lastTouchedShapeIdRef = useRef(null);
  const roundStartTimeRef = useRef(Date.now());
  const shapeFirstTouchTimeRef = useRef({}); // { [shapeId]: timestamp }
  const shapeAttemptsMapRef = useRef({}); // { [shapeId]: { hintsNeeded, incorrectAttempts, ... } }
  const slotsRef = useRef({}); // { [slotId]: DOMElement }
  const piecesRef = useRef({}); // { [shapeId]: DOMElement }
  const hintIntervalRef = useRef(null);
  const gameBoardRef = useRef(null);
  const ghostAnimFrameRef = useRef(null);

  // Initialize Telemetry Service on session start or restart
  useEffect(() => {
    let isCancelled = false;
    sessionStartTimeRef.current = Date.now();
    const localSessionId = `shape-sess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const tel = new ShapeGameTelemetryService(localSessionId, patientId);
    telemetryRef.current = tel;

    // Asynchronously register session with backend
    shapeGameApi.startSession({ patientId, seed: sessionSeed })
      .then((res) => {
        if (!isCancelled && res?.sessionId) {
          tel.sessionId = res.sessionId;
        }
      })
      .catch((err) => {
        // Offline-safe: backend auto-creates on event ingestion if offline initially
      });

    tel.logEvent('session_start', {
      payload: { seed: sessionSeed, patientId, dialect }
    });

    tel.logEvent('round_start', {
      roundNumber: 1,
      payload: { shapes: rounds[0]?.shapes.map(s => s.id) || [] }
    });

    roundStartTimeRef.current = Date.now();
    lastProgressTimeRef.current = Date.now();

    return () => {
      isCancelled = true;
      tel.destroy();
    };
  }, [sessionSeed, patientId]);

  // Handle Speech Pronunciation of Shape
  const speakShapeName = useCallback((shape) => {
    if (!soundEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const localizedName = shape.localizedNames?.[activeLang] || shape.displayName;
      const cleanName = localizedName.split('(')[0].trim() || shape.displayName;
      const utterance = new SpeechSynthesisUtterance(cleanName);
      utterance.rate = 0.85; // Geriatric gentle pacing
      utterance.pitch = 1.0;
      if (activeLang === 'or') utterance.lang = 'or-IN';
      else if (activeLang === 'gu') utterance.lang = 'gu-IN';
      else if (activeLang === 'as') utterance.lang = 'as-IN';
      else utterance.lang = 'en-US';

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis notice:', e);
    }
  }, [soundEnabled, activeLang]);

  // ── Adaptive Hint Loop (Every 4 seconds of no progress) ──
  useEffect(() => {
    if (isComplete) return;

    const checkHints = () => {
      // If actively dragging, reset progress timer
      if (draggingShapeId) {
        lastProgressTimeRef.current = Date.now();
        if (activeHint.level > 0) {
          setActiveHint({ shapeId: null, level: 0, ghostPos: null });
        }
        return;
      }

      const idleDurationMs = Date.now() - lastProgressTimeRef.current;
      const idleSec = Math.floor(idleDurationMs / 1000);

      const currentRound = rounds[currentRoundIndex];
      if (!currentRound) return;

      const unplaced = currentRound.shapes.filter(s => !placedShapes[s.id]);
      if (unplaced.length === 0) return;

      if (idleSec < 4) {
        if (activeHint.level > 0) {
          setActiveHint({ shapeId: null, level: 0, ghostPos: null });
        }
        return;
      }

      // Prioritize last touched shape if still unplaced
      let targetShape = unplaced.find(s => s.id === lastTouchedShapeIdRef.current) || unplaced[0];
      let level = 1;
      if (idleSec >= 12) level = 3;
      else if (idleSec >= 8) level = 2;

      // Update attempt tracker hints count
      if (!shapeAttemptsMapRef.current[targetShape.id]) {
        shapeAttemptsMapRef.current[targetShape.id] = {
          hintsNeeded: 0,
          incorrectAttempts: 0,
          firstTouchLatencyMs: 0,
          confusionChoices: []
        };
      }
      shapeAttemptsMapRef.current[targetShape.id].hintsNeeded = Math.max(
        shapeAttemptsMapRef.current[targetShape.id].hintsNeeded,
        level
      );

      // Log hint event
      telemetryRef.current?.logEvent('hint_shown', {
        roundNumber: currentRoundIndex + 1,
        shapeId: targetShape.id,
        payload: { level, idleDurationMs }
      });

      // Calculate ghost start and end coordinates
      let ghostPos = null;
      const pieceElem = piecesRef.current[targetShape.id];
      const slotElem = slotsRef.current[`slot-${currentRoundIndex}-${targetShape.id}`];

      if (pieceElem && slotElem && level >= 2) {
        const pieceRect = pieceElem.getBoundingClientRect();
        const slotRect = slotElem.getBoundingClientRect();
        ghostPos = {
          startX: pieceRect.left,
          startY: pieceRect.top,
          endX: slotRect.left,
          endY: slotRect.top
        };
      }

      setActiveHint({
        shapeId: targetShape.id,
        level,
        ghostPos
      });

      // Hint 3 includes audio announcement
      if (level === 3) {
        speakShapeName(targetShape);
      }
    };

    hintIntervalRef.current = setInterval(checkHints, 1000);
    return () => {
      if (hintIntervalRef.current) clearInterval(hintIntervalRef.current);
    };
  }, [currentRoundIndex, rounds, placedShapes, draggingShapeId, isComplete, speakShapeName]);

  // ── Pointer Down (Start Drag) ──
  const handlePointerDown = (shape, e) => {
    // Multi-touch protection: ignore second touch if already dragging
    if (draggingShapeId) return;

    // Ignore if already placed
    if (placedShapes[shape.id]) return;

    const pointerId = e.pointerId;
    setActivePointerId(pointerId);
    e.target.setPointerCapture?.(pointerId);

    const clientX = e.clientX;
    const clientY = e.clientY;

    const pieceElem = piecesRef.current[shape.id];
    let offset = { x: 50, y: 50 };
    if (pieceElem) {
      const rect = pieceElem.getBoundingClientRect();
      offset = {
        x: clientX - (rect.left + rect.width / 2),
        y: clientY - (rect.top + rect.height / 2)
      };
    }

    setDraggingShapeId(shape.id);
    setDragOffset(offset);
    setDragCurrentPos({ x: clientX, y: clientY });

    lastProgressTimeRef.current = Date.now();
    lastTouchedShapeIdRef.current = shape.id;

    // Track reaction latency from round start to first touch
    if (!shapeFirstTouchTimeRef.current[shape.id]) {
      const latency = Date.now() - roundStartTimeRef.current;
      shapeFirstTouchTimeRef.current[shape.id] = latency;
      telemetryRef.current?.logEvent('shape_first_touch', {
        roundNumber: currentRoundIndex + 1,
        shapeId: shape.id,
        payload: { latencyMs: latency }
      });
    }

    // Initialize attempt record
    if (!shapeAttemptsMapRef.current[shape.id]) {
      shapeAttemptsMapRef.current[shape.id] = {
        shapeId: shape.id,
        roundNumber: currentRoundIndex + 1,
        difficultyTier: shape.difficultyTier,
        firstTouchLatencyMs: shapeFirstTouchTimeRef.current[shape.id] || 0,
        firstDragStartMs: Date.now() - roundStartTimeRef.current,
        incorrectAttempts: 0,
        hintsNeeded: activeHint.shapeId === shape.id ? activeHint.level : 0,
        confusionChoices: []
      };
    }

    // Start 20Hz drag motion sampling
    telemetryRef.current?.startDragSampling(shape.id, currentRoundIndex + 1, clientX, clientY);

    // Speak shape name on pickup for naming support
    speakShapeName(shape);
  };

  // ── Pointer Move (Active Dragging) ──
  const handlePointerMove = (e) => {
    if (!draggingShapeId || e.pointerId !== activePointerId) return;
    const clientX = e.clientX;
    const clientY = e.clientY;

    setDragCurrentPos({ x: clientX, y: clientY });
    lastProgressTimeRef.current = Date.now();

    // Sample coordinates for path efficiency & jitter metrics
    telemetryRef.current?.sampleDragMove(clientX, clientY);
  };

  // ── Pointer Up (Drop Evaluation) ──
  const handlePointerUp = (e) => {
    if (!draggingShapeId || e.pointerId !== activePointerId) return;

    const droppedShapeId = draggingShapeId;
    const dropX = e.clientX;
    const dropY = e.clientY;

    // Finalize motion sampling
    const motionMetrics = telemetryRef.current?.finishDragSampling(dropX, dropY);

    // Find nearest target slot within generous snap radius (~1.5x slot size ~150px)
    const currentRound = rounds[currentRoundIndex];
    let nearestSlot = null;
    let minDistance = Infinity;
    const SNAP_RADIUS = 150; // generous dementia-friendly snap tolerance

    currentRound.targetSlots.forEach((slot) => {
      const slotElem = slotsRef.current[slot.slotId];
      if (slotElem) {
        const rect = slotElem.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.hypot(dropX - centerX, dropY - centerY);

        if (dist < minDistance) {
          minDistance = dist;
          nearestSlot = slot;
        }
      }
    });

    const isNearSlot = minDistance <= SNAP_RADIUS;
    const isCorrect = isNearSlot && nearestSlot.shapeId === droppedShapeId;

    if (isCorrect) {
      // ── CORRECT DROP ──
      handleCorrectPlacement(droppedShapeId, nearestSlot.slotId, motionMetrics);
    } else {
      // ── INCORRECT OR OUT-OF-BOUNDS DROP ──
      handleIncorrectDrop(droppedShapeId, isNearSlot ? nearestSlot.shapeId : null, motionMetrics);
    }

    // Reset drag state
    setDraggingShapeId(null);
    setActivePointerId(null);
    lastProgressTimeRef.current = Date.now();
  };

  // ── Handle Correct Placement ──
  const handleCorrectPlacement = (shapeId, slotId, motionMetrics) => {
    if (soundEnabled) {
      soundEngine.playCalmSuccessChime();
    }

    // Show rotating warm affirmation
    const phrase = AFFIRMATION_PHRASES[Math.floor(Math.random() * AFFIRMATION_PHRASES.length)];
    setEncouragementText(phrase);
    setTimeout(() => setEncouragementText(''), 2200);

    const updatedPlaced = { ...placedShapes, [shapeId]: slotId };
    setPlacedShapes(updatedPlaced);

    // Compute solve time from round start
    const solveTimeMs = Date.now() - roundStartTimeRef.current;
    const attemptData = shapeAttemptsMapRef.current[shapeId] || {};
    const shape = SHAPES_BY_ID[shapeId];

    const completedAttempt = {
      roundNumber: currentRoundIndex + 1,
      shapeId,
      difficultyTier: shape?.difficultyTier || 1,
      targetSlotId: slotId,
      firstTouchLatencyMs: shapeFirstTouchTimeRef.current[shapeId] || 800,
      firstDragStartMs: attemptData.firstDragStartMs || 1000,
      solveTimeMs,
      incorrectAttempts: attemptData.incorrectAttempts || 0,
      hintsNeeded: attemptData.hintsNeeded || 0,
      solvedIndependently: (attemptData.hintsNeeded || 0) === 0,
      dragHesitationPauses: motionMetrics?.pausesCount || 0,
      pathLengthPx: motionMetrics?.pathLengthPx || 0,
      straightLineDistPx: motionMetrics?.straightLineDistPx || 0,
      pathEfficiency: motionMetrics?.pathEfficiency || 1.0,
      tremorJitterProxy: motionMetrics?.tremorJitterProxy || 0,
      confusionChoices: attemptData.confusionChoices || []
    };

    telemetryRef.current?.recordAttemptResult(completedAttempt);
    telemetryRef.current?.logEvent('drop_correct', {
      roundNumber: currentRoundIndex + 1,
      shapeId,
      payload: { solveTimeMs, slotId }
    });

    // Check if round is complete (all 4 shapes placed)
    const currentRound = rounds[currentRoundIndex];
    const isRoundDone = currentRound.shapes.every(s => updatedPlaced[s.id]);

    if (isRoundDone) {
      handleRoundCompletion(updatedPlaced);
    }
  };

  // ── Handle Incorrect Drop ──
  const handleIncorrectDrop = (shapeId, mistakenTargetShapeId, motionMetrics) => {
    if (soundEnabled) {
      soundEngine.playGentleOrientationTone();
    }

    // Log attempt as incorrect without negative visual feedback
    if (!shapeAttemptsMapRef.current[shapeId]) {
      shapeAttemptsMapRef.current[shapeId] = {
        hintsNeeded: 0,
        incorrectAttempts: 0,
        confusionChoices: []
      };
    }
    shapeAttemptsMapRef.current[shapeId].incorrectAttempts += 1;

    if (mistakenTargetShapeId && mistakenTargetShapeId !== shapeId) {
      shapeAttemptsMapRef.current[shapeId].confusionChoices.push(mistakenTargetShapeId);
    }

    telemetryRef.current?.logEvent('drop_incorrect', {
      roundNumber: currentRoundIndex + 1,
      shapeId,
      payload: {
        mistakenTargetShapeId: mistakenTargetShapeId || 'none',
        motionMetrics
      }
    });
  };

  // ── Handle Round Completion ──
  const handleRoundCompletion = (finalPlaced) => {
    const roundDuration = Date.now() - roundStartTimeRef.current;
    telemetryRef.current?.logEvent('round_end', {
      roundNumber: currentRoundIndex + 1,
      payload: { durationMs: roundDuration }
    });

    if (currentRoundIndex < 4) {
      // Gentle pause before advancing to next round
      setTimeout(() => {
        setCurrentRoundIndex(prev => prev + 1);
        setPlacedShapes({});
        roundStartTimeRef.current = Date.now();
        lastProgressTimeRef.current = Date.now();
        shapeFirstTouchTimeRef.current = {};
        setActiveHint({ shapeId: null, level: 0, ghostPos: null });

        telemetryRef.current?.logEvent('round_start', {
          roundNumber: currentRoundIndex + 2,
          payload: { shapes: rounds[currentRoundIndex + 1]?.shapes.map(s => s.id) || [] }
        });
      }, 1000);
    } else {
      // Completed all 5 rounds!
      setTimeout(async () => {
        setIsComplete(true);
        if (telemetryRef.current) {
          await telemetryRef.current.endSession({
            status: 'COMPLETED',
            totalDurationMs: Math.max(1000, Date.now() - sessionStartTimeRef.current),
            roundsCompleted: 5
          });
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('smritisetu:game_completed', { detail: { game: 'shape', patientId } }));
          try {
            if (typeof BroadcastChannel !== 'undefined') {
              const ch = new BroadcastChannel('smritisetu_sync');
              ch.postMessage({ type: 'GAME_COMPLETED', game: 'shape', patientId });
              ch.close();
            }
          } catch (e) {}
        }
      }, 1000);
    }
  };

  // ── Play Again Action ──
  const handlePlayAgain = () => {
    const newSeed = String(Date.now());
    sessionStartTimeRef.current = Date.now();
    setSessionSeed(newSeed);
    setRounds(generateShapeGameRounds(Date.now()));
    setCurrentRoundIndex(0);
    setPlacedShapes({});
    setIsComplete(false);
    setEncouragementText('');
    lastProgressTimeRef.current = Date.now();
    roundStartTimeRef.current = Date.now();
    shapeFirstTouchTimeRef.current = {};
    shapeAttemptsMapRef.current = {};
  };

  // ── Take Rest Action ──
  const handleTakeRest = async () => {
    if (telemetryRef.current) {
      await telemetryRef.current.endSession({
        status: isComplete ? 'COMPLETED' : 'ABANDONED',
        totalDurationMs: Math.max(1000, Date.now() - sessionStartTimeRef.current),
        roundsCompleted: currentRoundIndex + (isComplete ? 1 : 0)
      });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('smritisetu:game_completed', { detail: { game: 'shape', patientId } }));
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const ch = new BroadcastChannel('smritisetu_sync');
            ch.postMessage({ type: 'GAME_COMPLETED', game: 'shape', patientId });
            ch.close();
          }
        } catch (e) {}
      }
    }
    onExitToRest();
  };

  const currentRound = rounds[currentRoundIndex] || rounds[0];

  // ── RENDER: WARM COMPLETION SCREEN ──
  if (isComplete) {
    return (
      <div className="w-full max-w-2xl mx-auto my-8 p-8 sm:p-12 bg-white rounded-3xl border-3 border-emerald-200 shadow-xl text-center space-y-8 select-none">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-3xl mx-auto flex items-center justify-center shadow-inner">
          <Heart className="w-12 h-12 fill-emerald-600 text-emerald-600 animate-pulse" />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Splendid Work!
          </h2>
          <p className="text-xl sm:text-2xl text-slate-700 font-medium">
            You have matched all the shapes today.
          </p>
          <p className="text-base text-slate-500">
            A calm, peaceful mind is ready to rest or continue when you wish.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={handlePlayAgain}
            className="w-full sm:w-auto px-8 py-5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xl rounded-2xl shadow-lg border-2 border-indigo-900 flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-7 h-7" />
            <span>Play Again</span>
          </button>

          <button
            onClick={handleTakeRest}
            className="w-full sm:w-auto px-8 py-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xl rounded-2xl shadow-lg border-2 border-emerald-900 flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer"
          >
            <Coffee className="w-7 h-7" />
            <span>Take Rest</span>
          </button>
        </div>
      </div>
    );
  }

  // ── RENDER: ACTIVE MATCH THE SHAPES BOARD ──
  return (
    <div
      ref={gameBoardRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="w-full max-w-4xl mx-auto my-4 p-4 sm:p-6 bg-slate-50/90 rounded-3xl border-2 border-slate-200 shadow-lg select-none relative overflow-hidden"
      style={{ touchAction: 'none' }} // Prevents accidental page scrolling/pull-to-refresh
    >
      {/* Top Header: Gentle Round Dots & Audio Toggle */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5 text-emerald-700" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-800">
            Match the Shapes
          </span>
        </div>

        {/* Gentle 5-dot round indicator (No numbers, no timer) */}
        <div className="flex items-center gap-2.5 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm" aria-label="Round progress">
          {[0, 1, 2, 3, 4].map((dotIdx) => {
            const isCurrent = dotIdx === currentRoundIndex;
            const isDone = dotIdx < currentRoundIndex;
            return (
              <div
                key={dotIdx}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? 'bg-emerald-600 scale-125 ring-3 ring-emerald-200'
                    : isDone
                    ? 'bg-emerald-400'
                    : 'bg-slate-200'
                }`}
              />
            );
          })}
        </div>

        {/* Sound toggle & Take rest shortcut */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(prev => !prev)}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute audio' : 'Enable audio'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-700" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>

          <button
            onClick={handleTakeRest}
            className="px-3.5 py-2 rounded-xl bg-slate-200/90 text-slate-700 hover:text-slate-900 font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Coffee className="w-4 h-4" />
            <span className="hidden xs:inline">Take Rest</span>
          </button>
        </div>
      </div>

      {/* Encouragement Floating Toast */}
      {encouragementText && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-emerald-600 text-white font-bold text-lg px-6 py-2.5 rounded-full shadow-xl border border-emerald-400 animate-bounce">
          {encouragementText}!
        </div>
      )}

      {/* ── UPPER ZONE: TARGET SLOTS ("Shape Holders") ── */}
      <div className="my-6">
        <div className="text-center mb-3">
          <span className="text-xs uppercase tracking-wider font-bold text-slate-600">
            Shape Holders
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
          {currentRound.targetSlots.map((slot) => {
            const isFilled = Boolean(placedShapes[slot.shapeId]);
            const isHintTarget = activeHint.shapeId === slot.shapeId;

            return (
              <div
                key={slot.slotId}
                ref={(el) => (slotsRef.current[slot.slotId] = el)}
                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-2xl flex items-center justify-center transition-all duration-300 relative ${
                  isFilled
                    ? 'bg-emerald-50 border-3 border-emerald-500 shadow-md ring-4 ring-emerald-100'
                    : isHintTarget
                    ? 'bg-amber-50 border-3 border-amber-400 shadow-lg ring-4 ring-amber-200 animate-pulse'
                    : 'bg-white border-3 border-dashed border-slate-300 shadow-inner'
                }`}
              >
                {/* Outlined Slot Silhouette */}
                <ShapeSvg
                  shape={slot.shape}
                  mode={isFilled ? 'colored' : 'outline'}
                  size={96}
                  className={isFilled ? 'scale-100' : 'scale-95'}
                />

                {/* Gentle checkmark when placed */}
                {isFilled && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── LOWER ZONE: DRAGGABLE PIECES SHELF ── */}
      <div className="mt-8 pt-6 border-t border-slate-200/90 bg-white/70 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="text-center mb-4">
          <span className="text-xs uppercase tracking-wider font-bold text-slate-600">
            Touch and Drag Shapes into Matching Holders
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
          {currentRound.draggablePieces.map((piece) => {
            const isPlaced = Boolean(placedShapes[piece.shapeId]);
            const isBeingDragged = draggingShapeId === piece.shapeId;
            const isHintPiece = activeHint.shapeId === piece.shapeId && !isPlaced;

            if (isPlaced) {
              return (
                <div
                  key={piece.pieceId}
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-2 border-dotted border-slate-200 flex items-center justify-center opacity-30 select-none"
                >
                  <CheckCircle2 className="w-8 h-8 text-slate-400" />
                </div>
              );
            }

            return (
              <div
                key={piece.pieceId}
                ref={(el) => (piecesRef.current[piece.shapeId] = el)}
                onPointerDown={(e) => handlePointerDown(piece.shape, e)}
                className={`w-28 h-28 sm:w-36 sm:h-36 rounded-2xl flex flex-col items-center justify-center p-2 transition-all cursor-grab active:cursor-grabbing select-none ${
                  isBeingDragged
                    ? 'opacity-20'
                    : isHintPiece
                    ? 'ring-4 ring-amber-300 shadow-xl scale-105 bg-amber-50/50'
                    : 'bg-white hover:bg-slate-50 border-2 border-slate-200 shadow-md hover:shadow-lg'
                }`}
                style={{ touchAction: 'none' }}
              >
                <ShapeSvg
                  shape={piece.shape}
                  mode="colored"
                  size={96}
                  className={isHintPiece ? 'animate-bounce' : ''}
                />
                <span className="text-xs sm:text-sm font-bold text-slate-700 mt-1 truncate max-w-[120px]">
                  {piece.shape.displayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── DRAGGING GHOST/FLOATING PIECE (Follows Pointer) ── */}
      {draggingShapeId && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${dragCurrentPos.x}px`,
            top: `${dragCurrentPos.y}px`,
            filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.25))'
          }}
        >
          <div className="scale-110">
            <ShapeSvg
              shape={SHAPES_BY_ID[draggingShapeId]}
              mode="colored"
              size={108}
            />
          </div>
          <div className="mt-2 text-center bg-slate-900/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
            {SHAPES_BY_ID[draggingShapeId]?.displayName}
          </div>
        </div>
      )}

      {/* ── HINT 2 & 3: GLIDING TRANSLUCENT GHOST ── */}
      {activeHint.level >= 2 && activeHint.ghostPos && !draggingShapeId && (
        <div
          className="fixed pointer-events-none z-40 transition-all duration-1000 ease-in-out"
          style={{
            left: `${activeHint.ghostPos.endX}px`,
            top: `${activeHint.ghostPos.endY}px`,
            animation: 'glideHint 3.5s infinite ease-in-out'
          }}
        >
          <ShapeSvg
            shape={SHAPES_BY_ID[activeHint.shapeId]}
            mode="ghost"
            size={96}
          />
        </div>
      )}

      {/* Keyframe animation for gliding ghost */}
      <style>{`
        @keyframes glideHint {
          0% {
            opacity: 0;
            transform: translate(${
              activeHint.ghostPos ? activeHint.ghostPos.startX - activeHint.ghostPos.endX : 0
            }px, ${
              activeHint.ghostPos ? activeHint.ghostPos.startY - activeHint.ghostPos.endY : 0
            }px) scale(0.95);
          }
          30% {
            opacity: 0.65;
          }
          80% {
            opacity: 0.65;
            transform: translate(0px, 0px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(0px, 0px) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
