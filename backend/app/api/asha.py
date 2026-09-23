from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.schemas import AshaQueue, AshaQueueItem, AshaQueueResponse

router = APIRouter(prefix="/asha", tags=["ASHA Companion"])

@router.get("/queue", response_model=List[AshaQueueResponse])
def get_triage_queue(worker_id: str = "ASHA-NAGAON-01", db: Session = Depends(get_db)):
    """Retrieve all door-to-door triage visit records for the health worker"""
    records = db.query(AshaQueue).order_by(AshaQueue.created_at.desc()).all()
    return records

@router.post("/queue", response_model=AshaQueueResponse)
def add_triage_record(item: AshaQueueItem, db: Session = Depends(get_db)):
    """Record a door-to-door screening assessment"""
    record = AshaQueue(
        patient_id=item.patient_id,
        worker_id=item.worker_id,
        patient_name=item.patient_name,
        village=item.village,
        triage_status=item.triage_status,
        notes=item.notes,
        synced=True
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.post("/sync")
def sync_offline_triage_batch(items: List[AshaQueueItem], db: Session = Depends(get_db)):
    """Ingest bulk triage logs recorded offline by ASHA workers in remote villages"""
    synced = 0
    for itm in items:
        rec = AshaQueue(
            patient_id=itm.patient_id,
            worker_id=itm.worker_id,
            patient_name=itm.patient_name,
            village=itm.village,
            triage_status=itm.triage_status,
            notes=itm.notes,
            synced=True
        )
        db.add(rec)
        synced += 1
    db.commit()
    return {"status": "success", "synced_count": synced}
