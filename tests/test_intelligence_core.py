"""
RELAY AI — Intelligence Core Unit & Integration Tests
Verifies:
1. Agent Disagreement & Conflict Resolution Engine (all 5 conflict types)
2. Dynamic Agent Team Formation & Capability Registry (all 6 workflows, mandatory gates)
3. Self-Improving Knowledge Gap, Clustering, Grounded FAQ Studio, Review, Version Rollback, and Regression Benchmark
4. Dedicated Intelligence Core REST API Endpoints
"""

import unittest
import os
import sys
import json

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

from app.schemas.conflict_models import ConflictType, ConflictSeverity, ResolutionAction
from app.schemas.workflow_models import WorkflowType, CapabilityStatus
from app.schemas.knowledge_models import KnowledgeGapType, FAQReviewStatus
from app.orchestration.conflict_engine import ConflictResolutionEngine
from app.orchestration.capability_registry import CapabilityRegistry
from app.orchestration.workflow_planner import WorkflowPlanner
from app.orchestration.workflow_executor import WorkflowExecutor
from app.services.knowledge_intelligence_service import KnowledgeIntelligenceService
from app.api import app


class TestAgentConflictEngine(unittest.TestCase):
    """Verifies deterministic conflict detection and evidence-based arbitration."""

    def setUp(self):
        self.engine = ConflictResolutionEngine()

    def test_conflict_slot_disagreement(self):
        """Detects contradiction between query slot and established session memory."""
        session_slots = {"order_id": "11223"}
        a2_output = {"resolved_slots": {"order_id": "99887"}}
        rec = self.engine.detect_and_resolve(
            trace_id="tr_slot_test",
            query="Cancel order #99887",
            a1_output=None,
            a2_output=a2_output,
            validation_output=None,
            session_slots=session_slots
        )
        self.assertIsNotNone(rec)
        self.assertEqual(rec.conflict_type, ConflictType.SLOT_DISAGREEMENT)
        self.assertEqual(rec.resolution_action, ResolutionAction.CLARIFICATION_REQUIRED)
        self.assertEqual(rec.severity, ConflictSeverity.HIGH)

    def test_conflict_intent_disagreement(self):
        """Detects borderline intent margin across different business categories."""
        a1_output = {
            "calibrated_confidence": 0.52,
            "margin": 0.04,
            "top_intent": "cancel_order",
            "category": "CANCEL",
            "alternatives": [
                {"rank": 1, "intent": "cancel_order", "category": "CANCEL", "probability": 0.52},
                {"rank": 2, "intent": "refund_request", "category": "REFUND", "probability": 0.48}
            ]
        }
        rec = self.engine.detect_and_resolve(
            trace_id="tr_intent_test",
            query="I want to cancel and get my money back",
            a1_output=a1_output,
            a2_output=None,
            validation_output=None
        )
        self.assertIsNotNone(rec)
        self.assertEqual(rec.conflict_type, ConflictType.INTENT_DISAGREEMENT)
        self.assertEqual(rec.resolution_action, ResolutionAction.CLARIFICATION_REQUIRED)

    def test_conflict_evidence_vs_response_disagreement(self):
        """Rejects affirmative action verbs when required transaction identifiers are missing."""
        a2_output = {
            "retrieved_response": "Your order has been cancelled and refunded.",
            "unresolved_placeholders": ["order_id"],
            "retrieval_similarity": 0.85
        }
        rec = self.engine.detect_and_resolve(
            trace_id="tr_affirm_test",
            query="Cancel it now",
            a1_output=None,
            a2_output=a2_output,
            validation_output=None
        )
        self.assertIsNotNone(rec)
        self.assertEqual(rec.conflict_type, ConflictType.EVIDENCE_VS_RESPONSE_DISAGREEMENT)
        self.assertEqual(rec.resolution_action, ResolutionAction.CLARIFICATION_REQUIRED)

    def test_conflict_validation_vs_decision_disagreement(self):
        """Ensures validation agent safety gate overrules preliminary action suggestions."""
        a1_output = {"top_intent": "cancel_order", "calibrated_confidence": 0.95}
        val_output = {
            "overall_valid": False,
            "final_action": "PROCEED_AUTOMATED",
            "checks": [{"check_name": "slot_completeness", "passed": False}]
        }
        rec = self.engine.detect_and_resolve(
            trace_id="tr_val_test",
            query="Cancel immediately",
            a1_output=a1_output,
            a2_output=None,
            validation_output=val_output
        )
        self.assertIsNotNone(rec)
        self.assertEqual(rec.conflict_type, ConflictType.VALIDATION_VS_DECISION_DISAGREEMENT)
        self.assertEqual(rec.severity, ConflictSeverity.CRITICAL)
        self.assertEqual(rec.resolution_action, ResolutionAction.ESCALATION_RECOMMENDED)

    def test_conflict_retrieval_divergence(self):
        """Flags high classifier confidence paired with weak exemplar retrieval match."""
        a1_output = {
            "top_intent": "refund_request",
            "calibrated_confidence": 0.92,
            "margin": 0.70,
            "uncertainty_verdict": "CONFIDENT"
        }
        a2_output = {
            "retrieval_similarity": 0.22,
            "source_example": "unrelated exemplar"
        }
        rec = self.engine.detect_and_resolve(
            trace_id="tr_ret_test",
            query="Unusual refund scenario",
            a1_output=a1_output,
            a2_output=a2_output,
            validation_output=None
        )
        self.assertIsNotNone(rec)
        self.assertEqual(rec.conflict_type, ConflictType.RETRIEVAL_EVIDENCE_DISAGREEMENT)
        self.assertEqual(rec.resolution_action, ResolutionAction.ESCALATION_RECOMMENDED)


