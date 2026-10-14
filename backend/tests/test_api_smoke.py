"""
Smoke tests for SmritiSetu FastAPI backend endpoints.
Verifies critical health, telemetry, locale, and IVR flows before refactoring.
"""

import unittest
from starlette.testclient import TestClient
from app.main import app


class BackendSmokeTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_check(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "healthy")
        self.assertIn("timestamp", data)

    def test_root_metadata(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "online")
        self.assertIn("platform", data)

    def test_locale_detect(self):
        res = self.client.get("/api/v1/locale/detect")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "success")
        self.assertIn("activeLocale", data.get("data", {}))

    def test_locale_supported(self):
        res = self.client.get("/api/v1/locale/supported")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "success")
        self.assertGreater(len(data.get("states", [])), 0)

    def test_telemetry_drift_calculation(self):
        res = self.client.get("/api/v1/telemetry/drift/1")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("cognitive_drift_percent", data)
        self.assertIn("baseline_latency_ms", data)
        self.assertIn("current_mean_latency_ms", data)

    def test_telemetry_analytics(self):
        res = self.client.get("/api/v1/telemetry/analytics/1?days=7")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("timeline", data)
        self.assertIsInstance(data["timeline"], list)

    def test_telemetry_uuid_patient_id(self):
        uuid_str = "793802bc-1943-46dd-a80f-01f4941c28e7"
        res_drift = self.client.get(f"/api/v1/telemetry/drift/{uuid_str}")
        self.assertEqual(res_drift.status_code, 200)
        self.assertEqual(res_drift.json().get("patient_id"), uuid_str)

        res_analytics = self.client.get(f"/api/v1/telemetry/analytics/{uuid_str}?days=30")
        self.assertEqual(res_analytics.status_code, 200)
        self.assertEqual(res_analytics.json().get("patient_id"), uuid_str)

    def test_ivr_simulation(self):
        payload = {
            "patient_id": 1,
            "q1": "1",
            "q2": "1",
            "q3": "1",
            "call_sid": "SMOKE-TEST-CALL"
        }
        res = self.client.post("/api/v1/ivr/simulate", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data.get("status"), "success")
        self.assertEqual(data.get("composite_score"), 100.0)

    def test_tts_fallback_mode(self):
        payload = {
            "text": "Namaskar",
            "language": "or",
            "gender": "female"
        }
        res = self.client.post("/api/v1/tts", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("status", data)
        self.assertIn(data["status"], ["success", "fallback"])


if __name__ == "__main__":
    unittest.main()
