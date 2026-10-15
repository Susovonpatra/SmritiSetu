import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHAPES_CONFIG,
  SHAPES_BY_ID,
  generateShapeGameRounds
} from '../src/features/games/shapes/shapeConfig.js';

test('Shape Config: Exactly 20 shapes defined with complete metadata', () => {
  assert.strictEqual(SHAPES_CONFIG.length, 20, 'Must have exactly 20 shapes');

  const expectedShapes = [
    'triangle', 'right_triangle', 'square', 'rectangle', 'rhombus',
    'parallelogram', 'trapezium', 'kite', 'pentagon', 'hexagon',
    'heptagon', 'octagon', 'circle', 'ring', 'ellipse',
    'semicircle', 'crescent', 'star', 'cross', 'heart'
  ];

  for (const expectedId of expectedShapes) {
    const shape = SHAPES_BY_ID[expectedId];
    assert.ok(shape, `Shape ${expectedId} must exist in config`);
    assert.ok(shape.displayName, `Shape ${expectedId} must have displayName`);
    assert.ok(shape.difficultyTier >= 1 && shape.difficultyTier <= 3, `Shape ${expectedId} must have valid tier 1-3`);
    assert.ok(shape.similarityGroup, `Shape ${expectedId} must have similarityGroup`);
    assert.ok(shape.fillColor, `Shape ${expectedId} must have fillColor`);
    assert.ok(shape.strokeColor, `Shape ${expectedId} must have strokeColor`);
    assert.ok(shape.localizedNames, `Shape ${expectedId} must have localizedNames dictionary`);
    assert.ok(shape.localizedNames.en, `Shape ${expectedId} must have English name`);
    assert.ok(shape.localizedNames.or, `Shape ${expectedId} must have Odia name`);
    assert.ok(shape.localizedNames.gu, `Shape ${expectedId} must have Gujarati name`);
    assert.ok(shape.localizedNames.as, `Shape ${expectedId} must have Assamese name`);
  }
});

test('Round Generator: Seeded generation invariant test across 50 random seeds', () => {
  for (let s = 1; s <= 50; s++) {
    const rounds = generateShapeGameRounds(s);
    assert.strictEqual(rounds.length, 5, `Seed ${s} must generate exactly 5 rounds`);

    const allShapeIds = [];

    rounds.forEach((round, rIdx) => {
      assert.strictEqual(round.shapes.length, 4, `Seed ${s} round ${rIdx} must have 4 shapes`);
      assert.strictEqual(round.targetSlots.length, 4, `Seed ${s} round ${rIdx} must have 4 slots`);
      assert.strictEqual(round.draggablePieces.length, 4, `Seed ${s} round ${rIdx} must have 4 pieces`);

      // Similarity group invariant: NO two shapes from same similarity group in any round!
      const groupSet = new Set(round.shapes.map(shp => shp.similarityGroup));
      assert.strictEqual(
        groupSet.size,
        4,
        `Seed ${s} round ${rIdx} violates similarity group rule: contains duplicates`
      );

      round.shapes.forEach(shp => allShapeIds.push(shp.id));
    });

    // Exactly 20 unique shapes per session
    assert.strictEqual(
      allShapeIds.length,
      20,
      `Seed ${s} must have 20 total shapes across 5 rounds`
    );
    const uniqueIds = new Set(allShapeIds);
    assert.strictEqual(
      uniqueIds.size,
      20,
      `Seed ${s} must have 20 UNIQUE shapes (no duplicates across rounds)`
    );
  }
});

test('Round Generator: Independent shuffling of target slots and draggable pieces', () => {
  const rounds = generateShapeGameRounds(999);
  // Across 5 rounds, slot order and piece order should not be identical in all rounds
  let differentOrderCount = 0;
  for (const r of rounds) {
    const slotIds = r.targetSlots.map(s => s.shapeId).join(',');
    const pieceIds = r.draggablePieces.map(p => p.shapeId).join(',');
    if (slotIds !== pieceIds) {
      differentOrderCount++;
    }
  }
  assert.ok(differentOrderCount > 0, 'Slots and pieces must be independently shuffled');
});