class TestDynamicWorkflowFormation(unittest.TestCase):
    """Verifies CapabilityRegistry, WorkflowPlanner, and WorkflowExecutor."""

    def setUp(self):
        self.registry = CapabilityRegistry()
        self.planner = WorkflowPlanner(registry=self.registry)

    def test_capability_registry_catalog(self):
        """Verifies registry contains all 13 capabilities and marks validation mandatory."""
        caps = self.registry.list_capabilities()
        self.assertEqual(len(caps), 13)
        mandatory = self.registry.get_mandatory_capabilities()
        self.assertIn("deterministic_safety_validation", mandatory)
        self.assertIn("canonical_decision_policy", mandatory)

    def test_workflow_plan_greeting(self):
        """Verifies greeting query skips heavy retrieval with explicit skip reason."""
        plan = self.planner.plan_workflow("Good morning")
        self.assertEqual(plan.workflow_type, WorkflowType.WORKFLOW_GREETING)
        self.assertIn("knowledge_base_retrieval", plan.skipped_capabilities)
        self.assertIn("deterministic_safety_validation", plan.planned_capabilities)

    def test_workflow_plan_escalation(self):
        """Verifies human escalation query plans escalation workflow."""
        plan = self.planner.plan_workflow("I want to speak with a human agent please")
        self.assertEqual(plan.workflow_type, WorkflowType.WORKFLOW_ESCALATION)
        self.assertIn("knowledge_base_retrieval", plan.skipped_capabilities)
        self.assertIn("escalation_detector", plan.planned_capabilities)

    def test_workflow_plan_product_guide(self):
        """Verifies architecture/developer guide query plans product guide workflow."""
        plan = self.planner.plan_workflow("Explain Platt sigmoid calibration and ECE metrics")
        self.assertEqual(plan.workflow_type, WorkflowType.WORKFLOW_PRODUCT_GUIDE)
        self.assertIn("product_guide_specialist", plan.planned_capabilities)

    def test_workflow_plan_missing_slot(self):
        """Verifies transaction action missing required ID triggers clarification workflow."""
        plan = self.planner.plan_workflow("I want to cancel my order please")
        self.assertEqual(plan.workflow_type, WorkflowType.WORKFLOW_CLARIFICATION_MISSING_SLOT)
        self.assertIn("slot_clarification_specialist", plan.planned_capabilities)

    def test_workflow_plan_ambiguous(self):
        """Verifies conjunction/multi-intent query triggers ambiguous conflict workflow."""
        plan = self.planner.plan_workflow("Can I either cancel order or request refund?")
        self.assertEqual(plan.workflow_type, WorkflowType.WORKFLOW_AMBIGUOUS_CONFLICT)
        self.assertIn("disambiguation_specialist", plan.planned_capabilities)

    def test_workflow_executor_enforces_mandatory_gates(self):
        """Executes a workflow and confirms mandatory validation and decision policy always run."""
        executor = WorkflowExecutor()
        plan = self.planner.plan_workflow("Hello")
        res = executor.execute(plan)
        self.assertTrue(res.is_validated)
        self.assertIn("RESOLVED", res.canonical_decision)
        executed_ids = [r.capability_id for r in res.execution_records if r.status == CapabilityStatus.EXECUTED]
        self.assertIn("deterministic_safety_validation", executed_ids)
        self.assertIn("canonical_decision_policy", executed_ids)


