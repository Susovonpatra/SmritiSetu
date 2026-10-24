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

from contextlib import asynccontextmanager
import logging

logger = logging.getLogger("uvicorn.error")

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
                created_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)
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
                timestamp=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)
            )
            db.add(consent_rec)

            # Seed ASHA triage record
            asha_rec = AshaQueue(
                patient_id=1,
                worker_id="ASHA-NAGAON-01",
                patient_name="Bhaben Baruah",
                village="Raha, Nagaon",
                triage_status="Green",
                notes="Patient profile initialized and awaiting initial clinical cognitive gameplay baseline.",
                synced=True
            )
            db.add(asha_rec)
            db.commit()

        # Clean up any leftover mock seeds from prior runs
        try:
            seed_ids = [s.id for s in db.query(ShapeGameSession).filter(ShapeGameSession.id.like("seed-shape-session-%")).all()]
            if seed_ids:
                db.query(ShapeGameAttempt).filter(ShapeGameAttempt.session_id.in_(seed_ids)).delete(synchronize_session=False)
                db.query(ShapeGameRound).filter(ShapeGameRound.session_id.in_(seed_ids)).delete(synchronize_session=False)
                db.query(ShapeGameEvent).filter(ShapeGameEvent.session_id.in_(seed_ids)).delete(synchronize_session=False)
                db.query(ShapeGameSessionSummary).filter(ShapeGameSessionSummary.session_id.in_(seed_ids)).delete(synchronize_session=False)
                db.query(ShapeGameAlert).filter(ShapeGameAlert.session_id.in_(seed_ids)).delete(synchronize_session=False)
                db.query(ShapeGameSession).filter(ShapeGameSession.id.in_(seed_ids)).delete(synchronize_session=False)
                db.commit()
        except Exception as e:
            db.rollback()
            logger.warning(f"Seed cleanup notice: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        seed_database()
        logger.info("Database schema initialized and baseline data seeded.")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in North Eastern Region (NER).",
    lifespan=lifespan
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
