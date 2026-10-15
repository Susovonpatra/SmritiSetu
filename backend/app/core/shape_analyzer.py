"""
Shape Game Telemetry Analyzer & Longitudinal Progress Engine
Computes:
1. Per-session summary metrics (latency, solve time, accuracy, independence, fatigue)
2. Patient-specific personal baseline (rolling median of initial 5, then 14-day rolling window with MAD)
3. Longitudinal trends (7d, 30d, 90d)
4. Shape difficulty ranking & confusion pairs
5. Notable change alerts (monitoring aid, non-diagnostic)
6. Weekly plain-language observational narratives
"""

import json
import statistics
import datetime
from typing import Dict, List, Any, Optional, Tuple, Union
from sqlalchemy.orm import Session
from app.models.shape_models import (
    ShapeGameSession,
    ShapeGameRound,
    ShapeGameAttempt,
    ShapeGameEvent,
    ShapeGameSessionSummary,
    ShapeGameBaseline,
    ShapeGameAlert,
)
from app.core.shape_config import SHAPES_BY_ID


CLINICAL_DISCLAIMER = (
    "These insights are for observation and should be discussed with the patient's clinician. "
    "SmritiSetu is a cognitive companion and monitoring aid, not a diagnostic medical device."
)


def resolve_patient_id(db: Session, patient_id: Union[int, str]) -> int:
    """Resolves int or UUID/string patient_id to the database patient.id."""
    try:
        return int(patient_id)
    except (ValueError, TypeError):
        pass

    from app.models.schemas import Patient
    p = db.query(Patient).filter(Patient.abha_id == str(patient_id).strip()).first()
    if p:
        return p.id
    p1 = db.query(Patient).filter(Patient.id == 1).first()
    return p1.id if p1 else 1


def compute_median_absolute_deviation(values: List[float], med: Optional[float] = None) -> float:
    """Computes MAD: median(|x_i - median(X)|)"""
    if not values:
        return 0.0
    if med is None:
        med = statistics.median(values)
    deviations = [abs(x - med) for x in values]
    return statistics.median(deviations) if deviations else 0.0


def analyze_and_finalize_session(db: Session, session: ShapeGameSession) -> ShapeGameSessionSummary:
    """
    Computes final session-level aggregates from completed attempts and events.
    Updates the session record and generates an explanatory session summary.
    """
    attempts: List[ShapeGameAttempt] = db.query(ShapeGameAttempt).filter(
        ShapeGameAttempt.session_id == session.id
    ).all()

    total_shapes = len(attempts)
    if total_shapes == 0:
        session.status = "ABANDONED"
        session.rounds_completed = 0
        db.commit()
        return None

    # Calculate metrics
    solve_times = [a.solve_time_ms for a in attempts if a.solve_time_ms > 0]
    latencies = [a.first_touch_latency_ms for a in attempts if a.first_touch_latency_ms > 0]
    independent_count = sum(1 for a in attempts if a.hints_needed == 0)
    first_try_correct_count = sum(1 for a in attempts if a.incorrect_attempts == 0)

    independence_score = round((independent_count / total_shapes) * 100.0, 1)
    accuracy_pct = round((first_try_correct_count / total_shapes) * 100.0, 1)

    median_solve_time = round(statistics.median(solve_times), 1) if solve_times else 0.0
    median_latency = round(statistics.median(latencies), 1) if latencies else 0.0
    mean_latency = round(statistics.mean(latencies), 1) if latencies else 0.0

    # Calculate fatigue index: late rounds (4 & 5) vs early rounds (1 & 2)
    early_attempts = [a.solve_time_ms for a in attempts if a.round_number in (1, 2) and a.solve_time_ms > 0]
    late_attempts = [a.solve_time_ms for a in attempts if a.round_number in (4, 5) and a.solve_time_ms > 0]

    fatigue_index = 1.0
    if early_attempts and late_attempts:
        early_avg = statistics.mean(early_attempts)
        late_avg = statistics.mean(late_attempts)
        if early_avg > 0:
            fatigue_index = round(late_avg / early_avg, 2)

    # Engagement: completed rounds / 5 + interaction flow
    rounds_completed = max([a.round_number for a in attempts] + [0])
    engagement_score = round(min(100.0, (rounds_completed / 5.0) * 100.0), 1)

    # Update session entity
    session.rounds_completed = rounds_completed
    session.independence_score = independence_score
    session.accuracy_pct = accuracy_pct
    session.median_latency_ms = median_latency
    session.mean_latency_ms = mean_latency
    session.median_solve_time_ms = median_solve_time
    session.fatigue_index = fatigue_index
    session.engagement_score = engagement_score
    if rounds_completed >= 5:
        session.status = "COMPLETED"

    # Plain language narrative
    narrative_parts = []
    if rounds_completed >= 5:
        narrative_parts.append(f"Completed all 5 rounds (20 shapes) with {independence_score}% independent placement.")
    else:
        narrative_parts.append(f"Completed {rounds_completed} of 5 rounds.")

    if accuracy_pct >= 90:
        narrative_parts.append("High spatial accuracy with minimal mistaken drops.")
    elif accuracy_pct >= 70:
        narrative_parts.append("Good placement accuracy across familiar shapes.")
    else:
        narrative_parts.append("Encountered some visual similarity exploration on complex shapes.")

    if fatigue_index > 1.35:
        narrative_parts.append("Slight fatigue noted towards later rounds; solve times extended gradually.")
    elif fatigue_index < 0.85:
        narrative_parts.append("Task fluency improved as the session progressed.")

    plain_narrative = " ".join(narrative_parts)

    summary_payload = {
        "session_id": session.id,
        "rounds_completed": rounds_completed,
        "total_shapes": total_shapes,
        "independence_score": independence_score,
        "accuracy_pct": accuracy_pct,
        "median_solve_time_ms": median_solve_time,
        "median_latency_ms": median_latency,
        "fatigue_index": fatigue_index,
        "disclaimer": CLINICAL_DISCLAIMER
    }

    summary = ShapeGameSessionSummary(
        session_id=session.id,
        patient_id=session.patient_id,
        summary_json=json.dumps(summary_payload),
        plain_language_narrative=plain_narrative
    )
    db.add(summary)
    db.commit()

    # Update patient baseline and check alerts
    update_patient_baseline(db, session.patient_id)
    evaluate_alerts_for_patient(db, session.patient_id, session)

    return summary


