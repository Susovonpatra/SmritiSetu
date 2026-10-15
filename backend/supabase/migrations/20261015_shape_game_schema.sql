-- ============================================================================
-- SMRITISETU: "MATCH THE SHAPES" COGNITIVE GAME & CAREGIVER ANALYTICS SCHEMA
-- PostgreSQL Migration for Supabase
-- ============================================================================

-- 1. Shape Game Sessions Table
CREATE TABLE IF NOT EXISTS public.shape_game_sessions (
    id VARCHAR(64) PRIMARY KEY,
    patient_id INT NOT NULL,
    seed VARCHAR(64) NOT NULL,
    status VARCHAR(20) DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    ended_at TIMESTAMPTZ,
    total_duration_ms FLOAT DEFAULT 0.0,
    rounds_completed INT DEFAULT 0,
    independence_score FLOAT DEFAULT 100.0,
    accuracy_pct FLOAT DEFAULT 100.0,
    median_latency_ms FLOAT DEFAULT 0.0,
    mean_latency_ms FLOAT DEFAULT 0.0,
    median_solve_time_ms FLOAT DEFAULT 0.0,
    fatigue_index FLOAT DEFAULT 1.0,
    engagement_score FLOAT DEFAULT 100.0,
    client_version VARCHAR(20) DEFAULT '1.0.0'
);

CREATE INDEX IF NOT EXISTS idx_shape_sessions_patient ON public.shape_game_sessions(patient_id, started_at DESC);

-- 2. Shape Game Rounds Table
CREATE TABLE IF NOT EXISTS public.shape_game_rounds (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL REFERENCES public.shape_game_sessions(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    completed_at TIMESTAMPTZ,
    duration_ms FLOAT DEFAULT 0.0,
    errors_count INT DEFAULT 0,
    hints_count INT DEFAULT 0,
    idle_time_ms FLOAT DEFAULT 0.0,
    completed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_shape_rounds_session ON public.shape_game_rounds(session_id);

-- 3. Shape Game Attempts Table
CREATE TABLE IF NOT EXISTS public.shape_game_attempts (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL REFERENCES public.shape_game_sessions(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    shape_id VARCHAR(50) NOT NULL,
    difficulty_tier INT DEFAULT 1,
    target_slot_id VARCHAR(50),
    first_touch_latency_ms FLOAT DEFAULT 0.0,
    first_drag_start_ms FLOAT DEFAULT 0.0,
    solve_time_ms FLOAT DEFAULT 0.0,
    incorrect_attempts INT DEFAULT 0,
    hints_needed INT DEFAULT 0,
    solved_independently BOOLEAN DEFAULT TRUE,
    drag_hesitation_pauses INT DEFAULT 0,
    path_length_px FLOAT DEFAULT 0.0,
    straight_line_dist_px FLOAT DEFAULT 0.0,
    path_efficiency FLOAT DEFAULT 1.0,
    tremor_jitter_proxy FLOAT DEFAULT 0.0,
    confusion_choices TEXT DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_shape_attempts_session ON public.shape_game_attempts(session_id, shape_id);

-- 4. Shape Game Events Table (Client idempotency on event_id)
CREATE TABLE IF NOT EXISTS public.shape_game_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(64) UNIQUE NOT NULL,
    session_id VARCHAR(64) NOT NULL REFERENCES public.shape_game_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    round_number INT,
    shape_id VARCHAR(50),
    payload_json TEXT DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shape_events_session ON public.shape_game_events(session_id, event_type);

-- 5. Shape Game Session Summaries Table
CREATE TABLE IF NOT EXISTS public.shape_game_session_summaries (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(64) UNIQUE NOT NULL REFERENCES public.shape_game_sessions(id) ON DELETE CASCADE,
    patient_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    summary_json TEXT DEFAULT '{}',
    plain_language_narrative TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_shape_summaries_patient ON public.shape_game_session_summaries(patient_id);

-- 6. Shape Game Baselines Table
CREATE TABLE IF NOT EXISTS public.shape_game_baselines (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    computed_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    window_type VARCHAR(30) DEFAULT 'ROLLING_14_DAY',
    session_count INT DEFAULT 0,
    baseline_solve_time_ms FLOAT DEFAULT 3500.0,
    baseline_latency_ms FLOAT DEFAULT 950.0,
    baseline_independence_score FLOAT DEFAULT 85.0,
    baseline_accuracy_pct FLOAT DEFAULT 90.0,
    baseline_jitter_px FLOAT DEFAULT 12.0,
    solve_time_mad FLOAT DEFAULT 600.0,
    latency_mad FLOAT DEFAULT 150.0
);

CREATE INDEX IF NOT EXISTS idx_shape_baselines_patient ON public.shape_game_baselines(patient_id);

-- 7. Shape Game Alerts Table
CREATE TABLE IF NOT EXISTS public.shape_game_alerts (
    id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL,
    session_id VARCHAR(64),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_shape_alerts_patient ON public.shape_game_alerts(patient_id, acknowledged);

-- 8. Shape Game Audit Logs Table
CREATE TABLE IF NOT EXISTS public.shape_game_audit_logs (
    id SERIAL PRIMARY KEY,
    caregiver_id VARCHAR(100) NOT NULL,
    patient_id INT NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shape_audit_caregiver ON public.shape_game_audit_logs(caregiver_id, patient_id);
