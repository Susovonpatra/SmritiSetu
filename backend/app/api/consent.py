from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.schemas import ConsentRecord, ConsentCreate, ConsentResponse, Patient

router = APIRouter(prefix="/consent", tags=["Consent"])

@router.post("", response_model=ConsentResponse)
def create_consent_record(payload: ConsentCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        # Create default patient if not exists
        patient = Patient(
            id=payload.patient_id,
            abha_id=f"NER-ASM-9821-{payload.patient_id:04d}",
            name="Bhaben Baruah",
            age=74,
            dialect="Assamese",
            caregiver_name=payload.caregiver_name,
            caregiver_phone="+91 94350 12345",
            baseline_latency=800.0
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

    consent = ConsentRecord(
        patient_id=payload.patient_id,
        caregiver_name=payload.caregiver_name,
        telemetry_consent=payload.telemetry_consent,
        voice_storage_consent=payload.voice_storage_consent,
        abha_linkage_consent=payload.abha_linkage_consent,
        signature_hash=payload.signature_hash
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return consent

@router.get("/{patient_id}", response_model=ConsentResponse)
def get_patient_consent(patient_id: int, db: Session = Depends(get_db)):
    record = db.query(ConsentRecord).filter(ConsentRecord.patient_id == patient_id).order_by(ConsentRecord.timestamp.desc()).first()
    if not record:
        raise HTTPException(status_code=404, detail="Consent record not found for patient")
    return record