def update_patient_baseline(db: Session, patient_id: Union[int, str]) -> ShapeGameBaseline:
    """
    Builds a per-patient personal baseline (rolling median of first 5 sessions,
    then rolling 14-day window). Compare against patient's OWN baseline.
    """
    db_patient_id = resolve_patient_id(db, patient_id)
    sessions: List[ShapeGameSession] = db.query(ShapeGameSession).filter(
        ShapeGameSession.patient_id == db_patient_id,
        ShapeGameSession.status == "COMPLETED"
    ).order_by(ShapeGameSession.started_at.desc()).all()

    if not sessions:
        # Default starting baseline
        baseline = ShapeGameBaseline(
            patient_id=db_patient_id,
            window_type="INITIAL_DEFAULT",
            session_count=0,
            baseline_solve_time_ms=3500.0,
            baseline_latency_ms=950.0,
            baseline_independence_score=85.0,
            baseline_accuracy_pct=90.0,
            baseline_jitter_px=12.0,
            solve_time_mad=600.0,
            latency_mad=150.0
        )
        db.add(baseline)
        db.commit()
        return baseline

    window_sessions = []
    window_type = "INITIAL_5_SESSIONS"

    if len(sessions) <= 5:
        window_sessions = sessions
        window_type = "INITIAL_5_SESSIONS"
    else:
        fourteen_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=14)
        window_sessions = [s for s in sessions if s.started_at >= fourteen_days_ago]
        if len(window_sessions) < 5:
            window_sessions = sessions[:5] # Keep at least 5 most recent
        window_type = "ROLLING_14_DAY"

    solve_times = [s.median_solve_time_ms for s in window_sessions if s.median_solve_time_ms > 0]
    latencies = [s.median_latency_ms for s in window_sessions if s.median_latency_ms > 0]
    independences = [s.independence_score for s in window_sessions]
    accuracies = [s.accuracy_pct for s in window_sessions]

    b_solve = statistics.median(solve_times) if solve_times else 3500.0
    b_lat = statistics.median(latencies) if latencies else 950.0
    b_ind = statistics.median(independences) if independences else 85.0
    b_acc = statistics.median(accuracies) if accuracies else 90.0

    mad_solve = compute_median_absolute_deviation(solve_times, b_solve)
    mad_lat = compute_median_absolute_deviation(latencies, b_lat)

    existing = db.query(ShapeGameBaseline).filter(
        ShapeGameBaseline.patient_id == db_patient_id
    ).first()

    if existing:
        existing.window_type = window_type
        existing.session_count = len(window_sessions)
        existing.baseline_solve_time_ms = round(b_solve, 1)
        existing.baseline_latency_ms = round(b_lat, 1)
        existing.baseline_independence_score = round(b_ind, 1)
        existing.baseline_accuracy_pct = round(b_acc, 1)
        existing.solve_time_mad = round(mad_solve, 1)
        existing.latency_mad = round(mad_lat, 1)
        existing.computed_at = datetime.datetime.utcnow()
        db.commit()
        return existing
    else:
        baseline = ShapeGameBaseline(
            patient_id=db_patient_id,
            window_type=window_type,
            session_count=len(window_sessions),
            baseline_solve_time_ms=round(b_solve, 1),
            baseline_latency_ms=round(b_lat, 1),
            baseline_independence_score=round(b_ind, 1),
            baseline_accuracy_pct=round(b_acc, 1),
            solve_time_mad=round(mad_solve, 1),
            latency_mad=round(mad_lat, 1),
        )
        db.add(baseline)
        db.commit()
        return baseline


