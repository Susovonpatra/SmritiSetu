from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.models.database import engine, Base, SessionLocal
from app.models.schemas import Patient, TelemetryLog, AshaQueue, ConsentRecord
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
from app.api import consent, telemetry, memory, asha, tts, ivr, esanjeevani, locale, shape_game
from app.core.shape_analyzer import analyze_and_finalize_session, update_patient_baseline
import datetime
import json

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in North Eastern Region (NER)."
)

# Enable CORS for localhost:5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.exceptions import RequestValidationError
from app.core.exceptions import (
    AppException,
    app_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)

app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Seed initial patient & baseline telemetry if empty
def seed_database():
    db = SessionLocal()
    try:
        count = db.query(Patient).count()
        if count == 0:
            patient = Patient(
                id=1,
                abha_id="NER-ASM-9821-4412",
                name="Bhaben Baruah",
                age=74,
                dialect="Assamese",
                caregiver_name="Ananya Baruah",
                caregiver_phone="+91 94350 12345",
                baseline_latency=800.0,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=30)
            )
            db.add(patient)
            db.commit()

            # Seed consent
            consent_rec = ConsentRecord(
                patient_id=1,
                caregiver_name="Ananya Baruah",
                telemetry_consent=True,
                voice_storage_consent=True,
                abha_linkage_consent=True,
                signature_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=30)
            )
            db.add(consent_rec)

            # Seed historical telemetry logs for longitudinal analytics
            now = datetime.datetime.utcnow()
            for day_offset in range(30, 0, -1):
                t_date = now - datetime.timedelta(days=day_offset)
                # simulate gradual drift over last 10 days
                drift_mult = 1.0 if day_offset > 10 else 1.32
                t_log = TelemetryLog(
                    patient_id=1,
                    game_type="visual_matching" if day_offset % 2 == 0 else "routine_sequencer",
                    latency_ms=round(800.0 * drift_mult + (day_offset % 5) * 15, 1),
                    jitter_px=round(12.0 + (30 - day_offset) * 0.4, 1),
                    accuracy_score=round(max(0.7, 0.95 - (30 - day_offset) * 0.008), 2),
                    source="PWA",
                    timestamp=t_date
                )
                db.add(t_log)

            # Seed ASHA triage record
            asha_rec = AshaQueue(
                patient_id=1,
                worker_id="ASHA-NAGAON-01",
                patient_name="Bhaben Baruah",
                village="Raha, Nagaon",
                triage_status="Amber",
                notes="Patient demonstrates early temporal disorientation in morning routines. Reaction times drifting upwards.",
                synced=True
            )
            db.add(asha_rec)
            db.commit()

        # Seed initial Match the Shapes sessions for longitudinal caregiver analytics if empty
        shape_count = db.query(ShapeGameSession).filter(ShapeGameSession.patient_id == 1).count()
        if shape_count == 0:
            now = datetime.datetime.utcnow()
            day_offsets = [14, 11, 9, 7, 5, 3, 1]
            sample_shapes = [
                ("circle", 1), ("square", 1), ("triangle", 1), ("star", 1),
                ("rectangle", 2), ("ring", 2), ("cross", 2), ("rhombus", 2),
                ("pentagon", 3), ("hexagon", 3), ("heptagon", 3), ("octagon", 3),
                ("trapezium", 3), ("parallelogram", 3), ("heart", 1), ("semicircle", 2),
                ("crescent", 3), ("ellipse", 2), ("kite", 3), ("right_triangle", 2)
            ]

            for s_idx, day_offset in enumerate(day_offsets):
                s_date = now - datetime.timedelta(days=day_offset, hours=2 + s_idx)
                sess_id = f"seed-shape-session-{s_idx + 1}"
                # Slight drift in recent sessions
                drift_factor = 1.0 if day_offset > 5 else 1.22
                base_solve = round(3200.0 * drift_factor + (s_idx % 3) * 120, 1)
                base_lat = round(880.0 * drift_factor + (s_idx % 4) * 40, 1)
                ind_score = round(max(70.0, 95.0 - (14 - day_offset) * 1.5), 1)

                session_rec = ShapeGameSession(
                    id=sess_id,
                    patient_id=1,
                    seed=f"seed-{s_idx + 100}",
                    status="COMPLETED",
                    started_at=s_date,
                    ended_at=s_date + datetime.timedelta(minutes=4),
                    total_duration_ms=240000.0,
                    rounds_completed=5,
                    independence_score=ind_score,
                    accuracy_pct=round(max(75.0, 95.0 - (14 - day_offset) * 1.1), 1),
                    median_latency_ms=base_lat,
                    mean_latency_ms=base_lat + 45.0,
                    median_solve_time_ms=base_solve,
                    fatigue_index=round(1.05 + (14 - day_offset) * 0.02, 2),
                    engagement_score=100.0,
                    client_version="1.0.0"
                )
                db.add(session_rec)
                db.commit()

                # Add attempts for all 20 shapes
                for r_num in range(1, 6):
                    round_shapes = sample_shapes[(r_num - 1) * 4 : r_num * 4]
                    for shape_id, tier in round_shapes:
                        is_indep = (tier == 1) or (tier == 2 and s_idx % 2 == 0)
                        hints = 0 if is_indep else (1 if tier == 2 else 2)
                        solve_ms = base_solve * (0.85 if tier == 1 else (1.05 if tier == 2 else 1.35))
                        confusion = []
                        if shape_id == "parallelogram":
                            confusion = ["rhombus"]
                        elif shape_id == "heptagon":
                            confusion = ["octagon"]

                        att = ShapeGameAttempt(
                            session_id=sess_id,
                            round_number=r_num,
                            shape_id=shape_id,
                            difficulty_tier=tier,
                            target_slot_id=f"slot-{r_num}-{shape_id}",
                            first_touch_latency_ms=base_lat + (tier * 60),
                            first_drag_start_ms=base_lat + 200,
                            solve_time_ms=solve_ms,
                            incorrect_attempts=len(confusion),
                            hints_needed=hints,
                            solved_independently=is_indep,
                            drag_hesitation_pauses=1 if tier == 3 else 0,
                            path_length_px=280.0 + tier * 40,
                            straight_line_dist_px=220.0,
                            path_efficiency=0.82 if tier == 3 else 0.94,
                            tremor_jitter_proxy=10.0 + tier * 2,
                            confusion_choices=json.dumps(confusion)
                        )
                        db.add(att)
                db.commit()

                # Build summary
                summary = ShapeGameSessionSummary(
                    session_id=sess_id,
                    patient_id=1,
                    summary_json=json.dumps({
                        "session_id": sess_id,
                        "rounds_completed": 5,
                        "independence_score": ind_score,
                        "accuracy_pct": session_rec.accuracy_pct,
                        "median_solve_time_ms": base_solve,
                        "median_latency_ms": base_lat
                    }),
                    plain_language_narrative=f"Completed all 5 rounds with {ind_score}% independent placement."
                )
                db.add(summary)
                db.commit()

            # Compute initial baseline
            update_patient_baseline(db, 1)

            # Seed an informational alert
            alert = ShapeGameAlert(
                patient_id=1,
                session_id=f"seed-shape-session-{len(day_offsets)}",
                alert_type="SOLVE_TIME_ELEVATION",
                severity="attention",
                title="Moderate Solve Time Increase",
                message="Shape placement solve time was moderately longer over the last 3 sessions compared to personal baseline."
            )
            db.add(alert)
            db.commit()
    finally:
        db.close()

seed_database()

# Register API routers under /api and /api/v1
# Root level mounts for /api/shape-game/... and /api/caregiver/...
app.include_router(shape_game.router, prefix="/api")
# V1 mounts
app.include_router(consent.router, prefix=settings.API_V1_STR)
app.include_router(telemetry.router, prefix=settings.API_V1_STR)
app.include_router(memory.router, prefix=settings.API_V1_STR)
app.include_router(asha.router, prefix=settings.API_V1_STR)
app.include_router(tts.router, prefix=settings.API_V1_STR)
app.include_router(locale.router, prefix=settings.API_V1_STR)
app.include_router(ivr.router, prefix=settings.API_V1_STR)
app.include_router(shape_game.router, prefix=settings.API_V1_STR)
app.include_router(esanjeevani.router)

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "tagline": "AI Cognitive Gaming & Memory Platform for Elderly Dementia in NER",
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.datetime.utcnow().isoformat()}
