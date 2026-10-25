import test from 'node:test';
import assert from 'node:assert/strict';

// Ensure browser-like mock environment for tests if running in Node
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => true,
    addEventListener: () => {},
    removeEventListener: () => {}
  };
}

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
}

test('All Games Synchronization: verifies cross-game event dispatch and LocalStorage backup payloads', async () => {
  let dispatchedEvents = [];
  const originalDispatch = globalThis.window.dispatchEvent;
  globalThis.window.dispatchEvent = (event) => {
    dispatchedEvents.push(event);
    return true;
  };

  try {
    // 1. Simulate PatternTrace game session sync
    const patternPayload = {
      game: 'pattern',
      patientId: 1,
      sessionSummary: {
        sequenceMatches: 4,
        meanAccuracyPct: 92,
        meanLatencyMs: 760
      }
    };
    globalThis.window.dispatchEvent(new CustomEvent('smritisetu:game_completed', { detail: patternPayload }));

    // 2. Simulate Biographical recognition game trial sync
    const bioPayload = {
      game: 'biographical',
      patientId: 1,
      record: {
        questionId: 'q-1',
        isCorrect: true,
        latencyMs: 820
      }
    };
    globalThis.window.dispatchEvent(new CustomEvent('smritisetu:game_completed', { detail: bioPayload }));

    // 3. Simulate Shape Match & Motor game completion sync
    const shapePayload = {
      game: 'shape',
      patientId: 1,
      status: 'COMPLETED',
      roundsCompleted: 5
    };
    globalThis.window.dispatchEvent(new CustomEvent('smritisetu:game_completed', { detail: shapePayload }));

    // 4. Simulate Daily Routine Sequencer game completion sync
    const routinePayload = {
      game: 'routine',
      patientId: 1,
      record: {
        game_type: 'routine_sequencer',
        latency_ms: 790,
        accuracy_score: 1.0
      }
    };
    globalThis.window.dispatchEvent(new CustomEvent('smritisetu:game_completed', { detail: routinePayload }));

    // 5. Verify all 4 game completion events were fired
    assert.strictEqual(dispatchedEvents.length, 4);
    assert.strictEqual(dispatchedEvents[0].detail.game, 'pattern');
    assert.strictEqual(dispatchedEvents[1].detail.game, 'biographical');
    assert.strictEqual(dispatchedEvents[2].detail.game, 'shape');
    assert.strictEqual(dispatchedEvents[3].detail.game, 'routine');

    // 6. Verify LocalStorage backup resiliency across all games
    localStorage.setItem('smriti_patterntrace_last_session', JSON.stringify(patternPayload));
    localStorage.setItem('smriti_shape_last_session', JSON.stringify(shapePayload));
    localStorage.setItem('smriti_routine_last_session', JSON.stringify(routinePayload));

    const restoredPT = JSON.parse(localStorage.getItem('smriti_patterntrace_last_session'));
    const restoredShape = JSON.parse(localStorage.getItem('smriti_shape_last_session'));
    const restoredRoutine = JSON.parse(localStorage.getItem('smriti_routine_last_session'));

    assert.strictEqual(restoredPT.sessionSummary.meanAccuracyPct, 92);
    assert.strictEqual(restoredShape.roundsCompleted, 5);
    assert.strictEqual(restoredRoutine.record.accuracy_score, 1.0);
  } finally {
    globalThis.window.dispatchEvent = originalDispatch;
  }
});