def evaluate_alerts_for_patient(db: Session, patient_id: Union[int, str], current_session: ShapeGameSession) -> List[ShapeGameAlert]:
    """
    Evaluates notable changes against personal baseline.
    Threshold: solve time > baseline + 1.5 MAD or >25% for 3+ sessions.
    Generates non-diagnostic observational alerts.
    """
    db_patient_id = resolve_patient_id(db, patient_id)
    baseline = db.query(ShapeGameBaseline).filter(ShapeGameBaseline.patient_id == db_patient_id).first()
    if not baseline or baseline.session_count < 2:
        return []

    recent_sessions: List[ShapeGameSession] = db.query(ShapeGameSession).filter(
        ShapeGameSession.patient_id == db_patient_id,
        ShapeGameSession.status == "COMPLETED"
    ).order_by(ShapeGameSession.started_at.desc()).limit(3).all()

    alerts_created = []

    # 1. Solve time worsening for 3+ sessions (>25% or >1.5 MAD)
    if len(recent_sessions) >= 3:
        threshold_solve = max(baseline.baseline_solve_time_ms * 1.25, baseline.baseline_solve_time_ms + 1.5 * baseline.solve_time_mad)
        all_elevated = all(s.median_solve_time_ms > threshold_solve for s in recent_sessions)
        if all_elevated:
            alert = ShapeGameAlert(
                patient_id=db_patient_id,
                session_id=current_session.id,
                alert_type="SOLVE_TIME_ELEVATION",
                severity="attention",
                title="Moderate Solve Time Increase",
                message="Shape placement solve time was moderately longer over the last 3 sessions compared to personal baseline."
            )
            db.add(alert)
            alerts_created.append(alert)

    # 2. Sudden reaction latency spike (>50% above baseline)
    if current_session.median_latency_ms > baseline.baseline_latency_ms * 1.5 and current_session.median_latency_ms > 1500:
        alert = ShapeGameAlert(
            patient_id=db_patient_id,
            session_id=current_session.id,
            alert_type="LATENCY_SPIKE",
            severity="attention",
            title="Initial Reaction Latency Extended",
            message="Time to first touch when shapes appeared was notably longer in today's session compared to typical baseline."
        )
        db.add(alert)
        alerts_created.append(alert)

    # 3. Notable Improvement (>20% gain in independence score)
    if current_session.independence_score > min(100.0, baseline.baseline_independence_score + 20.0):
        alert = ShapeGameAlert(
            patient_id=db_patient_id,
            session_id=current_session.id,
            alert_type="NOTABLE_IMPROVEMENT",
            severity="info",
            title="Positive Engagement & Fluency",
            message="Demonstrated high independent placement with minimal hint usage in today's session."
        )
        db.add(alert)
        alerts_created.append(alert)

    if alerts_created:
        db.commit()

    return alerts_created


