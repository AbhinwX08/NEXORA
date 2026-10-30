"""
Unit and Integration Tests for RELAY AI Phase 5: Multi-Agent System Integration
Tests end-to-end workflow, Pydantic contracts, agent traces, failure handling,
and boundary conditions across A1 (Intent Analyst), A2 (Response Specialist),
Validation Agent, and Support Orchestrator.
"""

import os
import sys
import unittest
from typing import Dict, Any

# Add project root and src to sys.path
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)
_SRC_DIR = os.path.join(_PROJECT_ROOT, "src")
if _SRC_DIR not in sys.path:
    sys.path.insert(0, _SRC_DIR)

from app.schemas.agent_models import (
    AgentStatus,
    AgentTrace,
    A1IntentHandoff,
    A2RetrievalHandoff,
    ValidationHandoff,
    OrchestratorResult,
)
from app.orchestration.support_orchestrator import SupportOrchestrator
from app.agents.intent_agent import IntentAnalystAgent
from app.agents.response_agent import ResponseAgent
from app.agents.validation_agent import ValidationAgent


class TestMultiAgentSystem(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.orchestrator = SupportOrchestrator()

    def test_e2e_high_confidence_resolved_flow(self):
        """Tests complete pipeline on an in-domain query with slot provided."""
        query = "I want to cancel my order #98214"
        result = self.orchestrator.process_query(query)

        self.assertIsInstance(result, OrchestratorResult)
        self.assertEqual(result.original_customer_query, query)
        self.assertEqual(result.intent_prediction, "cancel_order")
        self.assertEqual(result.category, "ORDER")
        self.assertGreaterEqual(result.calibrated_confidence, 0.65)
        self.assertGreaterEqual(result.margin, 0.25)
        self.assertIn("HIGH_CONFIDENCE", result.final_decision)
        self.assertIn("PROCEED_AUTOMATED", result.final_decision)
        self.assertEqual(result.placeholder_status, "resolved")
        self.assertIn("98214", result.final_response)
        self.assertNotIn("{{", result.final_response)

        # Trace check
        self.assertGreaterEqual(len(result.complete_agent_trace), 3)
        agent_names = [t.agent_name for t in result.complete_agent_trace]
        self.assertIn("A1_IntentAnalyst", agent_names)
        self.assertIn("A2_ResponseSpecialist", agent_names)
        self.assertIn("ValidationAgent", agent_names)

        for trace in result.complete_agent_trace:
            self.assertIsInstance(trace, AgentTrace)
            self.assertIn(trace.processing_status, [AgentStatus.SUCCESS, AgentStatus.CLARIFICATION_REQUIRED])
            self.assertGreaterEqual(trace.duration_ms, 0.0)
            self.assertTrue(len(trace.decision_reason) > 0)

    def test_e2e_slot_clarification_flow(self):
        """Tests that missing parameters trigger clarification rather than fabrication."""
        query = "I want to cancel an order"
        result = self.orchestrator.process_query(query)

        self.assertIsInstance(result, OrchestratorResult)
        self.assertEqual(result.intent_prediction, "cancel_order")
        self.assertIn("NEED_SLOT_CLARIFICATION", result.final_decision)
        self.assertEqual(result.placeholder_status, "clarification_required")
        self.assertIn("Order Number", result.unresolved_placeholders)
        self.assertIn("Order Number", result.final_response)

    def test_e2e_human_escalation_flow(self):
        """Tests immediate escalation routing when human assistance is requested."""
        query = "I need to talk to a live human representative right now"
        result = self.orchestrator.process_query(query)

        self.assertIsInstance(result, OrchestratorResult)
        self.assertIn("HUMAN_ESCALATION", result.final_decision)
        self.assertIn("human support", result.final_response.lower())

        # Check A2 was skipped
        a2_trace = next(t for t in result.complete_agent_trace if t.agent_name == "A2_ResponseSpecialist")
        self.assertEqual(a2_trace.processing_status, AgentStatus.SKIPPED)

    def test_e2e_unsupported_out_of_domain_flow(self):
        """Tests domain rejection for out-of-domain queries."""
        query = "What is the weather in London today?"
        result = self.orchestrator.process_query(query)

        self.assertIsInstance(result, OrchestratorResult)
        self.assertIn("UNSUPPORTED", result.final_decision)
        self.assertIn("outside my supported domain", result.final_response)

    def test_failure_handling_a1_unavailable(self):
        """Tests safe service error response when A1 Intent Analyst is unavailable."""
        broken_orchestrator = SupportOrchestrator(
            intent_model_path="artifacts/models/non_existent_model.joblib"
        )
        result = broken_orchestrator.process_query("I want to track my order")

        self.assertIsInstance(result, OrchestratorResult)
        self.assertIn("SERVICE_ERROR", result.final_decision)
        self.assertIn("technical difficulties", result.final_response)
        self.assertEqual(result.complete_agent_trace[0].processing_status, AgentStatus.ERROR)

    def test_failure_handling_a2_unavailable(self):
        """Tests safe graceful degradation when A2 retrieval engine is unavailable."""
        broken_orchestrator = SupportOrchestrator(
            retriever_path="artifacts/models/non_existent_retriever.joblib"
        )
        result = broken_orchestrator.process_query("I want to track my order #1234")

        self.assertIsInstance(result, OrchestratorResult)
        self.assertIn("SERVICE_ERROR", result.final_decision)
        self.assertIn("temporarily offline", result.final_response)

    def test_typed_pydantic_contracts_and_serialization(self):
        """Verifies that all models serialize cleanly to JSON and conform to typed schema."""
        query = "Where can I view my invoice #9812?"
        result = self.orchestrator.process_query(query)

        json_str = result.model_dump_json()
        self.assertIsInstance(json_str, str)
        self.assertIn("invoice", json_str.lower())
        self.assertIn("complete_agent_trace", json_str)
        self.assertIn("validation_checks", json_str)


if __name__ == "__main__":
    unittest.main()
