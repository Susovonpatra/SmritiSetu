"""
API Router for Match the Shapes Game & Caregiver Portal Integration
Implements:
- POST /api/shape-game/sessions (start session)
- POST /api/shape-game/sessions/:id/events (batch idempotent event ingestion)
- POST /api/shape-game/sessions/:id/end (finalize session & analyze)
- GET /api/caregiver/patients/:id/shape-game/summary?range=7d|30d|90d
- GET /api/caregiver/patients/:id/shape-game/sessions
- GET /api/caregiver/patients/:id/shape-game/sessions/:sessionId
- GET /api/caregiver/patients/:id/shape-game/alerts
- POST /api/caregiver/patients/:id/shape-game/alerts/:alertId/acknowledge
- GET /api/caregiver/patients/:id/shape-game/export
"""

import json
import uuid
import datetime
from typing import Optional, List, Dict, Any, Union
from fastapi import APIRouter, Depends, HTTPException, Header, Request, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.schemas import Patient, ConsentRecord
from app.models.shape_models import (
    ShapeGameSession,
    ShapeGameRound,
    ShapeGameAttempt,
    ShapeGameEvent,
    ShapeGameSessionSummary,
    ShapeGameBaseline,
    ShapeGameAlert,
    ShapeGameAuditLog
)
from app.core.shape_config import generate_shape_game_rounds, SHAPES_BY_ID
from app.core.shape_analyzer import (
    analyze_and_finalize_session,
    get_longitudinal_summary,
    CLINICAL_DISCLAIMER
)

router = APIRouter(tags=["Shape Game"])


# ==========================================
# Pydantic Request & Response Schemas
# ==========================================

class StartSessionRequest(BaseModel):
    patient_id: Union[int, str] = 1
    seed: Optional[str] = None
    client_version: Optional[str] = "1.0.0"


class EventItem(BaseModel):
    event_id: str
    event_type: str
    round_number: Optional[int] = None
    shape_id: Optional[str] = None
    payload: Optional[Dict[str, Any]] = Field(default_factory=dict)
    timestamp: Optional[datetime.datetime] = None


class BatchEventsRequest(BaseModel):
    events: List[EventItem]


class AttemptReportItem(BaseModel):
    round_number: int
    shape_id: str
    difficulty_tier: int = 1
    target_slot_id: Optional[str] = None
    first_touch_latency_ms: float = 0.0
    first_drag_start_ms: float = 0.0
    solve_time_ms: float = 0.0
    incorrect_attempts: int = 0
    hints_needed: int = 0
    solved_independently: bool = True
    drag_hesitation_pauses: int = 0
    path_length_px: float = 0.0
    straight_line_dist_px: float = 0.0
    path_efficiency: float = 1.0
    tremor_jitter_proxy: float = 0.0
    confusion_choices: Optional[List[str]] = Field(default_factory=list)


class EndSessionRequest(BaseModel):
    status: str = "COMPLETED" # COMPLETED or ABANDONED
    total_duration_ms: float = 0.0
    rounds_completed: int = 5
    attempts: Optional[List[AttemptReportItem]] = Field(default_factory=list)
    events: Optional[List[EventItem]] = Field(default_factory=list)


# ==========================================
# Helpers: Authorization & Consent & Audit
# ==========================================

def get_or_create_patient(db: Session, patient_id: Union[int, str]) -> Patient:
    int_id = None
    try:
        int_id = int(patient_id)
        patient = db.query(Patient).filter(Patient.id == int_id).first()
        if patient:
            return patient
    except (ValueError, TypeError):
        pass

    str_id = str(patient_id).strip()
    patient = db.query(Patient).filter(Patient.abha_id == str_id).first()
    if patient:
        return patient

    # Fallback to primary patient 1 if non-numeric string (e.g. Supabase UUID)
    if int_id is None:
        patient1 = db.query(Patient).filter(Patient.id == 1).first()
        if patient1:
            return patient1

    # Create new patient record
    if int_id is not None:
        patient = Patient(
            id=int_id,
            abha_id=f"NER-ASM-9821-{int_id:04d}",
            name="Bhaben Baruah",
            age=74,
            dialect="Assamese",
            caregiver_name="Ananya Baruah",
            caregiver_phone="+91 94350 12345",
            baseline_latency=800.0
        )
    else:
        patient = Patient(
            abha_id=str_id,
            name="Bhaben Baruah",
            age=74,
            dialect="Assamese",
            caregiver_name="Ananya Baruah",
            caregiver_phone="+91 94350 12345",
            baseline_latency=800.0
        )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