def get_longitudinal_summary(db: Session, patient_id: Union[int, str], days: int = 30) -> Dict[str, Any]:
    """
    Computes 7d, 30d, or 90d longitudinal trends:
    - Solve time trend, latency trend, hints trend, accuracy trend
    - Time-of-day heatmap/distribution
    - Per-shape difficulty ranking
    - Confusion pairs
    - Plain-language weekly caregiver summary
    """
    db_patient_id = resolve_patient_id(db, patient_id)
    cutoff = datetime.datetime.utcnow() - datetime.timedelta(days=days)

    sessions: List[ShapeGameSession] = db.query(ShapeGameSession).filter(
        ShapeGameSession.patient_id == db_patient_id,
        ShapeGameSession.started_at >= cutoff
    ).order_by(ShapeGameSession.started_at.asc()).all()

    baseline = db.query(ShapeGameBaseline).filter(ShapeGameBaseline.patient_id == db_patient_id).first()
    if not baseline:
        baseline = update_patient_baseline(db, db_patient_id)

    # Build timeline
    timeline = []
    time_of_day_counts = {"Morning (6am-12pm)": 0, "Afternoon (12pm-5pm)": 0, "Evening (5pm-10pm)": 0, "Night": 0}

    for s in sessions:
        dt = s.started_at
        hour = dt.hour
        if 6 <= hour < 12:
            time_of_day_counts["Morning (6am-12pm)"] += 1
        elif 12 <= hour < 17:
            time_of_day_counts["Afternoon (12pm-5pm)"] += 1
        elif 17 <= hour < 22:
            time_of_day_counts["Evening (5pm-10pm)"] += 1
        else:
            time_of_day_counts["Night"] += 1

        timeline.append({
            "sessionId": s.id,
            "date": dt.strftime("%b %d"),
            "fullDate": dt.strftime("%Y-%m-%d %H:%M"),
            "solveTimeMs": s.median_solve_time_ms,
            "latencyMs": s.median_latency_ms,
            "accuracyPct": s.accuracy_pct,
            "independenceScore": s.independence_score,
            "roundsCompleted": s.rounds_completed,
            "fatigueIndex": s.fatigue_index
        })

    # Fetch attempts for shape difficulty ranking and confusion pairs
    session_ids = [s.id for s in sessions]
    attempts: List[ShapeGameAttempt] = []
    if session_ids:
        attempts = db.query(ShapeGameAttempt).filter(ShapeGameAttempt.session_id.in_(session_ids)).all()

    # Per-shape stats
    shape_stat_map = {}
    confusion_pairs_map = {}

    for a in attempts:
        sid = a.shape_id
        if sid not in shape_stat_map:
            cfg = SHAPES_BY_ID.get(sid, {})
            shape_stat_map[sid] = {
                "shapeId": sid,
                "displayName": cfg.get("display_name", sid.capitalize()),
                "tier": cfg.get("difficulty_tier", 1),
                "fillColor": cfg.get("fill_color", "#4f46e5"),
                "totalAttempts": 0,
                "totalSolveTime": 0.0,
                "totalErrors": 0,
                "totalHints": 0,
                "independentCount": 0
            }

        st = shape_stat_map[sid]
        st["totalAttempts"] += 1
        st["totalSolveTime"] += a.solve_time_ms
        st["totalErrors"] += a.incorrect_attempts
        st["totalHints"] += a.hints_needed
        if a.hints_needed == 0:
            st["independentCount"] += 1

        # Confusion pairs
        if a.confusion_choices:
            try:
                choices = json.loads(a.confusion_choices)
                for wrong_shape_id in choices:
                    if wrong_shape_id and wrong_shape_id != sid:
                        pair_key = f"{sid}->{wrong_shape_id}"
                        if pair_key not in confusion_pairs_map:
                            confusion_pairs_map[pair_key] = {
                                "intendedShape": sid,
                                "intendedName": SHAPES_BY_ID.get(sid, {}).get("display_name", sid),
                                "mistakenShape": wrong_shape_id,
                                "mistakenName": SHAPES_BY_ID.get(wrong_shape_id, {}).get("display_name", wrong_shape_id),
                                "count": 0
                            }
                        confusion_pairs_map[pair_key]["count"] += 1
            except Exception:
                pass

    # Compile shape difficulty ranking
    shape_rankings = []
    for sid, st in shape_stat_map.items():
        n = st["totalAttempts"]
        avg_solve = round(st["totalSolveTime"] / n, 0) if n > 0 else 0
        avg_errors = round(st["totalErrors"] / n, 2) if n > 0 else 0
        avg_hints = round(st["totalHints"] / n, 2) if n > 0 else 0
        ind_pct = round((st["independentCount"] / n) * 100, 1) if n > 0 else 100

        # Composite difficulty index (weight: solve time + errors*1000 + hints*800)
        difficulty_score = avg_solve + avg_errors * 1000 + avg_hints * 800

        shape_rankings.append({
            **st,
            "avgSolveTimeMs": avg_solve,
            "avgErrors": avg_errors,
            "avgHints": avg_hints,
            "independencePct": ind_pct,
            "difficultyScore": difficulty_score
        })

    # Sort descending by difficulty
    shape_rankings.sort(key=lambda s: s["difficultyScore"], reverse=True)
    for idx, s in enumerate(shape_rankings):
        s["rank"] = idx + 1

    confusion_pairs = sorted(confusion_pairs_map.values(), key=lambda c: c["count"], reverse=True)[:8]

    # Weekly summary generation
    weekly_narrative = generate_weekly_narrative(sessions, shape_rankings, baseline)

    # Active alerts count
    alerts = db.query(ShapeGameAlert).filter(
        ShapeGameAlert.patient_id == db_patient_id,
        ShapeGameAlert.acknowledged == False
    ).order_by(ShapeGameAlert.created_at.desc()).all()

    # Top summary metrics
    latest_session = sessions[-1] if sessions else None
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    sessions_this_week = sum(1 for s in sessions if s.started_at >= seven_days_ago)

    avg_solve_time = (
        round(statistics.mean([s.median_solve_time_ms for s in sessions if s.median_solve_time_ms > 0]), 0)
        if sessions else 0
    )
    avg_independence = (
        round(statistics.mean([s.independence_score for s in sessions]), 1)
        if sessions else 0
    )

    return {
        "patientId": patient_id,
        "rangeDays": days,
        "disclaimer": CLINICAL_DISCLAIMER,
        "metrics": {
            "lastSessionDate": latest_session.started_at.strftime("%b %d, %Y") if latest_session else "None",
            "sessionsThisWeek": sessions_this_week,
            "totalSessionsInRange": len(sessions),
            "averageIndependenceScore": avg_independence,
            "averageSolveTimeMs": avg_solve_time,
            "activeAlertsCount": len(alerts),
            "baselineSolveTimeMs": baseline.baseline_solve_time_ms if baseline else 3500.0,
            "baselineLatencyMs": baseline.baseline_latency_ms if baseline else 950.0,
        },
        "weeklySummary": weekly_narrative,
        "timeline": timeline,
        "timeOfDayDistribution": [
            {"period": k, "count": v} for k, v in time_of_day_counts.items()
        ],
        "shapeRankings": shape_rankings,
        "confusionPairs": confusion_pairs,
        "activeAlerts": [
            {
                "id": a.id,
                "type": a.alert_type,
                "severity": a.severity,
                "title": a.title,
                "message": a.message,
                "createdAt": a.created_at.strftime("%b %d, %Y %H:%M"),
                "sessionId": a.session_id
            }
            for a in alerts
        ]
    }


