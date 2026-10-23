/**
 * Shape Configuration and Definitions for "Match the Shapes"
 * 20 Total unique shapes, clean vector geometry, similarity groups, difficulty tiers,
 * and deterministic seeded round generation adhering to the similarity group rule.
 */

export const SIMILARITY_GROUPS = {
  TRIANGLES: 'triangles',
  QUAD_ORTHOGONAL: 'quad_orthogonal',
  QUAD_SLANTED: 'quad_slanted',
  POLYGONS: 'polygons',
  CURVED_CLOSED: 'curved_closed',
  CURVED_ARCS: 'curved_arcs',
  SPECIAL_SYMBOLS: 'special_symbols'
};

export const SHAPES_CONFIG = [
  // 1. Triangle
  {
    id: 'triangle',
    displayName: 'Triangle',
    localizedNames: {
      en: 'Triangle',
      or: 'ତ୍ରିଭୁଜ (Triangle)',
      gu: 'ત્રિકોણ (Triangle)',
      as: 'ত্ৰিভুজ (Triangle)'
    },
    difficultyTier: 1,
    similarityGroup: SIMILARITY_GROUPS.TRIANGLES,
    fillColor: '#f97316',
    strokeColor: '#ea580c',
    type: 'polygon',
    points: '50,15 85,85 15,85'
  },

  // 2. Right Triangle
  {
    id: 'right_triangle',
    displayName: 'Right Triangle',
    localizedNames: {
      en: 'Right Triangle',
      or: 'ସମକୋଣୀ ତ୍ରିଭୁଜ (Right Triangle)',
      gu: 'કાટકોણ ત્રિકોણ (Right Triangle)',
      as: 'সমকোণী ত্ৰিভুজ (Right Triangle)'
    },
    difficultyTier: 2,
    similarityGroup: SIMILARITY_GROUPS.TRIANGLES,
    fillColor: '#14b8a6',
    strokeColor: '#0d9488',
    type: 'polygon',
    points: '20,15 20,85 85,85'
  },

  // 3. Square
  {
    id: 'square',
    displayName: 'Square',
    localizedNames: {
      en: 'Square',
      or: 'ବର୍ଗକ୍ଷେତ୍ର (Square)',
      gu: 'ચોરસ (Square)',
      as: 'বৰ্গক্ষেত্ৰ (Square)'
    },
    difficultyTier: 1,
    similarityGroup: SIMILARITY_GROUPS.QUAD_ORTHOGONAL,
    fillColor: '#6366f1',
    strokeColor: '#4f46e5',
    type: 'rect',
    x: 18,
    y: 18,
    width: 64,
    height: 64,
    rx: 4
  },

  // 4. Rectangle
  {
    id: 'rectangle',
    displayName: 'Rectangle',
    localizedNames: {
      en: 'Rectangle',
      or: 'ଆୟତକ୍ଷେତ୍ର (Rectangle)',
      gu: 'લંબચોરસ (Rectangle)',
      as: 'আয়তক্ষেত্ৰ (Rectangle)'
    },
    difficultyTier: 2,
    similarityGroup: SIMILARITY_GROUPS.QUAD_ORTHOGONAL,
    fillColor: '#8b5cf6',
    strokeColor: '#7c3aed',
    type: 'rect',
    x: 12,
    y: 26,
    width: 76,
    height: 48,
    rx: 4
  },

  // 5. Rhombus
  {
    id: 'rhombus',
    displayName: 'Rhombus',
    localizedNames: {
      en: 'Rhombus',
      or: 'ରମ୍ବସ୍ (Rhombus)',
      gu: 'સમબાજુ ચતુષ્કોણ (Rhombus)',
      as: 'ৰম্বাছ (Rhombus)'
    },
    difficultyTier: 2,
    similarityGroup: SIMILARITY_GROUPS.QUAD_ORTHOGONAL,
    fillColor: '#06b6d4',
    strokeColor: '#0891b2',
    type: 'polygon',
    points: '50,14 86,50 50,86 14,50'
  },

  // 6. Parallelogram
  {
    id: 'parallelogram',
    displayName: 'Parallelogram',
    localizedNames: {
      en: 'Parallelogram',
      or: 'ସାମାନ୍ତରିକ କ୍ଷେତ୍ର (Parallelogram)',
      gu: 'સમાંતરબાજુ ચતુષ્કોણ (Parallelogram)',
      as: 'সামান্তৰিক (Parallelogram)'
    },
    difficultyTier: 3,
    similarityGroup: SIMILARITY_GROUPS.QUAD_SLANTED,
    fillColor: '#84cc16',
    strokeColor: '#65a30d',
    type: 'polygon',
    points: '32,22 88,22 68,78 12,78'
  },

  // 7. Trapezium
  {
    id: 'trapezium',
    displayName: 'Trapezium',
    localizedNames: {
      en: 'Trapezium',
      or: 'ଟ୍ରାପିଜିୟମ (Trapezium)',
      gu: 'સમલંબ ચતુષ્કોણ (Trapezium)',
      as: 'ট্ৰেপিজিয়াম (Trapezium)'
    },
    difficultyTier: 3,
    similarityGroup: SIMILARITY_GROUPS.QUAD_SLANTED,
    fillColor: '#0ea5e9',
    strokeColor: '#0284c7',
    type: 'polygon',
    points: '30,22 70,22 88,78 12,78'
  },

  // 8. Kite
  {
    id: 'kite',
    displayName: 'Kite',
    localizedNames: {
      en: 'Kite',
      or: 'ଗୁଡ଼ି ଆକୃତି (Kite)',
      gu: 'પતંગાકાર (Kite)',
      as: 'পতংগ আকাৰ (Kite)'
    },
    difficultyTier: 3,
    similarityGroup: SIMILARITY_GROUPS.QUAD_SLANTED,
    fillColor: '#d946ef',
    strokeColor: '#c026d3',
    type: 'polygon',
    points: '50,12 84,40 50,88 16,40'
  },

  // 9. Pentagon
  {
    id: 'pentagon',
    displayName: 'Pentagon',
    localizedNames: {
      en: 'Pentagon',
      or: 'ପଞ୍ଚଭୁଜ (Pentagon)',
      gu: 'પંચકોણ (Pentagon)',
      as: 'পঞ্চভুজ (Pentagon)'
    },
    difficultyTier: 3,
    similarityGroup: SIMILARITY_GROUPS.POLYGONS,
    fillColor: '#d97706',
    strokeColor: '#b45309',
    type: 'polygon',
    points: '50,14 86,40 72,84 28,84 14,40'
  },

  // 10. Hexagon
  {
    id: 'hexagon',
    displayName: 'Hexagon',
    localizedNames: {
      en: 'Hexagon',
      or: 'ଷଡ଼ଭୁଜ (Hexagon)',
      gu: 'ષટ્કોણ (Hexagon)',
      as: 'ষড়ভুজ (Hexagon)'
    },
    difficultyTier: 3,
    similarityGroup: SIMILARITY_GROUPS.POLYGONS,
    fillColor: '#059669',
    strokeColor: '#047857',
    type: 'polygon',
    points: '50,14 84,32 84,68 50,86 16,68 16,32'
  },

  // 11. Heptagon
  {
    id: 'heptagon',
    displayName: 'Heptagon',
    localizedNames: {
      en: 'Heptagon',
      or: 'ସପ୍ତଭୁଜ (Heptagon)',
      gu: 'સપ્તકોણ (Heptagon)',
      as: 'সপ্তভুজ (Heptagon)'
    },
    difficultyTier: 3,
    similarityGroup: SIMILARITY_GROUPS.POLYGONS,
    fillColor: '#7c3aed',
    strokeColor: '#6d28d9',
    type: 'polygon',
    points: '50,14 80,27 88,57 69,84 31,84 12,57 20,27'
  },

  // 12. Octagon
  {
    id: 'octagon',
    displayName: 'Octagon',
    localizedNames: {
      en: 'Octagon',
      or: 'ଅଷ୍ଟଭୁଜ (Octagon)',
      gu: 'અષ્ટકોણ (Octagon)',
      as: 'অষ্টভুজ (Octagon)'
    },
    difficultyTier: 3,
    similarityGroup: SIMILARITY_GROUPS.POLYGONS,
    fillColor: '#e11d48',
    strokeColor: '#be123c',
    type: 'polygon',
    points: '37,14 63,14 86,37 86,63 63,86 37,86 14,63 14,37'
  },

  // 13. Circle
  {
    id: 'circle',
    displayName: 'Circle',
    localizedNames: {
      en: 'Circle',
      or: 'ବୃତ୍ତ (Circle)',
      gu: 'વર્તુળ (Circle)',
      as: 'বৃত্ত (Circle)'
    },
    difficultyTier: 1,
    similarityGroup: SIMILARITY_GROUPS.CURVED_CLOSED,
    fillColor: '#10b981',
    strokeColor: '#059669',
    type: 'circle',
    cx: 50,
    cy: 50,
    r: 36
  },

  // 14. Ring (thick blue donut)
  {
    id: 'ring',
    displayName: 'Ring',
    localizedNames: {
      en: 'Ring',
      or: 'ମୁଦି / ବଳୟ (Ring)',
      gu: 'વીંટી / ચક્ર (Ring)',
      as: 'আঙুঠি / বলয় (Ring)'
    },
    difficultyTier: 2,
    similarityGroup: SIMILARITY_GROUPS.CURVED_CLOSED,
    fillColor: '#2563eb', // Thick blue donut per requirement
    strokeColor: '#1d4ed8',
    type: 'donut',
    outerR: 37,
    innerR: 20
  },

  // 15. Ellipse
  {
    id: 'ellipse',
    displayName: 'Ellipse',
    localizedNames: {
      en: 'Ellipse',
      or: 'ଅଣ୍ଡାକାର (Ellipse)',
      gu: 'લંબગોળ (Ellipse)',
      as: 'উপবৃত্ত (Ellipse)'
    },
    difficultyTier: 2,
    similarityGroup: SIMILARITY_GROUPS.CURVED_CLOSED,
    fillColor: '#f59e0b',
    strokeColor: '#d97706',
    type: 'ellipse',
    cx: 50,
    cy: 50,
    rx: 40,
    ry: 25
  },

  // 16. Semicircle
  {
    id: 'semicircle',
    displayName: 'Semicircle',
    localizedNames: {
      en: 'Semicircle',
      or: 'ଅର୍ଦ୍ଧବୃତ୍ତ (Semicircle)',
      gu: 'અર્ધવર્તુળ (Semicircle)',
      as: 'অৰ্ধবৃত্ত (Semicircle)'
    },
    difficultyTier: 2,
    similarityGroup: SIMILARITY_GROUPS.CURVED_ARCS,
    fillColor: '#0d9488',
    strokeColor: '#0f766e',
    type: 'path',
    d: 'M 14,64 A 36,36 0 0,1 86,64 Z'
  },

  // 17. Crescent
  {
    id: 'crescent',
    displayName: 'Crescent',
    localizedNames: {
      en: 'Crescent',
      or: 'ଜହ୍ନ କଳା (Crescent)',
      gu: 'અર્ધચંદ્ર (Crescent)',
      as: 'জোনাকী কলা (Crescent)'
    },
    difficultyTier: 3,
    similarityGroup: SIMILARITY_GROUPS.CURVED_ARCS,
    fillColor: '#4338ca',
    strokeColor: '#3730a3',
    type: 'path',
    d: 'M 68,16 A 36,36 0 1,0 68,84 A 28,28 0 0,1 68,16 Z'
  },

  // 18. Star
  {
    id: 'star',
    displayName: 'Star',
    localizedNames: {
      en: 'Star',
      or: 'ତାରକା (Star)',
      gu: 'તારો (Star)',
      as: 'তৰা (Star)'
    },
    difficultyTier: 1,
    similarityGroup: SIMILARITY_GROUPS.SPECIAL_SYMBOLS,
    fillColor: '#eab308',
    strokeColor: '#ca8a04',
    type: 'polygon',
    points: '50,12 61,36 87,36 66,52 74,77 50,61 26,77 34,52 13,36 39,36'
  },

  // 19. Cross
  {
    id: 'cross',
    displayName: 'Cross',
    localizedNames: {
      en: 'Cross',
      or: 'ଯୁକ୍ତ ଚିହ୍ନ (Cross)',
      gu: 'વત્તાકાર (Cross)',
      as: 'যোগ চিন (Cross)'
    },
    difficultyTier: 2,
    similarityGroup: SIMILARITY_GROUPS.SPECIAL_SYMBOLS,
    fillColor: '#ef4444',
    strokeColor: '#dc2626',
    type: 'polygon',
    points: '36,14 64,14 64,36 86,36 86,64 64,64 64,86 36,86 36,64 14,64 14,36 36,36'
  },

  // 20. Heart
  {
    id: 'heart',
    displayName: 'Heart',
    localizedNames: {
      en: 'Heart',
      or: 'ହୃଦୟ (Heart)',
      gu: 'હૃદય (Heart)',
      as: 'হৃদয় (Heart)'
    },
    difficultyTier: 1,
    similarityGroup: SIMILARITY_GROUPS.SPECIAL_SYMBOLS,
    fillColor: '#f43f5e',
    strokeColor: '#e11d48',
    type: 'path',
    d: 'M 50,84 C 18,62 12,38 24,24 C 36,12 48,22 50,30 C 52,22 64,12 76,24 C 88,38 82,62 50,84 Z'
  }
];

