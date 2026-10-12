# SmritiSetu API Documentation (v1)

Base URL: `http://localhost:8000/api/v1` (or production host)

All responses follow RFC 7807 structured JSON conventions.

---

## 1. System & Health

### `GET /health`
Returns system status and current UTC timestamp.
- **Response**:
  ```json
  {
    "status": "healthy",
    "timestamp": "2026-10-12T19:30:00Z"
  }
  ```

### `GET /`
Returns platform metadata and documentation endpoints.

---

## 2. Localization & Dialect Detection

### `GET /api/v1/locale/detect`
Automatically resolves client IP to regional dialect (Assamese, Odia, Gujarati, etc.).
- **Response**:
  ```json
  {
    "status": "success",
    "data": {
      "stateCode": "OD",
      "stateName": "Odisha",
      "nativeName": "ଓଡ଼ିଆ",
      "englishName": "Odia",
      "activeLocale": "or",
      "pair": ["or", "en"]
    }
  }
  ```

### `GET /api/v1/locale/supported`
Returns list of all supported Indian states, languages, and dialect pairs.

---

## 3. Cognitive Telemetry & Biomarkers

### `GET /api/v1/telemetry/drift/{patient_id}`
Calculates rolling 7-day reaction latency drift against baseline (800ms) with clinical alert flag if drift exceeds 35%.
- **Response**:
  ```json
  {
    "patient_id": 1,
    "baseline_latency_ms": 800.0,
    "current_mean_latency_ms": 1056.0,
    "cognitive_drift_percent": 32.0,
    "critical_alert": false,
    "clinical_status": "Stable Baseline"
  }
  ```

### `GET /api/v1/telemetry/analytics/{patient_id}?days=30`
Returns longitudinal time-series array of daily mean latency, accuracy percentage, and jitter pixels.

### `POST /api/v1/telemetry/log`
Records an interaction session log (latency, sequence matching, perseveration counts).

---

## 4. Consent & DPDP Compliance

### `POST /api/v1/consent/record`
Registers cryptographic caregiver consent with SHA-256 digital signature hash.

---

## 5. Community & ASHA Screening

### `GET /api/v1/asha/queue`
Retrieves ASHA door-to-door community triage screening queue.

### `POST /api/v1/asha/triage`
Submits a new geriatric screening evaluation (Red, Amber, Green triage flag).

---

## 6. eSanjeevani & Teleconsultation

### `POST /api/v1/esanjeevani/dispatch`
Dispatches a teleconsultation bundle to the nearest regional geriatric tele-clinic with clinical dossier linkage.

### `GET /api/v1/report/{patient_id}/pdf`
Generates and downloads ICMR/MoCA-aligned clinical PDF dossier for physicians.

---

## 7. IVR & Telephony

### `POST /api/v1/ivr/simulate`
Simulates DTMF keypress telemetry over 2G feature phones for rural patients without smartphones.
