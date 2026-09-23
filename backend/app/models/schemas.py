import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.database import Base

# ==========================================
# SQLAlchemy ORM Models
# ==========================================

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    abha_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    dialect = Column(String(50), default="Assamese")
    caregiver_name = Column(String(100), nullable=False)
    caregiver_phone = Column(String(20), nullable=False)
    baseline_latency = Column(Float, default=800.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    consents = relationship("ConsentRecord", back_populates="patient", cascade="all, delete-orphan")
    telemetries = relationship("TelemetryLog", back_populates="patient", cascade="all, delete-orphan")
    asha_records = relationship("AshaQueue", back_populates="patient", cascade="all, delete-orphan")
    ivr_logs = relationship("IVRCheckinLog", back_populates="patient", cascade="all, delete-orphan")


class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    caregiver_name = Column(String(100), nullable=False)
    telemetry_consent = Column(Boolean, default=True)
    voice_storage_consent = Column(Boolean, default=True)
    abha_linkage_consent = Column(Boolean, default=True)
    signature_hash = Column(String(64), nullable=False)  # SHA-256 session signature
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="consents")


class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    game_type = Column(String(50), nullable=False)  # visual_matching, routine_sequencer, ivr_checkin
    prompt_end_time = Column(DateTime, nullable=True)
    tap_time = Column(DateTime, nullable=True)
    latency_ms = Column(Float, nullable=False)       # (ttap - tprompt_end)
    jitter_px = Column(Float, default=0.0)           # sqrt(dx^2 + dy^2) tremor metric
    accuracy_score = Column(Float, default=1.0)      # 0.0 to 1.0
    source = Column(String(20), default="PWA")       # PWA, ASHA, IVR
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="telemetries")


class AshaQueue(Base):
    __tablename__ = "asha_queue"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    worker_id = Column(String(50), default="ASHA-NAGAON-01")
    patient_name = Column(String(100), nullable=False)
    village = Column(String(100), nullable=False)
    triage_status = Column(String(20), default="Green")  # Green, Amber, Red
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    synced = Column(Boolean, default=True)

    patient = relationship("Patient", back_populates="asha_records")


class IVRCheckinLog(Base):
    __tablename__ = "ivr_checkin_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    call_sid = Column(String(100), nullable=True)
    q1_response = Column(String(10), nullable=True)  # Orientation (e.g. 1=Morning, 2=Evening)
    q2_response = Column(String(10), nullable=True)  # Memory recall (e.g. 1=Yes, 2=No)
    q3_response = Column(String(10), nullable=True)  # Routine adherence
    composite_score = Column(Float, default=1.0)
    source = Column(String(20), default="IVR")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    patient = relationship("Patient", back_populates="ivr_logs")


# ==========================================
# Pydantic Schemas
# ==========================================

class PatientCreate(BaseModel):
    abha_id: str
    name: str
    age: int
    dialect: str = "Assamese"
    caregiver_name: str
    caregiver_phone: str
    baseline_latency: float = 800.0

class PatientResponse(PatientCreate):
    id: int
    created_at: datetime.datetime
    model_config = ConfigDict(from_attributes=True)


class ConsentCreate(BaseModel):
    patient_id: int
    caregiver_name: str
    telemetry_consent: bool
    voice_storage_consent: bool
    abha_linkage_consent: bool
    signature_hash: str

class ConsentResponse(ConsentCreate):
    id: int
    timestamp: datetime.datetime
    model_config = ConfigDict(from_attributes=True)


class TelemetryItem(BaseModel):
    patient_id: int
    game_type: str
    latency_ms: float
    jitter_px: float = 0.0
    accuracy_score: float = 1.0
    source: str = "PWA"
    timestamp: Optional[datetime.datetime] = None

class TelemetrySyncRequest(BaseModel):
    records: List[TelemetryItem]

class TelemetryResponse(TelemetryItem):
    id: int
    model_config = ConfigDict(from_attributes=True)


class AshaQueueItem(BaseModel):
    patient_id: Optional[int] = None
    patient_name: str
    village: str
    triage_status: str  # Green, Amber, Red
    notes: Optional[str] = ""
    worker_id: str = "ASHA-NAGAON-01"

class AshaQueueResponse(AshaQueueItem):
    id: int
    created_at: datetime.datetime
    synced: bool
    model_config = ConfigDict(from_attributes=True)


class IVRInput(BaseModel):
    patient_id: int
    q1: str
    q2: str
    q3: str
    call_sid: Optional[str] = "SIMULATED-CALL-01"