export const SHAPES_BY_ID = SHAPES_CONFIG.reduce((acc, shape) => {
  acc[shape.id] = shape;
  return acc;
}, {});

/**
 * Seeded PRNG using Mulberry32 for deterministic shuffle and reproducibility
 */
export function createMulberry32(seed) {
  let s = typeof seed === 'number' ? seed : 123456789;
  if (typeof seed === 'string') {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash) + seed.charCodeAt(i);
      hash |= 0;
    }
    s = Math.abs(hash) || 123456789;
  }

  return function next() {
    let t = (s += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded Fisher-Yates shuffle
 */
export function seededShuffle(array, rng) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates 5 rounds with 4 shapes per round (20 shapes total, each used exactly once).
 * Strictly guarantees that NO round contains two shapes from the same similarity group.
 * Draggable order and target slot order are independently shuffled.
 */
export function generateShapeGameRounds(seed = Date.now()) {
  const rng = createMulberry32(seed);

  // Group shapes by similarity group
  const groupMap = {};
  for (const shape of SHAPES_CONFIG) {
    if (!groupMap[shape.similarityGroup]) {
      groupMap[shape.similarityGroup] = [];
    }
    groupMap[shape.similarityGroup].push(shape);
  }

  // Shuffle shapes inside each group
  for (const groupKey in groupMap) {
    groupMap[groupKey] = seededShuffle(groupMap[groupKey], rng);
  }

  // Sort groups by descending size for optimal bin-packing
  const sortedGroupKeys = Object.keys(groupMap).sort(
    (a, b) => groupMap[b].length - groupMap[a].length
  );

  const rounds = Array.from({ length: 5 }, () => ({
    shapes: [],
    groups: new Set()
  }));

  // Distribute each group's shapes into 5 rounds
  for (const groupKey of sortedGroupKeys) {
    const shapes = groupMap[groupKey];
    for (const shape of shapes) {
      // Find candidate rounds that:
      // 1. Have fewer than 4 shapes
      // 2. Do NOT already contain a shape from this similarity group
      let candidateIndices = [];
      for (let rIdx = 0; rIdx < 5; rIdx++) {
        if (rounds[rIdx].shapes.length < 4 && !rounds[rIdx].groups.has(groupKey)) {
          candidateIndices.push(rIdx);
        }
      }

      if (candidateIndices.length === 0) {
        // Fallback safety if constraint resolution required backtrack
        for (let rIdx = 0; rIdx < 5; rIdx++) {
          if (rounds[rIdx].shapes.length < 4) {
            candidateIndices.push(rIdx);
          }
        }
      }

      // Pick the candidate round with minimum existing shapes (tie-break with rng)
      candidateIndices.sort((a, b) => rounds[a].shapes.length - rounds[b].shapes.length);
      const minCount = rounds[candidateIndices[0]].shapes.length;
      const tiedCandidates = candidateIndices.filter(idx => rounds[idx].shapes.length === minCount);
      const chosenRoundIdx = tiedCandidates[Math.floor(rng() * tiedCandidates.length)];

      rounds[chosenRoundIdx].shapes.push(shape);
      rounds[chosenRoundIdx].groups.add(groupKey);
    }
  }

  // Create round objects with independent shuffles for target slots & draggable items
  return rounds.map((r, roundIndex) => {
    const baseShapes = r.shapes;
    const targetSlots = seededShuffle(baseShapes, rng).map(shape => ({
      slotId: `slot-${roundIndex}-${shape.id}`,
      shapeId: shape.id,
      shape: shape
    }));

    const draggablePieces = seededShuffle(baseShapes, rng).map(shape => ({
      pieceId: `piece-${roundIndex}-${shape.id}`,
      shapeId: shape.id,
      shape: shape
    }));

    return {
      roundIndex,
      shapes: baseShapes,
      targetSlots,
      draggablePieces
    };
  });
}