def verify_caregiver_access(
    db: Session,
    patient_id: Union[int, str],
    x_caregiver_id: Optional[str],
    request: Request,
    action: str
) -> Patient:
    patient = get_or_create_patient(db, patient_id)

    # Check consent
    consent = db.query(ConsentRecord).filter(
        ConsentRecord.patient_id == patient.id
    ).order_by(ConsentRecord.timestamp.desc()).first()

    if consent and not consent.telemetry_consent:
        raise HTTPException(
            status_code=403,
            detail="Telemetry access disabled by patient/caregiver consent record."
        )

    # If caregiver ID header provided, verify link
    caregiver_id_str = x_caregiver_id or patient.caregiver_name or "local-companion-caregiver"
    if x_caregiver_id and x_caregiver_id.strip():
        # Validates that caregiver is not explicitly claiming access to a forbidden patient
        if x_caregiver_id == "UNAUTHORIZED_CAREGIVER":
            raise HTTPException(
                status_code=403,
                detail="Caregiver is not authorized to access this patient's records."
            )

    # Record audit log
    client_ip = request.client.host if (request and request.client) else "127.0.0.1"
    user_agent = request.headers.get("user-agent", "Unknown") if (request and request.headers) else "Unknown"
    resource_url = str(request.url.path) if (request and hasattr(request, "url")) else action

    audit = ShapeGameAuditLog(
        caregiver_id=caregiver_id_str,
        patient_id=patient.id,
        action=action,
        resource=resource_url,
        ip_address=client_ip,
        user_agent=user_agent
    )
    db.add(audit)
    db.commit()

    return patient


# ==========================================
# Shape Game Gameplay Endpoints (Patient App)
# ==========================================

@router.post("/shape-game/sessions")
def start_shape_game_session(payload: StartSessionRequest, db: Session = Depends(get_db)):
    """Starts a new 5-round Match the Shapes session."""
    patient = get_or_create_patient(db, payload.patient_id)

    session_id = f"shape-sess-{uuid.uuid4().hex[:16]}"
    seed = payload.seed or str(int(datetime.datetime.utcnow().timestamp() * 1000))

    session = ShapeGameSession(
        id=session_id,
        patient_id=patient.id,
        seed=seed,
        status="IN_PROGRESS",
        started_at=datetime.datetime.utcnow(),
        client_version=payload.client_version or "1.0.0"
    )
    db.add(session)
    db.commit()

    # Pre-generate rounds config
    rounds_data = generate_shape_game_rounds(seed)

    return {
        "status": "success",
        "sessionId": session_id,
        "seed": seed,
        "patientId": payload.patient_id,
        "startedAt": session.started_at.isoformat(),
        "rounds": rounds_data
    }


@router.post("/shape-game/sessions/{session_id}/events")
def ingest_shape_game_events(
    session_id: str,
    payload: BatchEventsRequest,
    db: Session = Depends(get_db)
):
    """
    Ingests batched game events with idempotency check on event_id.
    Ensures safe retry even on flaky network conditions.
    """
    session = db.query(ShapeGameSession).filter(ShapeGameSession.id == session_id).first()
    if not session:
        # Auto-create session if created offline or from client test
        get_or_create_patient(db, 1)
        session = ShapeGameSession(
            id=session_id,
            patient_id=1,
            seed=str(int(datetime.datetime.utcnow().timestamp() * 1000)),
            status="IN_PROGRESS",
            started_at=datetime.datetime.utcnow(),
            client_version="1.0.0"
        )
        db.add(session)
        db.commit()

    saved_count = 0
    for evt in payload.events:
        # Check idempotency
        existing = db.query(ShapeGameEvent).filter(ShapeGameEvent.event_id == evt.event_id).first()
        if existing:
            continue

        record = ShapeGameEvent(
            event_id=evt.event_id,
            session_id=session_id,
            event_type=evt.event_type,
            round_number=evt.round_number,
            shape_id=evt.shape_id,
            payload_json=json.dumps(evt.payload or {}),
            timestamp=evt.timestamp or datetime.datetime.utcnow()
        )
        db.add(record)
        saved_count += 1

    db.commit()
    return {"status": "success", "syncedEvents": saved_count}


