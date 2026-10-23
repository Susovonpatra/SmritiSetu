# Match the Shapes (SmritiSetu Cognitive Companion)

A dignified, calm cognitive activity designed for dementia and Alzheimer's patients that doubles as a passive progress-monitoring and motor-stability tracking tool for caregivers.

---

## 1. Purpose & Design Philosophy
- **Patient Experience**: Dignified, calm, and pressure-free. The patient **never** sees scores, timers, or error messages. Gentle affirmative feedback ("Well done", "Lovely", "Splendid") rotates on correct placement; wrong drops softly slide back with a gentle neutral tone.
- **Caregiver & Clinician Portal**: Rich longitudinal data capturing reaction latency, solve time, independence score (% shapes solved without hints), spatial accuracy, fatigue patterns, tremor/jitter proxies, difficulty rankings, and confusion pairs.
- **Clinical Notice**: Monitoring aid only, **not** a diagnostic device. Phrasing strictly avoids diagnostic assertions.

---

## 2. How to Run

### Backend (FastAPI, Python 3.13)
```bash
# Navigate to backend directory
cd backend

# Run development server
npm run dev
# Or directly: python run.py (starts on http://127.0.0.1:8000)

# Run backend unit and integration test suite
npm run test
# Or directly: python -m unittest discover -s tests -p "test_*.py"
```

### Frontend (React 19, Vite, Tailwind CSS)
```bash
# Navigate to client directory
cd client

# Run development dev server
npm run dev
# Starts on http://127.0.0.1:5173

# Run frontend unit and E2E simulation tests
npm test

# Run linter
npm run lint
```

---

## 3. Shape Set & Similarity Groups

### 20 Total Shapes
| Shape ID | Display Name | Difficulty Tier | Similarity Group |
|---|---|---|---|
| `triangle` | Triangle | Tier 1 | `triangles` |
| `right_triangle` | Right Triangle | Tier 2 | `triangles` |
| `square` | Square | Tier 1 | `quad_orthogonal` |
| `rectangle` | Rectangle | Tier 2 | `quad_orthogonal` |
| `rhombus` | Rhombus | Tier 2 | `quad_orthogonal` |
| `parallelogram` | Parallelogram | Tier 3 | `quad_slanted` |
| `trapezium` | Trapezium | Tier 3 | `quad_slanted` |
| `kite` | Kite | Tier 3 | `quad_slanted` |
| `pentagon` | Pentagon | Tier 3 | `polygons` |
| `hexagon` | Hexagon | Tier 3 | `polygons` |
| `heptagon` | Heptagon | Tier 3 | `polygons` |
| `octagon` | Octagon | Tier 3 | `polygons` |
| `circle` | Circle | Tier 1 | `curved_closed` |
| `ring` | Ring (thick blue donut) | Tier 2 | `curved_closed` |
| `ellipse` | Ellipse | Tier 2 | `curved_closed` |
| `semicircle` | Semicircle | Tier 2 | `curved_arcs` |
| `crescent` | Crescent | Tier 3 | `curved_arcs` |
| `star` | Star | Tier 1 | `special_symbols` |
| `cross` | Cross | Tier 2 | `special_symbols` |
| `heart` | Heart | Tier 1 | `special_symbols` |

### Similarity Group Rule & Mathematical Guarantee
- **Rule**: NO round may contain two shapes from the same similarity group. This prevents confusing lookalikes within any given round.
- **Mathematical Invariant**: To distribute 20 unique shapes across 5 rounds (4 shapes per round) with zero within-round collisions, no group can exceed 5 shapes. The 6 quadrilaterals are cleanly partitioned into `quad_orthogonal` (Square, Rectangle, Rhombus) and `quad_slanted` (Parallelogram, Trapezium, Kite). All groups have size $\le 4 \le 5$, strictly guaranteeing conflict-free distribution for every seeded session.

---

## 4. Game Structure & Adaptive Hint System

### Round Flow
1. **5 Rounds**, 4 shapes per round = 20 unique shapes per session. Each shape appears exactly once.
2. Draggable shapes shelf at bottom; outlined target holders at top (each holder minimum 96px, generous snap tolerance $\sim 1.5\times$ slot size).
3. Pointer Events support touch, mouse, and stylus with multi-touch guard (only one draggable at a time) and `touch-action: none` to block accidental pinch/scroll.
4. **Gentle Round Indicator**: 5 dots at top (no numbers, no countdown).

### Adaptive Hint Escalation (Every 4s of No Progress)
"No progress" = no correct placement and no active dragging for 4 seconds. Reset whenever the patient starts dragging or places a shape.
- **Hint 1 (at 4s)**: Next unplaced shape pulses on shelf; matching target holder glows with soft ring.
- **Hint 2 (at 8s)**: Translucent "ghost" copy slowly glides from the shape's shelf location to its holder.
- **Hint 3 (at 12s+)**: Ghost glide continues and the shape's name is spoken aloud via Text-to-Speech (in patient's chosen language: English, Odia, Gujarati, Assamese).
- **Priority**: Hints prioritize the shape the patient last touched.
- **Patient Autonomy**: The system **never** auto-places a shape; the patient always completes the final drag.

---

## 5. Analytics & Metric Definitions