class TestKnowledgeGapAndIntelligence(unittest.TestCase):
    """Verifies PII redaction, clustering, grounded FAQ generation, human review, rollback, and benchmark."""

    def setUp(self):
        self.service = KnowledgeIntelligenceService()

    def test_pii_redaction(self):
        """Ensures credit cards, emails, and phone numbers are securely masked."""
        raw = "My card 4111-2222-3333-4444 and email user@example.com, call 555-123-4567"
        redacted = self.service.redact_pii(raw)
        self.assertNotIn("4111-2222-3333-4444", redacted)
        self.assertNotIn("user@example.com", redacted)
        self.assertNotIn("555-123-4567", redacted)
        self.assertIn("[REDACTED_CC]", redacted)
        self.assertIn("[REDACTED_EMAIL]", redacted)
        self.assertIn("[REDACTED_PHONE]", redacted)

    def test_gap_event_and_clustering(self):
        """Records gap events and verifies priority scoring."""
        ev = self.service.record_gap_event(
            trace_id="tr_gap_test",
            query="Can I pay with Bitcoin? My email is buyer@test.com",
            gap_type=KnowledgeGapType.UNMATCHED_QUERY,
            reason="Unsupported payment method",
            calibrated_confidence=0.35,
            retrieval_similarity=0.20
        )
        self.assertIn("[REDACTED_EMAIL]", ev.redacted_query)
        clusters = self.service.get_clusters()
        self.assertGreaterEqual(len(clusters), 1)
        self.assertGreater(clusters[0]["priority_score"], 0.0)

    def test_faq_review_workflow_and_rollback(self):
        """Tests approval of a draft FAQ, atomic snapshot creation, active update, and rollback."""
        recommendations = self.service.get_recommendations()
        self.assertGreaterEqual(len(recommendations), 1)
        target = recommendations[0]
        sug_id = target["suggestion_id"]

        # Approve suggestion
        approved = self.service.review_suggestion(sug_id, action="APPROVE", reviewer="Lead Reviewer")
        self.assertEqual(approved["status"], FAQReviewStatus.DEPLOYED.value)

        # Confirm new version snapshot exists
        versions = self.service.get_versions()
        self.assertGreaterEqual(len(versions), 2)
        latest_ver = versions[-1]["version_id"]
        self.assertTrue(versions[-1]["is_active"])

        # Rollback to baseline v_1_0_0
        rb_res = self.service.rollback_to_version("v_1_0_0")
        self.assertEqual(rb_res["status"], "success")
        self.assertEqual(rb_res["active_version"], "v_1_0_0")

    def test_retrieval_regression_benchmark(self):
        """Executes retrieval regression benchmark validating mean similarity >= 0.25."""
        bm = self.service.run_retrieval_benchmark()
        self.assertGreaterEqual(bm.total_queries, 6)
        self.assertEqual(bm.passed_queries, bm.total_queries)
        self.assertTrue(bm.no_regression)
        self.assertGreaterEqual(bm.mean_similarity, 0.25)


class TestIntelligenceCoreAPIEndpoints(unittest.TestCase):
    """Verifies all new REST API endpoints for the Intelligence Core."""

    def setUp(self):
        self.client = app.test_client()

    def test_get_conflicts_endpoint(self):
        """GET /api/conflicts returns 200 with list of detected conflicts."""
        resp = self.client.get("/api/conflicts")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("conflicts", data)
        self.assertIn("total", data)

    def test_get_capabilities_endpoint(self):
        """GET /api/workflows/capabilities returns 13 capabilities and mandatory flags."""
        resp = self.client.get("/api/workflows/capabilities")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(len(data["capabilities"]), 13)
        self.assertIn("deterministic_safety_validation", data["mandatory_capabilities"])

    def test_plan_workflow_endpoint(self):
        """POST /api/workflows/plan generates dynamic plan preview."""
        resp = self.client.post("/api/workflows/plan", json={"query": "Hello there"})
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertEqual(data["workflow_type"], "WORKFLOW_GREETING")

    def test_get_knowledge_gaps_and_clusters_endpoints(self):
        """GET /api/knowledge-gaps and /api/knowledge-gaps/clusters return 200."""
        resp1 = self.client.get("/api/knowledge-gaps")
        self.assertEqual(resp1.status_code, 200)
        resp2 = self.client.get("/api/knowledge-gaps/clusters")
        self.assertEqual(resp2.status_code, 200)

    def test_knowledge_suggestions_and_benchmark_endpoints(self):
        """GET /api/knowledge-suggestions and /api/knowledge/benchmark return 200."""
        resp1 = self.client.get("/api/knowledge-suggestions")
        self.assertEqual(resp1.status_code, 200)
        resp2 = self.client.get("/api/knowledge/benchmark")
        self.assertEqual(resp2.status_code, 200)
        self.assertTrue(resp2.get_json()["no_regression"])

    def test_knowledge_versions_endpoint(self):
        """GET /api/knowledge/versions returns version history list."""
        resp = self.client.get("/api/knowledge/versions")
        self.assertEqual(resp.status_code, 200)
        data = resp.get_json()
        self.assertIn("versions", data)


if __name__ == "__main__":
    unittest.main()