def generate_weekly_narrative(
    sessions: List[ShapeGameSession],
    shape_rankings: List[Dict[str, Any]],
    baseline: Optional[ShapeGameBaseline]
) -> str:
    """Creates a gentle, plain-language weekly summary for the caregiver."""
    if not sessions:
        return "No shape matching sessions logged during this period. " + CLINICAL_DISCLAIMER

    count = len(sessions)
    recent_sessions = sessions[-7:] if len(sessions) >= 7 else sessions
    avg_ind = statistics.mean([s.independence_score for s in recent_sessions])

    hardest_shapes = [s["displayName"] for s in shape_rankings[:2]] if len(shape_rankings) >= 2 else []
    easiest_shapes = [s["displayName"] for s in shape_rankings[-2:]] if len(shape_rankings) >= 2 else []

    parts = [f"Logged {count} shape matching session(s) in this observation window."]

    if avg_ind >= 85:
        parts.append(f"Maintained strong independence with {round(avg_ind)}% of shapes placed without hint assistance.")
    elif avg_ind >= 65:
        parts.append(f"Demonstrated good engagement with {round(avg_ind)}% independent placement, responding well to gentle hints.")
    else:
        parts.append("Benefited from adaptive visual guidance hints during puzzle sessions.")

    if hardest_shapes:
        parts.append(f"Hesitated slightly longer on {', '.join(hardest_shapes)}.")
    if easiest_shapes:
        parts.append(f"Exhibited high familiarity and swift placement with {', '.join(easiest_shapes)}.")

    parts.append(CLINICAL_DISCLAIMER)
    return " ".join(parts)
