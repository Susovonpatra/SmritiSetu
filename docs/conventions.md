# SmritiSetu Coding Conventions & Style Guide

This document establishes development patterns and naming standards across the SmritiSetu repository.

---

## 1. Naming Conventions

### Frontend (React / JavaScript)
- **Component Files**: PascalCase (e.g. `PatientPortal.jsx`, `CaretakerTabsNav.jsx`).
- **Hook Files**: camelCase prefixed with `use` (e.g. `useCaretakerAnalytics.js`, `useSyncEngine.js`).
- **Utility / Service Files**: camelCase (e.g. `telemetryApi.js`, `soundEngine.js`).
- **Constants**: UPPER_SNAKE_CASE (e.g. `DEFAULT_PATIENT_PROFILE`, `REGION_PAIR_MAP`).
- **Handler Props**: Prefixed with `on` (e.g. `onSaveProfile`, `onNavigateToPatientPortal`).
- **Internal Handlers**: Prefixed with `handle` (e.g. `handleAuthSubmit`, `handleProfileChange`).

### Backend (Python / FastAPI)
- **Module Files**: snake_case (e.g. `esanjeevani.py`, `pdf_report.py`).
- **Classes**: PascalCase (e.g. `TelemetryLog`, `BackendSmokeTestCase`).
- **Functions & Variables**: snake_case (e.g. `get_cognitive_drift`, `patient_id`).
- **Constants**: UPPER_SNAKE_CASE (e.g. `API_V1_STR`, `PROJECT_NAME`).

---

## 2. Component Guidelines
- **Single Responsibility Principle**: Components must not exceed 250 lines. Large views must be decomposed into subcomponents and tab containers.
- **Memoization**: Context values and expensive selectors must be wrapped in `useMemo` and `useCallback` to avoid unnecessary tree re-renders.
- **Error Boundaries**: Every top-level route must be wrapped in an `<ErrorBoundary>` component with contextual recovery actions.

---

## 3. Error Handling Architecture

### Client-Side Error Flow
Use `AppError` from `@/services/api/client`:
```javascript
import { AppError } from '@/services/api/client';

if (!response.ok) {
  throw new AppError('Failed to fetch telemetry', 'TELEMETRY_ERROR', response.status, data);
}
```

### Server-Side Error Flow
Use standard `HTTPException` or custom subclasses of `AppException` from `app.core.exceptions`:
```python
from app.core.exceptions import AppException

raise AppException(
    detail="Patient record not found",
    status_code=404,
    error_code="PATIENT_NOT_FOUND"
)
```
Every unhandled exception is converted into a standard structured JSON response:
```json
{
  "error": {
    "code": "PATIENT_NOT_FOUND",
    "message": "Patient record not found",
    "status": 404
  }
}
```

---

## 4. Verification Workflow
Before committing any changes:
1. Run frontend tests: `npm run test:frontend`
2. Run backend tests: `npm run test:backend`
3. Verify client build: `npm run build:frontend`
4. Verify linter: `npm run lint:frontend`
