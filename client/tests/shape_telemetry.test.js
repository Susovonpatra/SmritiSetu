import test from 'node:test';
import assert from 'node:assert/strict';
import { ShapeGameTelemetryService } from '../src/services/shapeGameTelemetry.js';

test('Shape Telemetry: Drag motion sampling and metrics calculation', () => {
  const service = new ShapeGameTelemetryService('test-session-001', 1);

  // Simulate starting a drag at (100, 100)
  service.startDragSampling('circle', 1, 100, 100);
  assert.ok(service.activeDrag, 'Active drag should be initiated');

  // Simulate movement
  service.sampleDragMove(150, 120);
  service.sampleDragMove(200, 150);
  service.sampleDragMove(300, 300);

  // Finish drag at (300, 300)
  const metrics = service.finishDragSampling(300, 300);
  assert.ok(metrics, 'Metrics object must be returned');
  assert.strictEqual(metrics.shapeId, 'circle');
  assert.strictEqual(metrics.roundNumber, 1);
  assert.ok(metrics.pathLengthPx >= metrics.straightLineDistPx, 'Path length >= straight line distance');
  assert.ok(metrics.pathEfficiency <= 1.0 && metrics.pathEfficiency > 0, 'Path efficiency between 0 and 1');
  assert.strictEqual(typeof metrics.pausesCount, 'number');
  assert.strictEqual(typeof metrics.directionChanges, 'number');
  assert.strictEqual(typeof metrics.tremorJitterProxy, 'number');

  service.destroy();
});

test('Shape Telemetry: Event queue buffering and attempt recording', async () => {
  const service = new ShapeGameTelemetryService('test-session-002', 1);

  const eventId = await service.logEvent('hint_shown', {
    roundNumber: 1,
    shapeId: 'square',
    payload: { level: 1 }
  });

  assert.ok(eventId, 'logEvent returns unique eventId string');
  assert.strictEqual(service.eventQueue.length, 1);
  assert.strictEqual(service.eventQueue[0].eventType, 'hint_shown');

  // Record an attempt result
  service.recordAttemptResult({
    roundNumber: 1,
    shapeId: 'square',
    solveTimeMs: 3200,
    hintsNeeded: 1,
    incorrectAttempts: 0
  });

  assert.strictEqual(service.attemptRecords.length, 1);
  assert.strictEqual(service.attemptRecords[0].shapeId, 'square');

  service.destroy();
});
