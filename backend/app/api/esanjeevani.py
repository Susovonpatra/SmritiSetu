import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.schemas import Patient, TelemetryLog
from app.api.telemetry import get_cognitive_drift
from app.core.pdf_report import generate_clinical_pdf

router = APIRouter(prefix="", tags=["Clinical Reports & eSanjeevani"])

class eSanjeevaniDispatchRequest(BaseModel):
    patient_id: int
    abha_id: str
    urgency_level: str = "Routine"  # Routine, Priority, Urgent
    clinical_notes: str = ""

@router.get("/report/{patient_id}/pdf")
def download_patient_clinical_pdf(patient_id: int, db: Session = Depends(get_db)):
    """
    Generate and stream MoCA/ICMR-NARI aligned clinical PDF report
    """
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        patient_data = {
            "name": "Bhaben Baruah",
            "age": 74,
            "abha_id": "NER-ASM-9821-4412",
            "dialect": "Assamese",
            "caregiver_name": "Ananya Baruah",
            "caregiver_phone": "+91 94350 12345"
        }
    else:
        patient_data = {
            "name": patient.name,
            "age": patient.age,
            "abha_id": patient.abha_id,
            "dialect": patient.dialect,
            "caregiver_name": patient.caregiver_name,
            "caregiver_phone": patient.caregiver_phone
        }

    drift_data = get_cognitive_drift(patient_id=patient_id, db=db)
    
    pdf_buffer = generate_clinical_pdf(
        patient_data=patient_data,
        drift_data=drift_data,
        telemetry_summary={}
    )

    filename = f"SmritiSetu_Clinical_Dossier_{patient_data['abha_id']}.pdf"
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/api/v1/esanjeevani/dispatch")
def dispatch_esanjeevani_consultation(payload: eSanjeevaniDispatchRequest, db: Session = Depends(get_db)):
    """
    Simulates eSanjeevani teleconsultation request bundle
    """
    dispatch_id = f"ESANJ-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    return {
        "status": "dispatched",
        "dispatch_id": dispatch_id,
        "patient_id": payload.patient_id,
        "abha_id": payload.abha_id,
        "teleconsultation_center": "Guwahati Medical College & Hospital (GMCH) Geriatric Tele-Clinic",
        "assigned_physician": "Dr. P. K. Hazarika, MD (Neurology)",
        "queue_position": 2,
        "estimated_wait_time": "15 minutes",
        "urgency": payload.urgency_level,
        "linked_dossier_url": f"/api/v1/report/{payload.patient_id}/pdf"
    }