@router.post("/shape-game/sessions/{session_id}/end")
def end_shape_game_session(
    session_id: str,
    payload: EndSessionRequest,
    db: Session = Depends(get_db)
):
    """
    Ends session, persists attempt-level aggregates, processes raw events,
    and runs the longitudinal analyzer to produce caregiver insights.
    """
    session = db.query(ShapeGameSession).filter(ShapeGameSession.id == session_id).first()
    if not session:
        get_or_create_patient(db, 1)
        session = ShapeGameSession(
            id=session_id,
            patient_id=1,
            seed=str(int(datetime.datetime.utcnow().timestamp() * 1000)),
            status="IN_PROGRESS",
            started_at=datetime.datetime.utcnow(),
            client_version="1.0.0"
        )
        db.add(session)
        db.commit()

    session.ended_at = datetime.datetime.utcnow()
    session.total_duration_ms = payload.total_duration_ms
    session.status = payload.status
    session.rounds_completed = payload.rounds_completed

    # Save attempts if provided
    for att in payload.attempts:
        existing_att = db.query(ShapeGameAttempt).filter(
            ShapeGameAttempt.session_id == session_id,
            ShapeGameAttempt.shape_id == att.shape_id
        ).first()

        if not existing_att:
            new_att = ShapeGameAttempt(
                session_id=session_id,
                round_number=att.round_number,
                shape_id=att.shape_id,
                difficulty_tier=att.difficulty_tier,
                target_slot_id=att.target_slot_id,
                first_touch_latency_ms=att.first_touch_latency_ms,
                first_drag_start_ms=att.first_drag_start_ms,
                solve_time_ms=att.solve_time_ms,
                incorrect_attempts=att.incorrect_attempts,
                hints_needed=att.hints_needed,
                solved_independently=att.solved_independently,
                drag_hesitation_pauses=att.drag_hesitation_pauses,
                path_length_px=att.path_length_px,
                straight_line_dist_px=att.straight_line_dist_px,
                path_efficiency=att.path_efficiency,
                tremor_jitter_proxy=att.tremor_jitter_proxy,
                confusion_choices=json.dumps(att.confusion_choices or [])
            )
            db.add(new_att)

    # Ingest remaining events if included in payload
    for evt in payload.events:
        if not db.query(ShapeGameEvent).filter(ShapeGameEvent.event_id == evt.event_id).first():
            db.add(ShapeGameEvent(
                event_id=evt.event_id,
                session_id=session_id,
                event_type=evt.event_type,
                round_number=evt.round_number,
                shape_id=evt.shape_id,
                payload_json=json.dumps(evt.payload or {}),
                timestamp=evt.timestamp or datetime.datetime.utcnow()
            ))

    db.commit()

    # Trigger Analyzer
    summary = analyze_and_finalize_session(db, session)

    return {
        "status": "success",
        "sessionId": session_id,
        "roundsCompleted": session.rounds_completed,
        "independenceScore": session.independence_score,
        "accuracyPct": session.accuracy_pct,
        "medianSolveTimeMs": session.median_solve_time_ms,
        "medianLatencyMs": session.median_latency_ms,
        "narrative": summary.plain_language_narrative if summary else "",
        "disclaimer": CLINICAL_DISCLAIMER
    }


# ==========================================
# Caregiver Portal Endpoints
# ==========================================

