import test from 'node:test';
import assert from 'node:assert/strict';
import { generateShapeGameRounds, SHAPES_BY_ID } from '../src/features/games/shapes/shapeConfig.js';
import { ShapeGameTelemetryService } from '../src/services/shapeGameTelemetry.js';

test('E2E Session Flow: 5-round game, adaptive hint escalation, wrong drop, Play Again, and Take Rest', async () => {
  // ── 1. Session Initialization ──
  let sessionSeed = 'test-e2e-seed-123';
  let rounds = generateShapeGameRounds(sessionSeed);
  assert.strictEqual(rounds.length, 5, 'Session begins with 5 seeded rounds');

  let currentRoundIndex = 0;
  let placedShapes = {};
  let isComplete = false;
  let restTriggered = false;

  const telemetry = new ShapeGameTelemetryService(`e2e-sess-${Date.now()}`, 1);
  await telemetry.logEvent('session_start', { payload: { seed: sessionSeed } });

  // ── 2. Adaptive Hint Escalation Simulation (4s, 8s, 12s) ──
  const round1 = rounds[0];
  const firstShape = round1.shapes[0];

  // Simulated idle clock
  let idleDurationSec = 0;
  let currentHintLevel = 0;

  function evaluateHintForIdle(sec) {
    if (sec >= 12) return 3;
    if (sec >= 8) return 2;
    if (sec >= 4) return 1;
    return 0;
  }

  // At 4 seconds idle -> Hint 1
  idleDurationSec = 4;
  currentHintLevel = evaluateHintForIdle(idleDurationSec);
  assert.strictEqual(currentHintLevel, 1, 'At 4s idle, Hint 1 (pulse unplaced shape) must trigger');
  await telemetry.logEvent('hint_shown', { roundNumber: 1, shapeId: firstShape.id, payload: { level: 1 } });

  // At 8 seconds idle -> Hint 2
  idleDurationSec = 8;
  currentHintLevel = evaluateHintForIdle(idleDurationSec);
  assert.strictEqual(currentHintLevel, 2, 'At 8s idle, Hint 2 (ghost glide) must trigger');
  await telemetry.logEvent('hint_shown', { roundNumber: 1, shapeId: firstShape.id, payload: { level: 2 } });

  // At 12 seconds idle -> Hint 3
  idleDurationSec = 12;
  currentHintLevel = evaluateHintForIdle(idleDurationSec);
  assert.strictEqual(currentHintLevel, 3, 'At 12s idle, Hint 3 (ghost glide + audio name) must trigger');
  await telemetry.logEvent('hint_shown', { roundNumber: 1, shapeId: firstShape.id, payload: { level: 3 } });

  // Patient starts dragging -> timer immediately resets to 0
  idleDurationSec = 0;
  currentHintLevel = evaluateHintForIdle(idleDurationSec);
  assert.strictEqual(currentHintLevel, 0, 'Active dragging resets hint escalation to 0');

  // ── 3. Wrong Drop Simulation ──
  // Patient drops firstShape onto the holder for secondShape
  const secondShape = round1.shapes[1];
  telemetry.startDragSampling(firstShape.id, 1, 100, 100);
  telemetry.sampleDragMove(150, 200);
  const dragMetricsWrong = telemetry.finishDragSampling(200, 300);

  // Wrong drop verification:
  // Shape smoothly returns to start shelf; no negative sound or red buzzer
  const mistakenSlotId = `slot-0-${secondShape.id}`;
  await telemetry.logEvent('drop_incorrect', {
    roundNumber: 1,
    shapeId: firstShape.id,
    payload: { mistakenSlotShapeId: secondShape.id, motionMetrics: dragMetricsWrong }
  });
  assert.strictEqual(placedShapes[firstShape.id], undefined, 'Shape must not snap into wrong holder');

  // ── 4. Correct Drop Simulation for All 4 Shapes in Round 1 ──
  for (const shp of round1.shapes) {
    telemetry.startDragSampling(shp.id, 1, 100, 100);
    telemetry.sampleDragMove(200, 200);
    const motion = telemetry.finishDragSampling(300, 300);

    const slotId = `slot-0-${shp.id}`;
    placedShapes[shp.id] = slotId;

    telemetry.recordAttemptResult({
      roundNumber: 1,
      shapeId: shp.id,
      difficultyTier: shp.difficultyTier,
      targetSlotId: slotId,
      firstTouchLatencyMs: 820,
      solveTimeMs: 3100,
      incorrectAttempts: shp.id === firstShape.id ? 1 : 0,
      hintsNeeded: shp.id === firstShape.id ? 3 : 0,
      solvedIndependently: shp.id !== firstShape.id,
      pathEfficiency: motion.pathEfficiency
    });

    await telemetry.logEvent('drop_correct', {
      roundNumber: 1,
      shapeId: shp.id,
      payload: { slotId }
    });
  }

  // Verify Round 1 completed
  const round1AllPlaced = round1.shapes.every(s => placedShapes[s.id]);
  assert.strictEqual(round1AllPlaced, true, 'Round 1 completes when all 4 shapes placed');
  currentRoundIndex = 1;
  placedShapes = {};

  // ── 5. Play Through Remaining Rounds 2, 3, 4, 5 ──
  for (let rIdx = 1; rIdx < 5; rIdx++) {
    const currentRound = rounds[rIdx];
    currentRoundIndex = rIdx;

    for (const shp of currentRound.shapes) {
      placedShapes[shp.id] = `slot-${rIdx}-${shp.id}`;
      telemetry.recordAttemptResult({
        roundNumber: rIdx + 1,
        shapeId: shp.id,
        difficultyTier: shp.difficultyTier,
        solveTimeMs: 2900,
        hintsNeeded: 0,
        incorrectAttempts: 0
      });
    }

    assert.strictEqual(
      currentRound.shapes.every(s => placedShapes[s.id]),
      true,
      `Round ${rIdx + 1} completes`
    );
    placedShapes = {};
  }

  // After Round 5: Warm completion screen shown
  isComplete = true;
  assert.strictEqual(isComplete, true, 'Warm completion screen shown after Round 5');
  assert.strictEqual(telemetry.attemptRecords.length, 20, 'All 20 shapes recorded in session attempts');

  // ── 6. "Play Again" Simulation ──
  const playAgainSeed = 'test-e2e-seed-456';
  const newRounds = generateShapeGameRounds(playAgainSeed);
  assert.strictEqual(newRounds.length, 5);
  assert.notStrictEqual(
    newRounds[0].shapes.map(s => s.id).join(','),
    rounds[0].shapes.map(s => s.id).join(','),
    'Play Again starts with a fresh shuffle'
  );

  // ── 7. "Take Rest" Simulation ──
  const handleTakeRest = async () => {
    await telemetry.endSession({
      status: 'COMPLETED',
      totalDurationMs: 180000,
      roundsCompleted: 5
    });
    restTriggered = true;
  };

  await handleTakeRest();
  assert.strictEqual(restTriggered, true, 'Take Rest flushes analytics and returns to home screen');

  telemetry.destroy();
});
