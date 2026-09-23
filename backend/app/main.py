from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.models.database import engine, Base, SessionLocal
from app.models.schemas import Patient, TelemetryLog, AshaQueue, ConsentRecord
from app.api import consent, telemetry, memory, asha, tts, ivr, esanjeevani
import datetime

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
    finally:
        db.close()

seed_database()

# Register API routers under /api/v1
app.include_router(consent.router, prefix=settings.API_V1_STR)
app.include_router(telemetry.router, prefix=settings.API_V1_STR)
app.include_router(memory.router, prefix=settings.API_V1_STR)
app.include_router(asha.router, prefix=settings.API_V1_STR)
app.include_router(tts.router, prefix=settings.API_V1_STR)
app.include_router(ivr.router, prefix=settings.API_V1_STR)
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
