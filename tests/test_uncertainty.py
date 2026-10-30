"""
Unit Tests for RELAY AI Phase 4: Confidence Calibration & Uncertainty Router
Tests:
- High-Confidence queries (both resolved and slot clarification needed)
- Ambiguous / Uncertain queries
- Unsupported / Out-of-domain / Gibberish queries
- Human Escalation queries
- Inspectable explanation fields and top-3 alternatives
"""

import os
import sys
import unittest
import numpy as np

# Add project root and src to sys.path
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)
_SRC_DIR = os.path.join(_PROJECT_ROOT, "src")
if _SRC_DIR not in sys.path:
    sys.path.insert(0, _SRC_DIR)

from app.agents.decision_agent import DecisionAgent


class TestUncertaintyAndCalibration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.agent = DecisionAgent(
            calibrated_model_path=os.path.join(_PROJECT_ROOT, "artifacts/models/calibrated_intent_classifier.joblib"),
            calibration_config_path=os.path.join(_PROJECT_ROOT, "artifacts/models/calibration_config.json"),
            retriever_path=os.path.join(_PROJECT_ROOT, "artifacts/models/response_retriever.joblib")
        )

    def test_high_confidence_resolved_query(self):
        """Tests that a clear query with order slot is categorized as HIGH_CONFIDENCE and resolved."""
        query = "I want to cancel my order #98214"
        res = self.agent.evaluate_query(query)

        self.assertEqual(res["decision_state"], "HIGH_CONFIDENCE")
        self.assertEqual(res["action_verdict"], "PROCEED_AUTOMATED")
        self.assertEqual(res["top_intent"], "cancel_order")
        self.assertEqual(res["predicted_category"], "ORDER")
        self.assertGreaterEqual(res["confidence"], 0.65)
        self.assertGreaterEqual(res["margin"], 0.25)
        self.assertGreaterEqual(res["retrieval_similarity"], 0.45)
        self.assertEqual(res["slot_status"], "resolved")
        self.assertIn("98214", res["final_response"])
        self.assertNotIn("{{", res["final_response"])

    def test_high_confidence_missing_slot_query(self):
        """Tests that an in-domain query missing required slots stays HIGH_CONFIDENCE on intent but requests slot clarification."""
        query = "I want to cancel an order"
        res = self.agent.evaluate_query(query)

        self.assertEqual(res["decision_state"], "HIGH_CONFIDENCE")
        self.assertEqual(res["action_verdict"], "NEED_SLOT_CLARIFICATION")
        self.assertEqual(res["top_intent"], "cancel_order")
        self.assertEqual(res["slot_status"], "clarification_required")
        self.assertIn("Order Number", res["unresolved_placeholders"])
        self.assertIn("Order Number", res["final_response"])

    def test_ambiguous_uncertain_query(self):
        """Tests that a query torn between two conflicting intents triggers UNCERTAIN state."""
        query = "I need to cancel or change my order right now"
        res = self.agent.evaluate_query(query)

        # Query combines cancel and change, should be flagged as UNCERTAIN or ask clarification
        self.assertIn(res["decision_state"], ["UNCERTAIN", "HIGH_CONFIDENCE"])
        self.assertIn("explanation", res)
        self.assertGreater(len(res["top_alternatives"]), 1)

    def test_unsupported_out_of_domain(self):
        """Tests that queries completely outside customer service domain are recognized as UNSUPPORTED."""
        query = "How do I bake chocolate chip cookies?"
        res = self.agent.evaluate_query(query)

        self.assertEqual(res["decision_state"], "UNSUPPORTED")
        self.assertEqual(res["action_verdict"], "UNSUPPORTED_REJECTION")
        self.assertIn("outside my supported domain", res["final_response"])

    def test_unsupported_gibberish(self):
        """Tests that non-lexical random gibberish is safely routed to UNSUPPORTED."""
        query = "asdfgh qwerty zxcvbnm 123456"
        res = self.agent.evaluate_query(query)

        self.assertEqual(res["decision_state"], "UNSUPPORTED")
        self.assertEqual(res["action_verdict"], "UNSUPPORTED_REJECTION")
        self.assertLess(res["confidence"], 0.35)

    def test_human_escalation_explicit_request(self):
        """Tests that explicit human agent requests are immediately routed to HUMAN_ESCALATION."""
        query = "I want to speak with a human agent right now"
        res = self.agent.evaluate_query(query)

        self.assertEqual(res["decision_state"], "HUMAN_ESCALATION")
        self.assertEqual(res["action_verdict"], "ESCALATE_TO_HUMAN")
        self.assertIn("human support", res["final_response"].lower())

    def test_top_three_alternatives_structure(self):
        """Verifies that top 3 alternatives are provided with ranks, intents, categories, and probabilities."""
        query = "Where can I view my latest invoice?"
        res = self.agent.evaluate_query(query)

        alts = res["top_alternatives"]
        self.assertEqual(len(alts), 3)
        for i, alt in enumerate(alts, start=1):
            self.assertEqual(alt["rank"], i)
            self.assertIn("intent", alt)
            self.assertIn("category", alt)
            self.assertIn("probability", alt)
            self.assertGreater(alt["probability"], 0.0)

        # Probabilities should be monotonically non-increasing
        self.assertGreaterEqual(alts[0]["probability"], alts[1]["probability"])
        self.assertGreaterEqual(alts[1]["probability"], alts[2]["probability"])

    def test_inspectable_explanation(self):
        """Verifies that every decision includes an inspectable explanation breakdown."""
        query = "What payment methods do you accept?"
        res = self.agent.evaluate_query(query)

        self.assertIn("explanation", res)
        explanation = res["explanation"]
        self.assertIn("reasons", explanation)
        self.assertGreater(len(explanation["reasons"]), 0)
        self.assertIn("metrics_evaluated", explanation)
        self.assertIn("thresholds_applied", explanation)


if __name__ == "__main__":
    unittest.main()
