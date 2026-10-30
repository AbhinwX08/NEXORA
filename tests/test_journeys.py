"""
RELAY AI — End-to-End User Journey Verification Suite
Tests all 13 core customer and auditor journeys defined in the audit plan.
"""

import unittest
import json
import os
import requests
import wave
import io

BASE_URL = "http://127.0.0.1:8000"

class TestUserJourneys(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Verify server is up
        try:
            res = requests.get(f"{BASE_URL}/api/health", timeout=3)
            assert res.status_code == 200
        except Exception as e:
            raise RuntimeError(f"Backend server is not running on {BASE_URL}: {e}")

    def test_journey_01_normal_resolution(self):
        """Journey 1: Normal customer-support query with order slot."""
        payload = {
            "query": "I want to cancel my order #98214",
            "customer_slots": {"Order Number": "98214"}
        }
        res = requests.post(f"{BASE_URL}/api/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["intent_prediction"], "cancel_order")
        self.assertEqual(data["category"], "ORDER")
        self.assertGreaterEqual(data["calibrated_confidence"], 0.70)
        self.assertIn("98214", data["final_response"])
        self.assertEqual(data["unresolved_placeholders"], [])
        self.assertIn("PROCEED_AUTOMATED", data["final_decision"])

    def test_journey_02_missing_information_clarification(self):
        """Journey 2: Query without required identifier triggers clarification."""
        payload = {"query": "I want to cancel my order"}
        res = requests.post(f"{BASE_URL}/api/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["intent_prediction"], "cancel_order")
        self.assertIn("NEED_SLOT_CLARIFICATION", data["final_decision"])
        self.assertIn("Order Number", data["unresolved_placeholders"])

    def test_journey_03_ambiguous_request(self):
        """Journey 3: Query with close alternative intents."""
        payload = {"query": "I want to make changes to my payment account invoice"}
        res = requests.post(f"{BASE_URL}/api/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("category", data)
        self.assertGreaterEqual(len(data["alternative_intents"]), 2)

    def test_journey_04_explicit_human_escalation(self):
        """Journey 4: Explicit escalation request triggers human handoff recommendation."""
        payload = {"query": "I need to speak to a real human agent right now"}
        res = requests.post(f"{BASE_URL}/api/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("ESCALATE_TO_HUMAN", data["final_decision"])
        self.assertTrue(
            "human support" in data["final_response"].lower() or
            "support specialist" in data["final_response"].lower()
        )

    def test_journey_05_product_documentation_assistant(self):
        """Journey 5: Technical query answered by verified product guide."""
        payload = {
            "message": "Explain how Platt sigmoid calibration works in RELAY AI",
            "customer_context": {"preferred_mode": "product_guide"}
        }
        res = requests.post(f"{BASE_URL}/api/assistant/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["routing_mode"], "product_guide")
        self.assertTrue(any("product_guide" in s.get("source_type", "") for s in data.get("sources", [])))
        self.assertTrue("calibration" in data["reply"].lower() or "sigmoid" in data["reply"].lower() or "platt" in data["reply"].lower())

    def test_journey_06_support_demo_multiturn(self):
        """Journey 6: Multi-turn support interaction with context persistence."""
        sess_id = f"test_turn_{os.urandom(4).hex()}"
        res1 = requests.post(f"{BASE_URL}/api/assistant/chat", json={
            "session_id": sess_id,
            "message": "Where is my order?",
            "customer_context": {"preferred_mode": "support_demo"}
        })
        self.assertEqual(res1.status_code, 200)
        data1 = res1.json()
        self.assertEqual(data1["session_id"], sess_id)

        # Follow up providing order number
        res2 = requests.post(f"{BASE_URL}/api/assistant/chat", json={
            "session_id": sess_id,
            "message": "Order #98214",
            "customer_context": {"preferred_mode": "support_demo"}
        })
        self.assertEqual(res2.status_code, 200)
        data2 = res2.json()
        self.assertEqual(data2["session_id"], sess_id)
        self.assertGreaterEqual(data2["turn_count"], 2)

    def test_journey_07_evidence_inspection(self):
        """Journey 7: Inspect resolution evidence record."""
        payload = {
            "query": "I want to cancel my order #98214",
            "customer_slots": {"Order Number": "98214"}
        }
        res = requests.post(f"{BASE_URL}/api/chat", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        # Verify trace contains all agents
        agent_names = [t["agent_name"] for t in data["complete_agent_trace"]]
        self.assertIn("A1_IntentAnalyst", agent_names)
        self.assertIn("A2_ResponseSpecialist", agent_names)
        self.assertIn("ValidationAgent", agent_names)

    def test_journey_08_decision_replay(self):
        """Journey 8: Compare base query and counterfactual perturbation."""
        payload = {
            "query": "Where is my package tracking info?",
            "modified_query": "Where is my package? I want to speak to a real human agent now!"
        }
        res = requests.post(f"{BASE_URL}/api/replay", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("comparison", data)
        self.assertIn("variant_a", data)
        self.assertIn("variant_b", data)
        self.assertFalse(data["comparison"]["decision_identical"])

    def test_journey_09_voice_interaction(self):
        """Journey 9: Speech synthesis and transcription."""
        res_speech = requests.post(f"{BASE_URL}/api/voice/speech", json={"text": "Order confirmation notice."})
        self.assertEqual(res_speech.status_code, 200)
        self.assertTrue(len(res_speech.content) > 100)
        # Check WAV header
        with wave.open(io.BytesIO(res_speech.content), 'rb') as wav:
            self.assertEqual(wav.getnchannels(), 1)
            self.assertEqual(wav.getsampwidth(), 2)

        # Transcribe
        files = {"audio": ("sample.wav", res_speech.content, "audio/wav")}
        res_stt = requests.post(f"{BASE_URL}/api/voice/transcribe", files=files)
        self.assertEqual(res_stt.status_code, 200)
        data_stt = res_stt.json()
        self.assertIn("transcription", data_stt)

    def test_journey_10_feedback_submission(self):
        """Journey 10: Feedback persistence into review queue."""
        payload = {
            "query": "delivery time query",
            "intent": "delivery_period",
            "final_decision": "RESOLVED",
            "rating": 5,
            "helpful": True,
            "comment": "Accurate and clear."
        }
        res = requests.post(f"{BASE_URL}/api/feedback", json=payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "success")

    def test_journey_11_dataset_exploration(self):
        """Journey 11: Dataset metadata exploration."""
        res = requests.get(f"{BASE_URL}/api/info")
        self.assertEqual(res.status_code, 200)
        data = res.json()["dataset_metadata"]
        self.assertEqual(data["training_records"], 18810)
        self.assertEqual(data["validation_records"], 4031)
        self.assertEqual(data["total_records"], 22841)
        self.assertEqual(data["unique_intents"], 27)
        self.assertEqual(data["unique_categories"], 11)

    def test_journey_12_model_evaluation_metrics(self):
        """Journey 12: Offline evaluation benchmarks."""
        res = requests.get(f"{BASE_URL}/api/info")
        self.assertEqual(res.status_code, 200)
        data = res.json()["offline_validation_benchmarks"]["intent_classification"]
        self.assertEqual(data["validation_samples"], 4031)
        self.assertEqual(data["accuracy"], 1.0)
        self.assertEqual(data["expected_calibration_error_ece"], 0.0119)
        self.assertEqual(data["brier_score"], 0.00054)

    def test_journey_13_failure_recovery_and_safety(self):
        """Journey 13: Controlled failure recovery and input rejection."""
        # Empty query
        res1 = requests.post(f"{BASE_URL}/api/chat", json={"query": ""})
        self.assertEqual(res1.status_code, 400)
        self.assertEqual(res1.json()["error_code"], "VALIDATION_ERROR")

        # Out-of-domain query
        res2 = requests.post(f"{BASE_URL}/api/chat", json={"query": "Can you give me a recipe for chocolate cake?"})
        self.assertEqual(res2.status_code, 200)
        self.assertIn("UNSUPPORTED", res2.json()["final_decision"])

if __name__ == "__main__":
    unittest.main()
