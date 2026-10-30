"""
RELAY AI — Dynamic Workflow Planner (Part 2)
Analyzes incoming queries and session state to form dynamic agent teams,
selecting the optimal workflow while enforcing mandatory safety validation.
"""

import re
import uuid
from typing import Dict, Any, List, Optional
from app.schemas.workflow_models import WorkflowType, WorkflowPlan
from app.orchestration.capability_registry import CapabilityRegistry


class WorkflowPlanner:
    """
    Constructs a deterministic WorkflowPlan by analyzing query syntax, explicit keywords,
    session memory, and domain context.
    """

    GREETING_REGEX = re.compile(
        r"^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening|day)|howdy)\b",
        re.IGNORECASE
    )

    ESCALATION_KEYWORDS = [
        "human agent",
        "live agent",
        "real person",
        "speak to human",
        "talk to human",
        "human representative",
        "supervisor",
        "manager",
        "talk to someone",
        "transfer me",
        "connect me to person"
    ]

    PRODUCT_GUIDE_KEYWORDS = [
        "architecture",
        "platt sigmoid",
        "calibration",
        "brier score",
        "expected calibration error",
        "ece",
        "how relay works",
        "how does relay work",
        "multi-agent",
        "orchestrator",
        "intent agent",
        "validation agent",
        "decision policy",
        "technical specs",
        "developer guide"
    ]

    def __init__(self, registry: Optional[CapabilityRegistry] = None):
        self.registry = registry or CapabilityRegistry()

    def plan_workflow(
        self,
        query: str,
        session_slots: Optional[Dict[str, str]] = None,
        preferred_mode: Optional[str] = None
    ) -> WorkflowPlan:
        """
        Synthesizes an execution plan with explicit capability inclusion and skip rationale.
        """
        workflow_id = f"wf_{uuid.uuid4().hex[:8]}"
        q_clean = query.strip()
        q_lower = q_clean.lower()

        # ---------------------------------------------------------------------
        # 1. Check Product Guide Mode or Keywords
        # ---------------------------------------------------------------------
        if preferred_mode == "product_guide" or any(kw in q_lower for kw in self.PRODUCT_GUIDE_KEYWORDS):
            return self._build_product_guide_plan(workflow_id, q_clean)

        # ---------------------------------------------------------------------
        # 2. Check Explicit Escalation Keywords
        # ---------------------------------------------------------------------
        if any(kw in q_lower for kw in self.ESCALATION_KEYWORDS):
            return self._build_escalation_plan(workflow_id, q_clean)

        # ---------------------------------------------------------------------
        # 3. Check Greeting / Social Query
        # ---------------------------------------------------------------------
        if self.GREETING_REGEX.match(q_lower) and len(q_clean.split()) <= 4:
            return self._build_greeting_plan(workflow_id, q_clean)

        # ---------------------------------------------------------------------
        # 4. Check Missing Slot / Ambiguity Heuristics
        # E.g. Query specifies an action that usually requires an ID, but provides none
        # ---------------------------------------------------------------------
        action_verbs = ["cancel", "track", "refund", "return", "where is", "status of"]
        has_action = any(v in q_lower for v in action_verbs)
        has_id = bool(re.search(r'#?\b\d{4,10}\b', q_clean)) or (session_slots and bool(session_slots.get("order_id")))

        # Check for multi-intent ambiguity triggers (e.g. "cancel order or refund")
        is_ambiguous = (" or " in q_lower or " / " in q_lower or "either" in q_lower) and len(q_clean.split()) > 3

        if is_ambiguous:
            return self._build_ambiguous_conflict_plan(workflow_id, q_clean)

        if has_action and not has_id:
            return self._build_clarification_missing_slot_plan(workflow_id, q_clean)

        # ---------------------------------------------------------------------
        # 5. Default: Standard Support Workflow
        # ---------------------------------------------------------------------
        return self._build_standard_support_plan(workflow_id, q_clean)

    def _build_greeting_plan(self, workflow_id: str, query: str) -> WorkflowPlan:
        planned = [
            "escalation_detector",
            "session_memory_retrieval",
            "response_synthesis",
            "deterministic_safety_validation",
            "canonical_decision_policy"
        ]
        skipped = {
            "knowledge_base_retrieval": "Greeting input detected: skipping 18,810 exemplar TF-IDF retrieval to minimize latency without compromising safety.",
            "intent_analysis": "Greeting handled by conversational assistant specialist without intent classifier invocation.",
            "slot_resolution": "Greetings do not require order ID or entity token extraction.",
            "conflict_arbitration": "No multi-agent disagreement possible on simple conversational greeting.",
            "product_guide_specialist": "Greeting does not require technical documentation retrieval."
        }
        return WorkflowPlan(
            workflow_id=workflow_id,
            workflow_type=WorkflowType.WORKFLOW_GREETING,
            query=query,
            rationale="Query is a conversational greeting. Bypassing heavy retrieval and slot resolution to achieve sub-millisecond response.",
            planned_capabilities=planned,
            skipped_capabilities=skipped
        )

    def _build_escalation_plan(self, workflow_id: str, query: str) -> WorkflowPlan:
        planned = [
            "escalation_detector",
            "session_memory_retrieval",
            "response_synthesis",
            "deterministic_safety_validation",
            "canonical_decision_policy"
        ]
        skipped = {
            "knowledge_base_retrieval": "Explicit human escalation requested: bypassing automated FAQ search to package handoff context immediately.",
            "slot_resolution": "Escalation handoff captures full conversation context without strict slot constraints.",
            "conflict_arbitration": "User explicitly requested human review; automated conflict arbitration skipped.",
            "product_guide_specialist": "User requested human contact; technical guide search bypassed."
        }
        return WorkflowPlan(
            workflow_id=workflow_id,
            workflow_type=WorkflowType.WORKFLOW_ESCALATION,
            query=query,
            rationale="Customer requested human specialist or supervisor. Forming dedicated escalation team with guaranteed safety validation.",
            planned_capabilities=planned,
            skipped_capabilities=skipped
        )

    def _build_product_guide_plan(self, workflow_id: str, query: str) -> WorkflowPlan:
        planned = [
            "product_guide_specialist",
            "session_memory_retrieval",
            "response_synthesis",
            "deterministic_safety_validation",
            "canonical_decision_policy"
        ]
        skipped = {
            "knowledge_base_retrieval": "Product architecture query: routed to specialized developer guide corpus instead of transaction database.",
            "intent_analysis": "Product guide domain bypasses transactional banking/e-commerce intent classification.",
            "slot_resolution": "Technical guide queries do not require customer order slot extraction.",
            "conflict_arbitration": "Single-corpus technical grounding does not involve inter-agent conflict."
        }
        return WorkflowPlan(
            workflow_id=workflow_id,
            workflow_type=WorkflowType.WORKFLOW_PRODUCT_GUIDE,
            query=query,
            rationale="Query asks about system architecture, calibration metrics, or multi-agent mechanics. Routing to product guide engine.",
            planned_capabilities=planned,
            skipped_capabilities=skipped
        )

    def _build_clarification_missing_slot_plan(self, workflow_id: str, query: str) -> WorkflowPlan:
        planned = [
            "intent_analysis",
            "domain_support_check",
            "session_memory_retrieval",
            "knowledge_base_retrieval",
            "slot_resolution",
            "slot_clarification_specialist",
            "conflict_arbitration",
            "response_synthesis",
            "deterministic_safety_validation",
            "canonical_decision_policy"
        ]
        skipped = {
            "product_guide_specialist": "Transactional support query; product guide RAG bypassed."
        }
        return WorkflowPlan(
            workflow_id=workflow_id,
            workflow_type=WorkflowType.WORKFLOW_CLARIFICATION_MISSING_SLOT,
            query=query,
            rationale="Query requires specific transaction identifier (e.g. order number) which is missing from query and session memory.",
            planned_capabilities=planned,
            skipped_capabilities=skipped
        )

    def _build_ambiguous_conflict_plan(self, workflow_id: str, query: str) -> WorkflowPlan:
        planned = [
            "intent_analysis",
            "domain_support_check",
            "conflict_arbitration",
            "disambiguation_specialist",
            "session_memory_retrieval",
            "response_synthesis",
            "deterministic_safety_validation",
            "canonical_decision_policy"
        ]
        skipped = {
            "knowledge_base_retrieval": "Borderline/ambiguous query: pausing deep retrieval until intent ambiguity is clarified.",
            "product_guide_specialist": "Inquiry is transactional ambiguity; technical guide bypassed."
        }
        return WorkflowPlan(
            workflow_id=workflow_id,
            workflow_type=WorkflowType.WORKFLOW_AMBIGUOUS_CONFLICT,
            query=query,
            rationale="Query exhibits multiple competing intents or conjunctions. Activating conflict arbitration and disambiguation specialist.",
            planned_capabilities=planned,
            skipped_capabilities=skipped
        )

    def _build_standard_support_plan(self, workflow_id: str, query: str) -> WorkflowPlan:
        planned = [
            "intent_analysis",
            "domain_support_check",
            "escalation_detector",
            "session_memory_retrieval",
            "knowledge_base_retrieval",
            "slot_resolution",
            "conflict_arbitration",
            "response_synthesis",
            "deterministic_safety_validation",
            "canonical_decision_policy"
        ]
        skipped = {
            "product_guide_specialist": "Standard customer service query; developer guide corpus bypassed.",
            "disambiguation_specialist": "Unambiguous standard inquiry does not require multi-choice disambiguation."
        }
        return WorkflowPlan(
            workflow_id=workflow_id,
            workflow_type=WorkflowType.WORKFLOW_STANDARD_SUPPORT,
            query=query,
            rationale="Standard customer support inquiry. Executing full end-to-end multi-agent pipeline with complete verification.",
            planned_capabilities=planned,
            skipped_capabilities=skipped
        )