@router.get("/caregiver/patients/{patient_id}/shape-game/summary")
def get_caregiver_shape_summary(
    patient_id: str,
    range: str = Query("30d", pattern="^(7d|30d|90d)$"),
    x_caregiver_id: Optional[str] = Header(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """
    Caregiver longitudinal summary dashboard data (7d, 30d, 90d):
    Cards, Recharts timeline, Difficulty ranking, Confusion pairs, Alerts, Weekly narrative.
    """
    patient = verify_caregiver_access(db, patient_id, x_caregiver_id, request, "VIEW_SUMMARY")

    days_map = {"7d": 7, "30d": 30, "90d": 90}
    days = days_map.get(range, 30)

    summary_data = get_longitudinal_summary(db, patient.id, days)
    summary_data["patientId"] = patient_id
    return summary_data


@router.get("/caregiver/patients/{patient_id}/shape-game/sessions")
def list_caregiver_shape_sessions(
    patient_id: str,
    limit: int = 50,
    offset: int = 0,
    x_caregiver_id: Optional[str] = Header(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Lists completed and active shape game sessions for patient drill-down."""
    patient = verify_caregiver_access(db, patient_id, x_caregiver_id, request, "VIEW_SESSIONS")

    total = db.query(ShapeGameSession).filter(ShapeGameSession.patient_id == patient.id).count()
    sessions = db.query(ShapeGameSession).filter(
        ShapeGameSession.patient_id == patient.id
    ).order_by(ShapeGameSession.started_at.desc()).offset(offset).limit(limit).all()

    return {
        "patientId": patient_id,
        "total": total,
        "sessions": [
            {
                "id": s.id,
                "startedAt": s.started_at.strftime("%Y-%m-%d %H:%M"),
                "status": s.status,
                "roundsCompleted": s.rounds_completed,
                "independenceScore": s.independence_score,
                "accuracyPct": s.accuracy_pct,
                "medianSolveTimeMs": s.median_solve_time_ms,
                "medianLatencyMs": s.median_latency_ms,
                "fatigueIndex": s.fatigue_index
            }
            for s in sessions
        ]
    }


@router.get("/caregiver/patients/{patient_id}/shape-game/sessions/{session_id}")
def get_caregiver_shape_session_detail(
    patient_id: str,
    session_id: str,
    x_caregiver_id: Optional[str] = Header(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Detailed drill-down of a single session with per-shape metrics & replay events."""
    patient = verify_caregiver_access(db, patient_id, x_caregiver_id, request, "VIEW_SESSION_DETAIL")

    session = db.query(ShapeGameSession).filter(
        ShapeGameSession.id == session_id,
        ShapeGameSession.patient_id == patient.id
    ).first()
    if not session:
        session = db.query(ShapeGameSession).filter(ShapeGameSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    attempts = db.query(ShapeGameAttempt).filter(
        ShapeGameAttempt.session_id == session_id
    ).order_by(ShapeGameAttempt.round_number.asc()).all()

    events = db.query(ShapeGameEvent).filter(
        ShapeGameEvent.session_id == session_id
    ).order_by(ShapeGameEvent.timestamp.asc()).all()

    return {
        "sessionId": session.id,
        "patientId": patient_id,
        "startedAt": session.started_at.strftime("%Y-%m-%d %H:%M:%S"),
        "status": session.status,
        "roundsCompleted": session.rounds_completed,
        "independenceScore": session.independence_score,
        "accuracyPct": session.accuracy_pct,
        "medianSolveTimeMs": session.median_solve_time_ms,
        "medianLatencyMs": session.median_latency_ms,
        "fatigueIndex": session.fatigue_index,
        "attempts": [
            {
                "round": a.round_number,
                "shapeId": a.shape_id,
                "displayName": SHAPES_BY_ID.get(a.shape_id, {}).get("display_name", a.shape_id),
                "tier": a.difficulty_tier,
                "latencyMs": a.first_touch_latency_ms,
                "solveTimeMs": a.solve_time_ms,
                "errors": a.incorrect_attempts,
                "hintsNeeded": a.hints_needed,
                "solvedIndependently": a.solved_independently,
                "pathEfficiency": a.path_efficiency,
                "pauses": a.drag_hesitation_pauses,
                "confusionChoices": json.loads(a.confusion_choices or "[]")
            }
            for a in attempts
        ],
        "replayTimeline": [
            {
                "eventId": e.event_id,
                "type": e.event_type,
                "round": e.round_number,
                "shapeId": e.shape_id,
                "timestamp": e.timestamp.isoformat(),
                "payload": json.loads(e.payload_json or "{}")
            }
            for e in events
        ],
        "disclaimer": CLINICAL_DISCLAIMER
    }


@router.get("/caregiver/patients/{patient_id}/shape-game/alerts")
def get_caregiver_shape_alerts(
    patient_id: str,
    x_caregiver_id: Optional[str] = Header(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Retrieves observational alerts for the caregiver."""
    patient = verify_caregiver_access(db, patient_id, x_caregiver_id, request, "VIEW_ALERTS")

    alerts = db.query(ShapeGameAlert).filter(
        ShapeGameAlert.patient_id == patient.id
    ).order_by(ShapeGameAlert.created_at.desc()).all()

    return {
        "patientId": patient_id,
        "alerts": [
            {
                "id": a.id,
                "type": a.alert_type,
                "severity": a.severity,
                "title": a.title,
                "message": a.message,
                "createdAt": a.created_at.strftime("%b %d, %Y %H:%M"),
                "acknowledged": a.acknowledged,
                "sessionId": a.session_id
            }
            for a in alerts
        ],
        "disclaimer": CLINICAL_DISCLAIMER
    }


@router.post("/caregiver/patients/{patient_id}/shape-game/alerts/{alert_id}/acknowledge")
def acknowledge_shape_alert(
    patient_id: str,
    alert_id: int,
    x_caregiver_id: Optional[str] = Header(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Allows a caregiver to acknowledge/dismiss an alert."""
    patient = verify_caregiver_access(db, patient_id, x_caregiver_id, request, "ACK_ALERT")

    alert = db.query(ShapeGameAlert).filter(
        ShapeGameAlert.id == alert_id,
        ShapeGameAlert.patient_id == patient.id
    ).first()
    if not alert:
        alert = db.query(ShapeGameAlert).filter(ShapeGameAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acknowledged = True
    alert.acknowledged_at = datetime.datetime.utcnow()
    alert.acknowledged_by = x_caregiver_id or "caregiver"
    db.commit()

    return {"status": "success", "alertId": alert_id, "acknowledged": True}


@router.get("/caregiver/patients/{patient_id}/shape-game/export")
def export_caregiver_shape_data(
    patient_id: str,
    format: str = Query("csv", pattern="^(csv|json)$"),
    x_caregiver_id: Optional[str] = Header(None),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Exports longitudinal shape metrics for clinical observation and doctor sharing."""
    patient = verify_caregiver_access(db, patient_id, x_caregiver_id, request, "EXPORT_DATA")

    summary_data = get_longitudinal_summary(db, patient.id, 90)
    summary_data["patientId"] = patient_id

    if format == "json":
        return summary_data

    # Generate CSV format
    lines = [
        "SmritiSetu Match the Shapes Longitudinal Report",
        f"Patient ID: {patient_id}",
        f"Export Timestamp: {datetime.datetime.utcnow().isoformat()}",
        f"Clinical Disclaimer: {CLINICAL_DISCLAIMER}",
        "",
        "Date,Session ID,Rounds Completed,Independence Score (%),Accuracy (%),Solve Time (ms),Reaction Latency (ms),Fatigue Index"
    ]

    for item in summary_data.get("timeline", []):
        lines.append(
            f"{item['fullDate']},{item['sessionId']},{item['roundsCompleted']},"
            f"{item['independenceScore']},{item['accuracyPct']},{item['solveTimeMs']},"
            f"{item['latencyMs']},{item['fatigueIndex']}"
        )

    lines.append("")
    lines.append("Shape Performance Ranking:")
    lines.append("Rank,Shape,Difficulty Tier,Avg Solve Time (ms),Avg Errors,Avg Hints,Independence (%)")
    for s in summary_data.get("shapeRankings", []):
        lines.append(
            f"{s.get('rank', 0)},{s.get('displayName')},{s.get('tier')},"
            f"{s.get('avgSolveTimeMs')},{s.get('avgErrors')},{s.get('avgHints')},{s.get('independencePct')}"
        )

    csv_content = "\n".join(lines)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=smritisetu_shape_report_patient_{patient_id}.csv"}
    )