1. **Reaction Latency**: Round display timestamp $\rightarrow$ first touch timestamp ($ms$).
2. **Solve Time**: Round display $\rightarrow$ correct placement ($ms$).
3. **Independence Score**: Percentage of shapes placed without hint assistance ($\text{hints} = 0$).
4. **Accuracy Score**: Percentage of shapes placed without any incorrect drops.
5. **Path Efficiency**: $\frac{\text{Straight-line distance}}{\text{Actual cumulative path length}}$ ($1.0$ is direct, $<0.7$ indicates hesitation or wandering).
6. **Tremor / Jitter Proxy**: Second-derivative coordinate variance during drag move events sampled at 20Hz.
7. **Fatigue Index**: $\frac{\text{Mean solve time in Rounds 4-5}}{\text{Mean solve time in Rounds 1-2}}$. ($>1.35$ highlights late-session cognitive/motor fatigue).
8. **Confusion Pairs**: Pairs of $(\text{Intended Shape} \rightarrow \text{Dropped Target Slot})$ identifying visual lookalike confusions.

---

## 6. Personal Baseline & Alert Thresholds

Comparisons are strictly evaluated against the **patient's own rolling baseline** (rolling median of initial 5 sessions, then rolling 14-day window), never arbitrary population norms.

- **Median Absolute Deviation (MAD)**: $\text{MAD} = \text{median}(|x_i - \text{median}(X)|)$.
- **Solve Time Alert (Attention)**: Triggered when solve time exceeds baseline by $\ge 1.5 \times \text{MAD}$ (or $>25\%$) for 3 consecutive sessions.
- **Latency Spike Alert (Attention)**: Reaction latency $>50\%$ above personal baseline and $>1500\text{ms}$.
- **Notable Improvement (Info)**: Independence score improves by $>20\%$ over baseline.
- **Inactivity Gap (Info)**: $>5$ days elapsed between sessions.
- **Caregiver Action**: Caregiver can acknowledge and dismiss alerts in the portal.

---

## 7. Data Models & API Endpoints

### Database Tables (SQLAlchemy & Supabase PostgreSQL)
- `shape_game_sessions`: Session metadata, status, duration, summary scores.
- `shape_game_rounds`: 5 rounds per session, duration, error and hint tallies.
- `shape_game_attempts`: Attempt record per shape with latency, path efficiency, jitter, hints, and confusion choices.
- `shape_game_events`: Raw timestamped events with client idempotency key (`event_id`).
- `shape_game_session_summaries`: Aggregate summary and plain-language narrative.
- `shape_game_baselines`: Patient personal baseline, rolling window type, MAD statistics.
- `shape_game_alerts`: Observational alerts, severity (`info` / `attention`), acknowledgment state.
- `shape_game_audit_logs`: HIPAA/ABHA compliance audit log of all caregiver read/export access.

### API Endpoints
- `POST /api/shape-game/sessions`: Start new session with seeded round configuration.
- `POST /api/shape-game/sessions/{id}/events`: Idempotent batched event ingestion.
- `POST /api/shape-game/sessions/{id}/end`: End session, process attempts, trigger analyzer.
- `GET /api/caregiver/patients/{id}/shape-game/summary?range=7d|30d|90d`: Caregiver dashboard summary with Recharts timeline, rankings, confusion pairs.
- `GET /api/caregiver/patients/{id}/shape-game/sessions`: List sessions for patient drill-down.
- `GET /api/caregiver/patients/{id}/shape-game/sessions/{sessionId}`: Single-session drill-down with attempt metrics and event replay timeline.
- `GET /api/caregiver/patients/{id}/shape-game/alerts`: Active alerts.
- `POST /api/caregiver/patients/{id}/shape-game/alerts/{alertId}/acknowledge`: Dismiss alert.
- `GET /api/caregiver/patients/{id}/shape-game/export?format=csv|json`: Export clinical progress report.

---

## 8. Feature Flag & Rollback

In `client/src/config/features.js`:
```javascript
export const FEATURE_FLAGS = {
  // Set to false to immediately restore the legacy Picture Game (VisualSemanticGame)
  SHAPE_GAME_ENABLED: true,
  SHAPE_TTS_ENABLED: true,
  OFFLINE_TELEMETRY_ENABLED: true
};
```
Setting `SHAPE_GAME_ENABLED: false` instantly reverts navigation and game rendering in `PatientPortal.jsx` without requiring code changes or database migrations.

---

## 9. How to Add New Shapes

To introduce a new shape (e.g. `nonagon` or `diamond`):
1. **Frontend**: Add shape config in `client/src/features/games/shapes/shapeConfig.js`:
   ```javascript
   {
     id: 'nonagon',
     displayName: 'Nonagon',
     difficultyTier: 3,
     similarityGroup: SIMILARITY_GROUPS.POLYGONS,
     fillColor: '#0284c7',
     strokeColor: '#0369a1',
     type: 'polygon',
     points: '...',
     localizedNames: { en: 'Nonagon', or: 'ନବଭୁଜ', gu: 'નવકોણ', as: 'নৱভুজ' }
   }
   ```
2. **Backend**: Add the matching entry in `backend/app/core/shape_config.py`.
3. **Similarity Group Consideration**: Ensure no similarity group exceeds 5 shapes to maintain the collision-free 5-round distribution invariant. If adding multiple shapes to an existing group, partition the group into subgroups (e.g. `polygons_5_to_6` and `polygons_7_plus`).
