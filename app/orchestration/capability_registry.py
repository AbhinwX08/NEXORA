"""
RELAY AI — Central Capability Registry (Part 2)
Catalogs all atomic capabilities across the multi-agent system with inputs,
outputs, prerequisites, and mandatory safety requirements.
"""

from typing import Dict, List, Optional
from app.schemas.workflow_models import CapabilityDefinition


class CapabilityRegistry:
    """
    Central repository of all agent capabilities.
    Enforces prerequisites and tracks whether capabilities can be conditionally skipped.
    """

    def __init__(self):
        self._registry: Dict[str, CapabilityDefinition] = {}
        self._register_default_capabilities()

    def _register_default_capabilities(self):
        capabilities = [
            CapabilityDefinition(
                capability_id="intent_analysis",
                title="A1 Intent Classification & Calibration",
                agent_role="A1 Intent Analyst",
                description="Predicts customer intent, calibrated probability, margin, and alternative intents.",
                prerequisites=[],
                is_mandatory=False,
                expected_latency_ms=2.5
            ),
            CapabilityDefinition(
                capability_id="domain_support_check",
                title="Out-of-Domain Detection",
                agent_role="Domain Specialist",
                description="Evaluates whether the customer inquiry falls within the supported customer care boundaries.",
                prerequisites=["intent_analysis"],
                is_mandatory=False,
                expected_latency_ms=0.5
            ),
            CapabilityDefinition(
                capability_id="escalation_detector",
                title="Explicit Human Escalation Check",
                agent_role="Triage Analyst",
                description="Detects explicit demands for human representatives, supervisors, or live agents.",
                prerequisites=[],
                is_mandatory=False,
                expected_latency_ms=0.4
            ),
            CapabilityDefinition(
                capability_id="session_memory_retrieval",
                title="Session Memory & Slot Recall",
                agent_role="Session Memory Specialist",
                description="Extracts contextual slots, order numbers, and verified account history from session store.",
                prerequisites=[],
                is_mandatory=False,
                expected_latency_ms=0.3
            ),
            CapabilityDefinition(
                capability_id="product_guide_specialist",
                title="Product Architecture & Tech Guide RAG",
                agent_role="Product Guide Specialist",
                description="Retrieves technical architecture and developer documentation for product questions.",
                prerequisites=[],
                is_mandatory=False,
                expected_latency_ms=1.8
            ),
            CapabilityDefinition(
                capability_id="knowledge_base_retrieval",
                title="A2 TF-IDF Exemplar Retrieval",
                agent_role="A2 Response Specialist",
                description="Performs contextual TF-IDF retrieval across verified 18,810 customer support exemplars.",
                prerequisites=["intent_analysis"],
                is_mandatory=False,
                expected_latency_ms=8.0
            ),
            CapabilityDefinition(
                capability_id="slot_resolution",
                title="Slot Extraction & Template Filling",
                agent_role="Slot Resolution Specialist",
                description="Extracts entity tokens (order ID, tracking number, package size) and resolves response templates.",
                prerequisites=["knowledge_base_retrieval"],
                is_mandatory=False,
                expected_latency_ms=0.8
            ),
            CapabilityDefinition(
                capability_id="conflict_arbitration",
                title="Evidence-Based Conflict Resolution",
                agent_role="Conflict Resolution Engine",
                description="Detects contradictory, unsupported, or incompatible agent conclusions and resolves deterministically.",
                prerequisites=["intent_analysis"],
                is_mandatory=False,
                expected_latency_ms=1.0
            ),
            CapabilityDefinition(
                capability_id="disambiguation_specialist",
                title="Ambiguous Intent Disambiguation",
                agent_role="Clarification Specialist",
                description="Synthesizes targeted clarification prompts when candidate intent margins are borderline.",
                prerequisites=["intent_analysis"],
                is_mandatory=False,
                expected_latency_ms=0.5
            ),
            CapabilityDefinition(
                capability_id="slot_clarification_specialist",
                title="Missing Parameter Clarification",
                agent_role="Slot Clarification Specialist",
                description="Generates precise parameter collection requests when mandatory slots are missing.",
                prerequisites=["slot_resolution"],
                is_mandatory=False,
                expected_latency_ms=0.5
            ),
            CapabilityDefinition(
                capability_id="response_synthesis",
                title="Response Grounding & Polish",
                agent_role="Response Synthesis Specialist",
                description="Assembles the final validated customer response grounded purely in verified evidence.",
                prerequisites=[],
                is_mandatory=False,
                expected_latency_ms=0.6
            ),
            CapabilityDefinition(
                capability_id="deterministic_safety_validation",
                title="Validation Agent Safety Gates",
                agent_role="Validation Agent",
                description="Executes deterministic safety checks: hallucination prevention, regex verification, and slot check.",
                prerequisites=[],
                is_mandatory=True,  # NEVER ALLOWED TO BE BYPASSED
                expected_latency_ms=1.2
            ),
            CapabilityDefinition(
                capability_id="canonical_decision_policy",
                title="Canonical Decision Policy Engine",
                agent_role="Decision Policy Engine",
                description="Applies standardized confidence, margin, and similarity thresholds to determine outcome.",
                prerequisites=["deterministic_safety_validation"],
                is_mandatory=True,  # NEVER ALLOWED TO BE BYPASSED
                expected_latency_ms=0.4
            ),
        ]

        for cap in capabilities:
            self._registry[cap.capability_id] = cap

    def get_capability(self, capability_id: str) -> Optional[CapabilityDefinition]:
        return self._registry.get(capability_id)

    def list_capabilities(self) -> List[CapabilityDefinition]:
        return list(self._registry.values())

    def get_mandatory_capabilities(self) -> List[str]:
        return [cid for cid, cap in self._registry.items() if cap.is_mandatory]

    def validate_plan(self, planned_capability_ids: List[str]) -> bool:
        """Ensures all mandatory capabilities are included and prerequisites are satisfied."""
        planned_set = set(planned_capability_ids)

        # Check mandatory capabilities
        for m in self.get_mandatory_capabilities():
            if m not in planned_set:
                return False

        # Check prerequisites
        for cid in planned_capability_ids:
            cap = self._registry.get(cid)
            if cap:
                for prereq in cap.prerequisites:
                    if prereq not in planned_set:
                        return False
        return True

