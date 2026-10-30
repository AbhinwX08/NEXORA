"""
Tests for RELAY AI Flask API (app.api)
Covers health, info, chat, intent endpoints, request validation, CORS, error handling, and contracts.
"""

import os
import sys
import json
import unittest

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)
_SRC_DIR = os.path.join(_PROJECT_ROOT, "src")
if _SRC_DIR not in sys.path:
    sys.path.insert(0, _SRC_DIR)

from app.api import app


class TestFlaskAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        app.testing = True
        cls.client = app.test_client()

    def test_health_endpoint(self):
        """GET /api/health returns 200 with runtime and file readiness."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["status"], "healthy")
        self.assertIn("components", data)
        self.assertEqual(data["components"]["api_server"], "running")
        self.assertEqual(data["components"]["intent_engine_runtime"], "ready")
        self.assertEqual(data["components"]["retrieval_engine_runtime"], "ready")

    def test_info_endpoint(self):
        """GET /api/info returns truthful static metadata and offline metrics."""
        res = self.client.get("/api/info")
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["system"], "RELAY AI")
        self.assertEqual(data["dataset_metadata"]["training_records"], 18810)
        self.assertEqual(data["dataset_metadata"]["validation_records"], 4031)
        self.assertEqual(data["dataset_metadata"]["total_records"], 22841)
        self.assertEqual(data["dataset_metadata"]["unique_intents"], 27)
        self.assertEqual(data["dataset_metadata"]["unique_categories"], 11)
        self.assertIn("ORDER", data["dataset_metadata"]["categories"])
        self.assertIn("offline_validation_benchmarks", data)

    def test_chat_endpoint_valid_query(self):
        """POST /api/chat executes full multi-agent flow with real trace."""
        payload = {"query": "I want to cancel my order #98214"}
        res = self.client.post(
            "/api/chat",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["intent_prediction"], "cancel_order")
        self.assertEqual(data["category"], "ORDER")
        self.assertGreaterEqual(data["calibrated_confidence"], 0.65)
        self.assertIn("PROCEED_AUTOMATED", data["final_decision"])
        self.assertIn("98214", data["final_response"])
        self.assertNotIn("{{", data["final_response"])
        self.assertGreaterEqual(len(data["complete_agent_trace"]), 3)
        self.assertGreaterEqual(data["total_duration_ms"], 0.0)

    def test_chat_endpoint_with_customer_slots(self):
        """POST /api/chat honors explicit customer_slots parameter."""
        payload = {
            "query": "I would like a refund",
            "customer_slots": {"Order Number": "998877", "Refund Amount": "45.00"}
        }
        res = self.client.post(
            "/api/chat",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn(data["intent_prediction"], ["get_refund", "check_refund_policy", "track_refund"])

    def test_chat_endpoint_empty_query_rejected(self):
        """POST /api/chat rejects empty query with 400."""
        payload = {"query": "   "}
        res = self.client.post(
            "/api/chat",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 400)
        data = json.loads(res.data)
        self.assertEqual(data["status"], "error")

    def test_chat_endpoint_invalid_json(self):
        """POST /api/chat rejects malformed JSON with 400."""
        res = self.client.post(
            "/api/chat",
            data="not-valid-json{",
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 400)

    def test_chat_endpoint_oversized_query(self):
        """POST /api/chat rejects queries exceeding 2000 chars."""
        payload = {"query": "cancel " * 500}  # ~3500 chars
        res = self.client.post(
            "/api/chat",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 400)

    def test_intent_endpoint_valid_query(self):
        """POST /api/intent runs fast A1 calibrated classification."""
        payload = {"query": "Where can I find my invoice?"}
        res = self.client.post(
            "/api/intent",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn(data["top_intent"], ["get_invoice", "check_invoice"])
        self.assertEqual(data["category"], "INVOICE")
        self.assertGreaterEqual(data["confidence"], 0.50)
        self.assertGreaterEqual(len(data["alternatives"]), 1)

    def test_chat_endpoint_invalid_customer_slots(self):
        """POST /api/chat rejects malformed customer_slots with 400."""
        payload = {
            "query": "I want to cancel",
            "customer_slots": "not-a-dict"
        }
        res = self.client.post(
            "/api/chat",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 400)
        data = json.loads(res.data)
        self.assertEqual(data["status"], "error")

    def test_chat_endpoint_slot_clarification(self):
        """POST /api/chat triggers clarification when essential slot is missing."""
        payload = {"query": "I want to cancel my order please"}
        res = self.client.post(
            "/api/chat",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["intent_prediction"], "cancel_order")
        self.assertIn("NEED_SLOT_CLARIFICATION", data["final_decision"])
        self.assertEqual(data["placeholder_status"], "clarification_required")
        self.assertIn("Order Number", data["unresolved_placeholders"])

    def test_chat_endpoint_human_escalation(self):
        """POST /api/chat routes to human escalation when requested."""
        payload = {"query": "I need to speak to a real human agent right now"}
        res = self.client.post(
            "/api/chat",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("ESCALATE_TO_HUMAN", data["final_decision"])
        self.assertIn("human support", data["final_response"].lower())

    def test_chat_endpoint_unsupported_query(self):
        """POST /api/chat triggers out-of-domain rejection for non-support queries."""
        payload = {"query": "What is the weather in London today?"}
        res = self.client.post(
            "/api/chat",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("UNSUPPORTED", data["final_decision"])

    def test_chat_endpoint_ambiguous_query(self):
        """POST /api/chat triggers clarification for borderline confidence queries."""
        payload = {"query": "How do I bake a chocolate cake?"}
        res = self.client.post(
            "/api/chat",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("AMBIGUOUS_INTENT_CLARIFICATION", data["final_decision"])

    def test_cors_preflight(self):
        """OPTIONS preflight responds with 204 and CORS headers."""
        res = self.client.open(
            "/api/chat",
            method="OPTIONS",
            headers={"Origin": "http://localhost:3000"}
        )
        self.assertEqual(res.status_code, 204)
        self.assertEqual(res.headers.get("Access-Control-Allow-Origin"), "http://localhost:3000")

    def test_request_id_propagation(self):
        """Incoming X-Request-ID is validated and returned in response headers and errors."""
        res = self.client.get(
            "/api/health",
            headers={"X-Request-ID": "test-trace-id-1234"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("X-Request-ID"), "test-trace-id-1234")

    def test_not_found_standard_error(self):
        """404 errors return canonical error format defined in relay-api-v1 contract."""
        res = self.client.get("/api/nonexistent-route")
        self.assertEqual(res.status_code, 404)
        data = json.loads(res.data)
        self.assertEqual(data["status"], "error")
        self.assertEqual(data["error_code"], "NOT_FOUND")
        self.assertIn("request_id", data)
        self.assertIn("timestamp", data)

    def test_model_unavailable_degraded_state(self):
        """When orchestrator fails to initialize, /api/chat returns 503 MODEL_UNAVAILABLE."""
        from unittest.mock import patch
        with patch("app.api.get_orchestrator", side_effect=RuntimeError("Model files not found")):
            res = self.client.post(
                "/api/chat",
                data=json.dumps({"query": "Where is my order?"}),
                content_type="application/json"
            )
            self.assertEqual(res.status_code, 503)
            data = json.loads(res.data)
            self.assertEqual(data["status"], "error")
            self.assertEqual(data["error_code"], "MODEL_UNAVAILABLE")
            self.assertIn("unavailable", data["error"].lower())

    def test_unhandled_exception_safe_error(self):
        """Unhandled exceptions in pipeline return 500 without leaking stack traces."""
        from unittest.mock import patch, MagicMock
        mock_orch = MagicMock()
        mock_orch.process_query.side_effect = Exception("Simulated fatal database drop")
        with patch("app.api.get_orchestrator", return_value=mock_orch):
            res = self.client.post(
                "/api/chat",
                data=json.dumps({"query": "Where is my order?"}),
                content_type="application/json"
            )
            self.assertEqual(res.status_code, 500)
            data = json.loads(res.data)
            self.assertEqual(data["status"], "error")
            self.assertEqual(data["error_code"], "INTERNAL_ERROR")
            # Ensure internal message details are NOT leaked to the client
            self.assertNotIn("Simulated fatal database drop", data["error"])
            self.assertIn("request_id", data)

    def test_assistant_chat_smalltalk(self):
        """POST /api/assistant/chat routes greetings without LLM overhead."""
        payload = {"message": "Hello there, good morning!"}
        res = self.client.post(
            "/api/assistant/chat",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["routing_mode"], "deterministic_smalltalk")
        self.assertEqual(data["intent_detected"], "greeting")
        self.assertIn("session_id", data)

    def test_assistant_chat_support_query_with_session(self):
        """POST /api/assistant/chat processes support demo queries with multi-turn memory."""
        session_id = "test_sess_001"
        payload = {
            "session_id": session_id,
            "message": "I want to cancel my order #98214"
        }
        res = self.client.post(
            "/api/assistant/chat",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["session_id"], session_id)
        self.assertEqual(data["routing_mode"], "support_demo")
        self.assertEqual(data["intent_detected"], "cancel_order")
        self.assertIn("98214", data["reply"])

    def test_voice_transcribe(self):
        """POST /api/voice/transcribe returns valid transcription metadata."""
        import io
        import wave
        # Generate dummy 1-second WAV
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(16000)
            wf.writeframes(b"\x00" * 32000)
        audio_data = buf.getvalue()

        res = self.client.post(
            "/api/voice/transcribe",
            data={"audio": (io.BytesIO(audio_data), "test.wav", "audio/wav")},
            content_type="multipart/form-data"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("transcription", data)
        self.assertGreater(data["audio_duration_seconds"], 0)

    def test_voice_speech(self):
        """POST /api/voice/speech synthesizes valid playable WAV audio stream."""
        payload = {"text": "Your order has been verified and cancelled."}
        res = self.client.post(
            "/api/voice/speech",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.headers.get("Content-Type"), "audio/wav")
        self.assertTrue(len(res.data) > 100)
        self.assertTrue(res.data.startswith(b"RIFF"))

    def test_feedback_intake(self):
        """POST /api/feedback validates and records customer ratings."""
        payload = {
            "query": "How do I cancel my order?",
            "intent": "cancel_order",
            "final_decision": "RESOLVED_RESPONSE",
            "rating": 5,
            "helpful": True,
            "comment": "Quick and helpful."
        }
        res = self.client.post(
            "/api/feedback",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertEqual(data["status"], "success")
        self.assertIn("feedback_id", data)

        # Test invalid rating out of bounds
        payload["rating"] = 10
        bad_res = self.client.post(
            "/api/feedback",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(bad_res.status_code, 400)

    def test_decision_replay(self):
        """POST /api/replay executes actual multi-agent pipeline and computes deltas."""
        payload = {
            "query": "I want to cancel my order #98214",
            "modified_query": "I want to cancel my order"
        }
        res = self.client.post(
            "/api/replay",
            data=json.dumps(payload),
            content_type="application/json"
        )
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data)
        self.assertIn("variant_a", data)
        self.assertIn("variant_b", data)
        self.assertIn("comparison", data)
        self.assertTrue(data["comparison"]["intent_match"])
        # Variant A had order number -> resolved, Variant B lacked order number -> clarification
        self.assertFalse(data["comparison"]["decision_identical"])

    def test_entity_disambiguation(self):
        """Entity extraction disambiguates order numbers from invoice numbers."""
        from app.agents.response_agent import ResponseAgent
        agent = ResponseAgent()

        slots_order = agent.extract_slots_from_query("Where is my order #98214?")
        self.assertEqual(slots_order.get("Order Number"), "98214")
        self.assertIsNone(slots_order.get("Invoice Number"))

        slots_inv = agent.extract_slots_from_query("Where is my invoice #4412?")
        self.assertEqual(slots_inv.get("Invoice Number"), "4412")
        self.assertIsNone(slots_inv.get("Order Number"))




if __name__ == "__main__":
    unittest.main()
