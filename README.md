# SmritiSetu (ସ୍ମୃତିସେତୁ / স্মৃতিসেতু)

> **AI-Based Cognitive Gaming, Reminiscence, and Memory Assistance Platform for Elderly Dementia Patients in the North Eastern Region (NER) and Rural Communities.**

---

## 🌟 Key Features

- **Dual-Portal System**:
  - **Patient Companion Portal**: Minimalist, high-contrast, WCAG AAA-compliant interface with voice-guided prompts calibrated at a soothing 0.88x acoustic rate.
  - **Caretaker Clinical Hub**: Longitudinal biomarker analytics, 7-day cognitive drift monitoring (>35% latency alerts), and custom biographical CMS questions.
- **Offline-First Resilience**: Powered by Dexie.js (IndexedDB) with automated background sync to Supabase PostgreSQL when connectivity is available.
- **2G Feature Phone Telephony (IVR)**: Accessibility for elders without smartphones via simulated DTMF voice prompts and automated cognitive tracking.
- **eSanjeevani Teleconsultation**: Instant dispatch of clinical dossiers and MoCA/ICMR-NARI aligned PDF reports directly to regional medical colleges.
- **Localized Dialects**: Automatic IP-based region detection supporting Odia, Assamese, Gujarati, Hindi, and English.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18+)
- **Python** (v3.10+)

### Setup & Run
From the root repository directory:

```bash
# Install dependencies
npm install --prefix client

# Run both frontend and backend concurrently
npm run dev

# Or run services individually
npm run dev:frontend    # Starts Vite dev server on http://localhost:5173
npm run dev:backend     # Starts FastAPI dev server on http://localhost:8000
```

---

## 🧪 Verification & Testing

```bash
# Run all smoke tests (Frontend + Backend)
npm run test

# Run frontend tests (Node test runner)
npm run test:frontend

# Run backend smoke tests (unittest)
npm run test:backend

# Production build test
npm run build:frontend
```

---

## 📚 Documentation

Detailed documentation is available in the [`docs/`](./docs/) directory:
- [Architecture Guide](./docs/architecture.md)
- [Coding Conventions & Style Guide](./docs/conventions.md)
- [API Reference (v1)](./docs/api.md)
