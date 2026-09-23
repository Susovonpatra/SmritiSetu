from fastapi import APIRouter, Depends, Response, Form, Request
from sqlalchemy.orm import Session
from app.models.database import get_db
from app.models.schemas import IVRCheckinLog, TelemetryLog, IVRInput, Patient
import datetime

router = APIRouter(prefix="/ivr", tags=["Feature-Phone IVR"])

# Script for 3-question regional check-in
IVR_QUESTIONS = [
    {
        "step": 1,
        "question": "নমস্কাৰ! স্মৃতিসেতু স্বাগতম। এতিয়া ৰাতিপুৱা নে গধূলি? ৰাতিপুৱাৰ বাবে ১ টিপক, গধূলিৰ বাবে ২ টিপক।",
        "question_en": "Hello from SmritiSetu. Is it morning or evening? Press 1 for Morning, 2 for Evening.",
        "expected": "1"
    },
    {
        "step": 2,
        "question": "আপুনি আজি ৰাতিপুৱাৰ চাহ আৰু ঔষধ খালে নে? খালে ১ টিপক, খোৱা নাই যদি ২ টিপক।",
        "question_en": "Did you take your morning tea and medicine? Press 1 for Yes, 2 for No.",
        "expected": "1"
    },
    {
        "step": 3,
        "question": "আপোনাৰ নাতিনী অনন্যা গুৱাহাটীত থাকে নে ডিব্ৰুগড়ত? গুৱাহাটীৰ বাবে ১ টিপক, ডিব্ৰুগড়ৰ বাবে ২ টিপক।",
        "question_en": "Does your granddaughter Ananya live in Guwahati or Dibrugarh? Press 1 for Guwahati, 2 for Dibrugarh.",
        "expected": "1"
    }
]

@router.get("/twiml", response_class=Response)
@router.post("/twiml", response_class=Response)
def get_twiml_menu():
    """
    Returns TwiML XML compliant with Twilio / automated telecom gateways
    """
    xml_content = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="as-IN">নমস্কাৰ, স্মৃতিসেতু দৈনিক স্বাস্থ্য পৰীক্ষালৈ স্বাগতম।</Say>
    <Gather numDigits="1" action="/api/v1/ivr/dtmf" method="POST" timeout="10">
        <Say voice="Polly.Aditi" language="as-IN">প্ৰথম প্ৰশ্ন: এতিয়া ৰাতিপুৱা নে গধূলি? ৰাতিপুৱাৰ বাবে এক টিপক, গধূলিৰ বাবে দুই টিপক।</Say>
    </Gather>
    <Say>কোনো উত্তৰ পোৱা নগ'ল। পুনৰ চেষ্টা কৰক।</Say>
</Response>"""
    return Response(content=xml_content, media_type="application/xml")


@router.post("/dtmf")
async def handle_dtmf_webhook(
    request: Request,
    Digits: str = Form(default="1"),
    CallSid: str = Form(default="SIMULATED-CALL-01"),
    From: str = Form(default="+919435012345"),
    db: Session = Depends(get_db)
):
    """
    Parses incoming DTMF keypress and logs telemetry directly to central DB
    """
    # Create IVR check-in log
    log = IVRCheckinLog(
        patient_id=1,
        call_sid=CallSid,
        q1_response=Digits,
        composite_score=1.0 if Digits == "1" else 0.5,
        source="IVR"
    )
    db.add(log)

    # Ingest directly into central telemetry
    telemetry = TelemetryLog(
        patient_id=1,
        game_type="ivr_checkin",
        latency_ms=1200.0,
        jitter_px=0.0,
        accuracy_score=1.0 if Digits == "1" else 0.5,
        source="IVR"
    )
    db.add(telemetry)
    db.commit()

    xml_response = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Aditi" language="as-IN">আপোনাৰ উত্তৰ সংৰক্ষণ কৰা হ'ল। ধন্যবাদ।</Say>
    <Hangup/>
</Response>"""
    return Response(content=xml_response, media_type="application/xml")


@router.post("/simulate")
def simulate_ivr_call(payload: IVRInput, db: Session = Depends(get_db)):
    """
    Simulated feature phone check-in for the web frontend IVR dialer
    """
    q1_correct = payload.q1 == "1"
    q2_correct = payload.q2 == "1"
    q3_correct = payload.q3 == "1"

    score = sum([q1_correct, q2_correct, q3_correct]) / 3.0

    log = IVRCheckinLog(
        patient_id=payload.patient_id,
        call_sid=payload.call_sid or "WEB-SIM-101",
        q1_response=payload.q1,
        q2_response=payload.q2,
        q3_response=payload.q3,
        composite_score=score,
        source="IVR"
    )
    db.add(log)

    # Also record in unified telemetry
    telemetry = TelemetryLog(
        patient_id=payload.patient_id,
        game_type="ivr_checkin",
        latency_ms=1150.0 + (3 - score * 3) * 200,
        jitter_px=0.0,
        accuracy_score=score,
        source="IVR"
    )
    db.add(telemetry)
    db.commit()

    return {
        "status": "success",
        "composite_score": round(score * 100, 1),
        "responses": {
            "q1_day_orientation": "Correct (Morning)" if q1_correct else "Incorrect",
            "q2_routine_adherence": "Adherent (Tea/Meds taken)" if q2_correct else "Non-adherent",
            "q3_memory_recall": "Correct (Guwahati)" if q3_correct else "Incorrect"
        },
        "message": "IVR telephone telemetry successfully synchronized into central hub."
    }
