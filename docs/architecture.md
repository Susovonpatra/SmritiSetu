# SmritiSetu Architecture Documentation

SmritiSetu is an AI-based cognitive gaming, reminiscence, and memory assistance platform engineered specifically for elderly dementia patients in India's North Eastern Region (NER) and rural communities.

---

## 1. Monorepo Organization

```
SmritiSetu/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── api/              # Route controllers (telemetry, ivr, locale, consent, etc.)
│   │   ├── core/             # Configuration, exceptions, constants, security
│   │   ├── models/           # SQLAlchemy schemas & DB session
│   │   └── services/         # Business logic (eSanjeevani, TTS, PDF generation)
│   ├── tests/                # Unittest test suites (smoke & integration)
│   └── run.py                # Server runner
├── client/                   # React + Vite Client
│   ├── src/
│   │   ├── app/              # Application root (App.jsx, router, providers)
│   │   ├── components/       # Cross-cutting UI primitives (Navbar, ErrorBoundary, etc.)
│   │   ├── config/           # Environment configuration (env.js)
│   │   ├── features/         # Feature-oriented domain slices:
│   │   │   ├── asha/         # Door-to-door community triage
│   │   │   ├── auth/         # Dual Caretaker / Patient authentication
│   │   │   ├── caretaker/    # Clinical Hub, biometric drift, CMS
│   │   │   ├── consent/      # DPDP Act compliant consent capture
│   │   │   ├── games/        # PatternTrace™, Audio Replay, Reminiscence
│   │   │   ├── ivr/          # 2G Feature Phone simulator
│   │   │   ├── localization/ # Regional language & Indian dialect detection
│   │   │   ├── patient/      # Senior-friendly high-contrast portal
│   │   │   ├── pitch/        # Architecture & tier presentation
│   │   │   └── teleconsult/  # eSanjeevani teleconsultation bundle
│   │   ├── hooks/            # Global custom hooks (motion, sync)
│   │   ├── lib/              # Third-party wrappers (supabaseClient)
│   │   ├── locales/          # Dialect dictionaries (Odia, Assamese, Gujarati, etc.)
│   │   ├── services/         # Extracted API clients & Web Audio synthesis
│   │   └── styles/           # Global styles and tailwind directives
│   └── tests/                # Node test runner unit & smoke tests
└── docs/                     # Architectural, API, and convention docs
```

---

## 2. Frontend Architecture Principles

### Feature-Oriented Modularization
Files are grouped by clinical and operational domains under `client/src/features/*`. Each feature maintains its own sub-components, contexts, and hooks to prevent cross-module spaghetti.

### Path Aliasing
Configured via `vite.config.js` and `jsconfig.json`:
- `@/` maps directly to `<root>/client/src/`.
- Prevents brittle relative import cascades (`../../../../`).

### Decoupled Business Logic
- All `fetch()` calls and HTTP configurations are centralized in `src/services/api/`.
- UI components consume custom hooks (`useCaretakerAnalytics`, `useAshaTriage`) rather than managing asynchronous API states inline.

### Route-Level Code Splitting
High-footprint views (`CaretakerPortal`, `PatientPortal`, `IVRSimulator`, `AshaMode`) are loaded on-demand via `React.lazy()` and wrapped in `<Suspense>` with a centralized `<ErrorBoundary>`, shrinking the initial JS bundle from >1.26MB to under 500kB.

### Offline-First Dual Persistence
- Primary Client Storage: Dexie.js (IndexedDB) for full offline resiliency in zero-connectivity rural environments.
- Remote Cloud Storage: Supabase PostgreSQL for multi-device sync when connectivity is restored.
- Real-time Sync Engine: `useSyncEngine` monitors online/offline status and flushes queue backlogs automatically.

---

## 3. Backend Architecture Principles

### FastAPI + SQLAlchemy Layering
- **Endpoints (`app/api/`)**: Pure request handling, payload validation with Pydantic, and response mapping.
- **Exceptions (`app/core/exceptions.py`)**: Unified error handling translating standard `AppException` into RFC 7807 compliant JSON payloads.
- **Constants (`app/core/constants.py`)**: Static datasets and baseline demographics centralized away from controllers.

---

## 4. Accessibility (WCAG AAA Standards)
- **High-Contrast Palette**: 7:1+ contrast ratios designed specifically for aging eyes.
- **Large Touch Targets**: Minimum 48px × 48px hit areas for geriatric motor tremor accommodation.
- **Sensory Localization**: Dual visual + auditory feedback with native language TTS calibrated at 0.88x geriatric acoustic rate.
