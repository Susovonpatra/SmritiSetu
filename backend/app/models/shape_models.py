"""
SQLAlchemy ORM Models for Match the Shapes Game & Caregiver Telemetry
Tables:
- shape_game_sessions
- shape_game_rounds
- shape_game_attempts
- shape_game_events
- shape_game_session_summaries
- shape_game_baselines
- shape_game_alerts
- shape_game_audit_logs
"""

import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from app.models.database import Base


class ShapeGameSession(Base):
    __tablename__ = "shape_game_sessions"

    id = Column(String(64), primary_key=True, index=True) # Client or server UUID
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    seed = Column(String(64), nullable=False)
    status = Column(String(20), default="IN_PROGRESS") # IN_PROGRESS, COMPLETED, ABANDONED
    started_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    total_duration_ms = Column(Float, default=0.0)
    rounds_completed = Column(Integer, default=0)
    independence_score = Column(Float, default=100.0) # % shapes placed with 0 hints
    accuracy_pct = Column(Float, default=100.0)       # first-attempt correct %
    median_latency_ms = Column(Float, default=0.0)
    mean_latency_ms = Column(Float, default=0.0)
    median_solve_time_ms = Column(Float, default=0.0)
    fatigue_index = Column(Float, default=1.0)        # late solve time / early solve time
    engagement_score = Column(Float, default=100.0)
    client_version = Column(String(20), default="1.0.0")

    rounds = relationship("ShapeGameRound", back_populates="session", cascade="all, delete-orphan")
    attempts = relationship("ShapeGameAttempt", back_populates="session", cascade="all, delete-orphan")
    events = relationship("ShapeGameEvent", back_populates="session", cascade="all, delete-orphan")
    summary = relationship("ShapeGameSessionSummary", back_populates="session", uselist=False, cascade="all, delete-orphan")


class ShapeGameRound(Base):
    __tablename__ = "shape_game_rounds"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("shape_game_sessions.id"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False) # 1 to 5
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Float, default=0.0)
    errors_count = Column(Integer, default=0)
    hints_count = Column(Integer, default=0)
    idle_time_ms = Column(Float, default=0.0)
    completed = Column(Boolean, default=False)

    session = relationship("ShapeGameSession", back_populates="rounds")


class ShapeGameAttempt(Base):
    __tablename__ = "shape_game_attempts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("shape_game_sessions.id"), nullable=False, index=True)
    round_number = Column(Integer, nullable=False)
    shape_id = Column(String(50), nullable=False, index=True)
    difficulty_tier = Column(Integer, default=1)
    target_slot_id = Column(String(50), nullable=True)
    first_touch_latency_ms = Column(Float, default=0.0)
    first_drag_start_ms = Column(Float, default=0.0)
    solve_time_ms = Column(Float, default=0.0)
    incorrect_attempts = Column(Integer, default=0)
    hints_needed = Column(Integer, default=0) # max hint level 0, 1, 2, 3
    solved_independently = Column(Boolean, default=True)
    drag_hesitation_pauses = Column(Integer, default=0)
    path_length_px = Column(Float, default=0.0)
    straight_line_dist_px = Column(Float, default=0.0)
    path_efficiency = Column(Float, default=1.0)
    tremor_jitter_proxy = Column(Float, default=0.0)
    confusion_choices = Column(Text, default="[]") # JSON list of mistaken slot shape IDs
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("ShapeGameSession", back_populates="attempts")


class ShapeGameEvent(Base):
    __tablename__ = "shape_game_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(64), unique=True, index=True, nullable=False) # Client idempotency key
    session_id = Column(String(64), ForeignKey("shape_game_sessions.id"), nullable=False, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    round_number = Column(Integer, nullable=True)
    shape_id = Column(String(50), nullable=True)
    payload_json = Column(Text, default="{}")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    session = relationship("ShapeGameSession", back_populates="events")


class ShapeGameSessionSummary(Base):
    __tablename__ = "shape_game_session_summaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("shape_game_sessions.id"), unique=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    summary_json = Column(Text, default="{}")
    plain_language_narrative = Column(Text, default="")

    session = relationship("ShapeGameSession", back_populates="summary")


class ShapeGameBaseline(Base):
    __tablename__ = "shape_game_baselines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    computed_at = Column(DateTime, default=datetime.datetime.utcnow)
    window_type = Column(String(30), default="ROLLING_14_DAY") # INITIAL_5_SESSIONS, ROLLING_14_DAY
    session_count = Column(Integer, default=0)
    baseline_solve_time_ms = Column(Float, default=3500.0)
    baseline_latency_ms = Column(Float, default=950.0)
    baseline_independence_score = Column(Float, default=85.0)
    baseline_accuracy_pct = Column(Float, default=90.0)
    baseline_jitter_px = Column(Float, default=12.0)
    solve_time_mad = Column(Float, default=600.0) # Median Absolute Deviation
    latency_mad = Column(Float, default=150.0)


class ShapeGameAlert(Base):
    __tablename__ = "shape_game_alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False, index=True)
    session_id = Column(String(64), nullable=True)
    alert_type = Column(String(50), nullable=False) # SOLVE_TIME_ELEVATION, HINT_DEPENDENCE, LATENCY_SPIKE, INACTIVITY_GAP, IMPROVEMENT
    severity = Column(String(20), default="info")   # info, attention
    title = Column(String(100), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    acknowledged = Column(Boolean, default=False)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(100), nullable=True)


class ShapeGameAuditLog(Base):
    __tablename__ = "shape_game_audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    caregiver_id = Column(String(100), nullable=False, index=True)
    patient_id = Column(Integer, nullable=False, index=True)
    action = Column(String(50), nullable=False) # VIEW_SUMMARY, VIEW_SESSIONS, VIEW_DETAIL, EXPORT_DATA, ACK_ALERT
    resource = Column(String(255), nullable=False)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
