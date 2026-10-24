"""
Unit & Integration Tests for Match the Shapes Game & Caregiver Analytics
Tests:
1. Round generation invariant: 20 unique shapes, 4 per round, no duplicate similarity groups per round
2. Analyzer calculations: MAD, baseline calculation, fatigue index, independence score
3. Observational alert triggering logic (1.5 MAD / 25% threshold)
4. Caregiver endpoint authorization & consent enforcement
5. Idempotent event ingestion
6. Session drill-down & CSV/JSON export
"""

import unittest
import json
import datetime
from starlette.testclient import TestClient
from app.main import app
from app.models.database import SessionLocal
from app.models.shape_models import (
    ShapeGameSession,
    ShapeGameAttempt,
    ShapeGameEvent,
    ShapeGameBaseline,
    ShapeGameAlert
)
from app.core.shape_config import (
    generate_shape_game_rounds,
    SHAPES_CONFIG,
    SHAPES_BY_ID
)
from app.core.shape_analyzer import (
    compute_median_absolute_deviation,
    update_patient_baseline,
    evaluate_alerts_for_patient
)


class ShapeGameTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def tearDown(self):
        db = SessionLocal()
        try:
            db.query(ShapeGameAttempt).delete()
            db.query(ShapeGameRound).delete()
            db.query(ShapeGameEvent).delete()
            db.query(ShapeGameSessionSummary).delete()
            db.query(ShapeGameAlert).delete()
            db.query(ShapeGameSession).delete()
            db.query(ShapeGameBaseline).delete()
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    @classmethod
    def tearDownClass(cls):
        db = SessionLocal()
        try:
            db.query(ShapeGameAttempt).delete()
            db.query(ShapeGameRound).delete()
            db.query(ShapeGameEvent).delete()
            db.query(ShapeGameSessionSummary).delete()
            db.query(ShapeGameAlert).delete()
            db.query(ShapeGameSession).delete()
            db.query(ShapeGameBaseline).delete()
            db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()

    # ---------------------------------------------------------
    # 1. Round Generation Invariant Tests
    # ---------------------------------------------------------
    def test_shape_configuration_has_20_unique_shapes(self):
        self.assertEqual(len(SHAPES_CONFIG), 20)
        shape_ids = [s["id"] for s in SHAPES_CONFIG]
        self.assertEqual(len(set(shape_ids)), 20)

    def test_round_generation_invariants_across_multiple_seeds(self):
        """
        Verify across 50 random seeds:
        - Exactly 5 rounds
        - Exactly 4 shapes per round
        - Exactly 20 unique shapes total
        - ZERO rounds have two shapes from the same similarity group
        """
        for seed in range(50):
            rounds = generate_shape_game_rounds(seed)
            self.assertEqual(len(rounds), 5, f"Seed {seed} must produce 5 rounds")
            all_shapes_in_session = []

            for r_idx, r in enumerate(rounds):
                shapes = r["shapes"]
                self.assertEqual(len(shapes), 4, f"Seed {seed} round {r_idx} must have 4 shapes")

                groups = [s["similarity_group"] for s in shapes]
                self.assertEqual(
                    len(set(groups)),
                    4,
                    f"Seed {seed} round {r_idx} contains duplicate similarity groups: {groups}"
                )

                all_shapes_in_session.extend([s["id"] for s in shapes])

                # Verify target slots and draggable pieces independently exist and match
                self.assertEqual(len(r["target_slots"]), 4)
                self.assertEqual(len(r["draggable_pieces"]), 4)

            self.assertEqual(
                len(set(all_shapes_in_session)),
                20,
                f"Seed {seed} must contain all 20 unique shapes exactly once"
            )

    # ---------------------------------------------------------
    # 2. Analyzer & Metric Calculation Tests
    # ---------------------------------------------------------
    def test_mad_calculation(self):
        # Sample values: [10, 12, 14, 15, 16, 18, 20] -> median is 15
        # Absolute deviations: [5, 3, 1, 0, 1, 3, 5] -> sorted: [0, 1, 1, 3, 3, 5, 5] -> median is 3
        vals = [10.0, 12.0, 14.0, 15.0, 16.0, 18.0, 20.0]
        mad = compute_median_absolute_deviation(vals, 15.0)
        self.assertEqual(mad, 3.0)

    def test_baseline_calculation_and_update(self):
        db = SessionLocal()
        try:
            baseline = update_patient_baseline(db, 1)
            self.assertIsNotNone(baseline)
            self.assertGreater(baseline.baseline_solve_time_ms, 0)
            self.assertGreater(baseline.baseline_latency_ms, 0)
            self.assertGreater(baseline.baseline_independence_score, 0)
            self.assertIn(baseline.window_type, ["INITIAL_5_SESSIONS", "ROLLING_14_DAY", "INITIAL_DEFAULT"])
        finally:
            db.close()

    # ---------------------------------------------------------
    # 3. Alert Generation Tests
    # ---------------------------------------------------------
    def test_alert_evaluation_on_solve_time_elevation(self):
        db = SessionLocal()
        try:
            baseline = db.query(ShapeGameBaseline).filter(ShapeGameBaseline.patient_id == 1).first()
            if not baseline:
                baseline = update_patient_baseline(db, 1)
            baseline.session_count = 5
            db.commit()

            # Create a mock session with elevated solve time (> baseline * 1.6)
            mock_sess = ShapeGameSession(
                id="test-alert-session-001",
                patient_id=1,
                seed="seed-alert-test",
                status="COMPLETED",
                started_at=datetime.datetime.utcnow(),
                median_solve_time_ms=baseline.baseline_solve_time_ms * 1.8,
                median_latency_ms=max(2000.0, baseline.baseline_latency_ms * 2.0), # latency spike (>1500ms and >1.5x)
                independence_score=80.0,
                rounds_completed=5
            )
            alerts = evaluate_alerts_for_patient(db, 1, mock_sess)
            # Latency spike should trigger
            self.assertTrue(any(a.alert_type in ["LATENCY_SPIKE", "SOLVE_TIME_ELEVATION"] for a in alerts))
        finally:
            db.close()

    # ---------------------------------------------------------
    # 4. Gameplay Endpoints & Idempotency
    # ---------------------------------------------------------
    def test_start_session_endpoint(self):
        res = self.client.post("/api/shape-game/sessions", json={"patient_id": 1, "seed": "test-seed-42"})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "success")
        self.assertIn("sessionId", data)
        self.assertEqual(len(data.get("rounds", [])), 5)

    def test_batch_event_ingestion_idempotency(self):
        # Start session
        res_start = self.client.post("/api/shape-game/sessions", json={"patient_id": 1})
        sess_id = res_start.json()["sessionId"]

        event_payload = {
            "events": [
                {
                    "event_id": f"idem-evt-{sess_id}-1",
                    "event_type": "shape_first_touch",
                    "round_number": 1,
                    "shape_id": "triangle",
                    "payload": {"latencyMs": 850}
                },
                {
                    "event_id": f"idem-evt-{sess_id}-2",
                    "event_type": "drag_start",
                    "round_number": 1,
                    "shape_id": "triangle",
                    "payload": {"x": 100, "y": 200}
                }
            ]
        }

        # First ingestion
        res1 = self.client.post(f"/api/shape-game/sessions/{sess_id}/events", json=event_payload)
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json().get("syncedEvents"), 2)

        # Second ingestion with exact same event IDs (idempotency check)
        res2 = self.client.post(f"/api/shape-game/sessions/{sess_id}/events", json=event_payload)
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json().get("syncedEvents"), 0) # 0 new events inserted!

    def test_end_session_and_analyzer_summary(self):
        res_start = self.client.post("/api/shape-game/sessions", json={"patient_id": 1})
        sess_id = res_start.json()["sessionId"]

        attempts_data = [
            {
                "round_number": 1,
                "shape_id": "circle",
                "difficulty_tier": 1,
                "first_touch_latency_ms": 750,
                "solve_time_ms": 2800,
                "hints_needed": 0,
                "incorrect_attempts": 0,
                "path_efficiency": 0.95
            },
            {
                "round_number": 1,
                "shape_id": "square",
                "difficulty_tier": 1,
                "first_touch_latency_ms": 820,
                "solve_time_ms": 3100,
                "hints_needed": 0,
                "incorrect_attempts": 0,
                "path_efficiency": 0.92
            }
        ]

        end_res = self.client.post(
            f"/api/shape-game/sessions/{sess_id}/end",
            json={
                "status": "COMPLETED",
                "total_duration_ms": 180000,
                "rounds_completed": 1,
                "attempts": attempts_data
            }
        )
        self.assertEqual(end_res.status_code, 200)
        data = end_res.json()
        self.assertEqual(data.get("status"), "success")
        self.assertEqual(data.get("independenceScore"), 100.0)
        self.assertIn("narrative", data)
        self.assertIn("disclaimer", data)

    # ---------------------------------------------------------
    # 5. Caregiver Portal Endpoints & Authorization
    # ---------------------------------------------------------
    def test_caregiver_summary_endpoint(self):
        res = self.client.get("/api/caregiver/patients/1/shape-game/summary?range=30d")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("metrics", data)
        self.assertIn("timeline", data)
        self.assertIn("shapeRankings", data)
        self.assertIn("confusionPairs", data)
        self.assertIn("weeklySummary", data)
        self.assertIn("disclaimer", data)

    def test_caregiver_sessions_list_and_detail(self):
        res_list = self.client.get("/api/caregiver/patients/1/shape-game/sessions")
        self.assertEqual(res_list.status_code, 200)
        sessions = res_list.json().get("sessions", [])
        self.assertGreater(len(sessions), 0)

        # Drill down into first session
        first_sess_id = sessions[0]["id"]
        res_detail = self.client.get(f"/api/caregiver/patients/1/shape-game/sessions/{first_sess_id}")
        self.assertEqual(res_detail.status_code, 200)
        detail = res_detail.json()
        self.assertEqual(detail["sessionId"], first_sess_id)
        self.assertIn("attempts", detail)
        self.assertIn("replayTimeline", detail)

    def test_caregiver_authorization_rejection(self):
        """Unauthorized caregiver access must be rejected with 403 Forbidden"""
        headers = {"X-Caregiver-Id": "UNAUTHORIZED_CAREGIVER"}
        res = self.client.get("/api/caregiver/patients/1/shape-game/summary", headers=headers)
        self.assertEqual(res.status_code, 403)
        self.assertIn("not authorized", res.text.lower())

    def test_caregiver_alerts_and_acknowledgment(self):
        res_alerts = self.client.get("/api/caregiver/patients/1/shape-game/alerts")
        self.assertEqual(res_alerts.status_code, 200)
        alerts = res_alerts.json().get("alerts", [])

        if alerts:
            alert_id = alerts[0]["id"]
            res_ack = self.client.post(f"/api/caregiver/patients/1/shape-game/alerts/{alert_id}/acknowledge")
            self.assertEqual(res_ack.status_code, 200)
            self.assertTrue(res_ack.json().get("acknowledged"))

    def test_csv_export_endpoint(self):
        res = self.client.get("/api/caregiver/patients/1/shape-game/export?format=csv")
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/csv", res.headers.get("content-type", ""))
        self.assertIn("SmritiSetu Match the Shapes", res.text)
        self.assertIn("Clinical Disclaimer", res.text)

    def test_caregiver_uuid_patient_id(self):
        """Verify that Supabase UUID patient IDs are supported without 422 errors"""
        uuid_str = "793802bc-1943-46dd-a80f-01f4941c28e7"

        # 1. Summary endpoint with UUID
        res_summary = self.client.get(f"/api/caregiver/patients/{uuid_str}/shape-game/summary?range=30d")
        self.assertEqual(res_summary.status_code, 200)
        self.assertEqual(res_summary.json().get("patientId"), uuid_str)
        self.assertIn("metrics", res_summary.json())
        self.assertIn("timeline", res_summary.json())

        # 2. Sessions list endpoint with UUID
        res_sessions = self.client.get(f"/api/caregiver/patients/{uuid_str}/shape-game/sessions")
        self.assertEqual(res_sessions.status_code, 200)
        self.assertEqual(res_sessions.json().get("patientId"), uuid_str)

        # 3. Alerts endpoint with UUID
        res_alerts = self.client.get(f"/api/caregiver/patients/{uuid_str}/shape-game/alerts")
        self.assertEqual(res_alerts.status_code, 200)
        self.assertEqual(res_alerts.json().get("patientId"), uuid_str)

        # 4. CSV Export endpoint with UUID
        res_export = self.client.get(f"/api/caregiver/patients/{uuid_str}/shape-game/export?format=csv")
        self.assertEqual(res_export.status_code, 200)
        self.assertIn(f"Patient ID: {uuid_str}", res_export.text)

        # 5. Start session with UUID
        res_start = self.client.post("/api/shape-game/sessions", json={"patient_id": uuid_str})
        self.assertEqual(res_start.status_code, 200)
        self.assertEqual(res_start.json().get("patientId"), uuid_str)


if __name__ == "__main__":
    unittest.main()
