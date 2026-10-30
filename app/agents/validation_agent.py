"""
RELAY AI — Validation Agent (Phase 5)
Checks the reliability, safety, and completeness of the proposed customer resolution.
Performs verification gates:
1. Availability check (A1 & A2 availability)
2. Intent confidence & margin check
3. Domain boundary check (unsupported rejection)
4. Escalation policy compliance
5. Retrieval similarity & anti-fabrication check
6. Placeholder hygiene (no raw curly braces)
7. Parameter completeness (resolved vs clarification required)
"""

import os
import sys
import time
import re
from typing import Tuple, Optional, Dict, Any, List

# Add project root and src to sys.path
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
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
    ValidationCheckItem,
    ValidationHandoff,
)


class ValidationAgent:
    """
    Validation Agent:
    Validates end-to-end reliability and enforces safety policies before customer presentation.
    """

    def __init__(self, config_path: str = "artifacts/models/calibration_config.json"):
        self.agent_name = "ValidationAgent"
        self.config_path = os.path.abspath(config_path)
        self.config = self._load_config()

    def _load_config(self) -> dict:
        import json
        if os.path.exists(self.config_path):
            with open(self.config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {
            "intent_confidence_thresholds": {
                "high_confidence_min_prob": 0.65,
                "high_confidence_min_margin": 0.25,
                "unsupported_max_prob": 0.35,
                "unsupported_max_margin": 0.05
            },
            "retrieval_thresholds": {
                "high_confidence_min_similarity": 0.45,
                "unsupported_similarity_threshold": 0.30
            },
            "human_escalation_intents": ["contact_customer_service", "contact_human_agent"],
            "human_escalation_keywords": ["human agent", "live agent", "real person", "speak to human", "supervisor", "manager"]
        }

    def process(
        self,
        query: str,
        intent_handoff: Optional[A1IntentHandoff],
        retrieval_handoff: Optional[A2RetrievalHandoff]
    ) -> Tuple[ValidationHandoff, AgentTrace]:
        """
        Validates the proposed customer support resolution and returns (ValidationHandoff, AgentTrace).
        """
        t0 = time.time()
        input_payload = {
            "query": query,
            "has_intent_handoff": intent_handoff is not None,
            "has_retrieval_handoff": retrieval_handoff is not None
        }

        checks: List[ValidationCheckItem] = []
        q_lower = query.lower() if query else ""

        # Gate 1: Check Component Availability
        if intent_handoff is None:
            checks.append(ValidationCheckItem(
                check_name="component_availability",
                passed=False,
                detail="A1 Intent Analyst output is missing or failed."
            ))
            dur_ms = round((time.time() - t0) * 1000, 2)
            handoff = ValidationHandoff(
                overall_valid=False,
                checks=checks,
                decision_state="UNSUPPORTED",
                final_action="SERVICE_ERROR"
            )
            trace = AgentTrace(
                agent_name=self.agent_name,
                processing_status=AgentStatus.ERROR,
                input_payload=input_payload,
                output_payload={"final_action": "SERVICE_ERROR"},
                decision_reason="Validation aborted: upstream intent classification failed.",
                duration_ms=dur_ms
            )
            return handoff, trace

        checks.append(ValidationCheckItem(
            check_name="component_availability",
            passed=True,
            detail="A1 Intent Analyst payload received successfully."
        ))

        # Gate 2: Human Escalation Policy Check
        esc_intents = self.config.get("human_escalation_intents", [])
        esc_keywords = self.config.get("human_escalation_keywords", [])
        has_esc_kw = any(kw in q_lower for kw in esc_keywords)
        is_esc_intent = intent_handoff.top_intent in esc_intents

        if is_esc_intent or has_esc_kw or intent_handoff.uncertainty_verdict == "ESCALATE":
            checks.append(ValidationCheckItem(
                check_name="human_escalation_check",
                passed=True,
                detail=f"Escalation condition met (intent={intent_handoff.top_intent}, keyword_detected={has_esc_kw})."
            ))
            dur_ms = round((time.time() - t0) * 1000, 2)
            handoff = ValidationHandoff(
                overall_valid=True,
                checks=checks,
                decision_state="HUMAN_ESCALATION",
                final_action="ESCALATE_TO_HUMAN"
            )
            trace = AgentTrace(
                agent_name=self.agent_name,
                processing_status=AgentStatus.ESCALATION_REQUIRED,
                input_payload=input_payload,
                output_payload={"final_action": "ESCALATE_TO_HUMAN"},
                decision_reason="Customer request routed to human escalation support.",
                duration_ms=dur_ms
            )
            return handoff, trace

        # Gate 3: Domain Boundary Check (Unsupported Rejection)
        unsup_p = self.config["intent_confidence_thresholds"]["unsupported_max_prob"]
        unsup_m = self.config["intent_confidence_thresholds"]["unsupported_max_margin"]
        unsup_sim = self.config["retrieval_thresholds"]["unsupported_similarity_threshold"]

        retrieval_sim = retrieval_handoff.retrieval_similarity if retrieval_handoff else 0.0
        is_unsupported = (
            intent_handoff.calibrated_confidence < unsup_p
            or retrieval_sim < unsup_sim
            or (intent_handoff.margin < unsup_m and intent_handoff.calibrated_confidence < 0.40)
            or intent_handoff.uncertainty_verdict == "UNSUPPORTED"
        )

        if is_unsupported:
            checks.append(ValidationCheckItem(
                check_name="domain_boundary_check",
                passed=False,
                detail=f"Query rejected: confidence={intent_handoff.calibrated_confidence:.4f}, sim={retrieval_sim:.4f} below domain thresholds."
            ))
            dur_ms = round((time.time() - t0) * 1000, 2)
            handoff = ValidationHandoff(
                overall_valid=False,
                checks=checks,
                decision_state="UNSUPPORTED",
                final_action="UNSUPPORTED_REJECTION"
            )
            trace = AgentTrace(
                agent_name=self.agent_name,
                processing_status=AgentStatus.UNCERTAIN,
                input_payload=input_payload,
                output_payload={"final_action": "UNSUPPORTED_REJECTION"},
                decision_reason="Query falls outside supported business domain boundaries.",
                duration_ms=dur_ms
            )
            return handoff, trace

        checks.append(ValidationCheckItem(
            check_name="domain_boundary_check",
            passed=True,
            detail="Query conforms to supported business domain."
        ))

        # Gate 4: Intent Confidence & Separation Check
        conf_min = self.config["intent_confidence_thresholds"]["high_confidence_min_prob"]
        margin_min = self.config["intent_confidence_thresholds"]["high_confidence_min_margin"]
        is_ambiguous = (
            intent_handoff.calibrated_confidence < conf_min
            or intent_handoff.margin < margin_min
            or intent_handoff.uncertainty_verdict == "UNCERTAIN"
        )

        if is_ambiguous:
            checks.append(ValidationCheckItem(
                check_name="intent_confidence_and_separation",
                passed=False,
                detail=f"Ambiguous intent: confidence={intent_handoff.calibrated_confidence:.4f} (<{conf_min:.2f}) or margin={intent_handoff.margin:.4f} (<{margin_min:.2f})."
            ))
            dur_ms = round((time.time() - t0) * 1000, 2)
            handoff = ValidationHandoff(
                overall_valid=False,
                checks=checks,
                decision_state="UNCERTAIN",
                final_action="AMBIGUOUS_INTENT_CLARIFICATION"
            )
            trace = AgentTrace(
                agent_name=self.agent_name,
                processing_status=AgentStatus.CLARIFICATION_REQUIRED,
                input_payload=input_payload,
                output_payload={"final_action": "AMBIGUOUS_INTENT_CLARIFICATION"},
                decision_reason="Intent classification is ambiguous. Requesting intent clarification.",
                duration_ms=dur_ms
            )
            return handoff, trace

        checks.append(ValidationCheckItem(
            check_name="intent_confidence_and_separation",
            passed=True,
            detail=f"Intent confidence ({intent_handoff.calibrated_confidence:.4f}) and margin ({intent_handoff.margin:.4f}) verified."
        ))

        # Gate 5: Retrieval Availability & Quality Check
        if retrieval_handoff is None:
            checks.append(ValidationCheckItem(
                check_name="retrieval_availability",
                passed=False,
                detail="A2 Response Specialist output is missing."
            ))
            dur_ms = round((time.time() - t0) * 1000, 2)
            handoff = ValidationHandoff(
                overall_valid=False,
                checks=checks,
                decision_state="UNCERTAIN",
                final_action="SERVICE_ERROR"
            )
            trace = AgentTrace(
                agent_name=self.agent_name,
                processing_status=AgentStatus.ERROR,
                input_payload=input_payload,
                output_payload={"final_action": "SERVICE_ERROR"},
                decision_reason="A2 response retrieval component failed.",
                duration_ms=dur_ms
            )
            return handoff, trace

        sim_high = self.config["retrieval_thresholds"]["high_confidence_min_similarity"]
        if retrieval_handoff.retrieval_similarity < sim_high:
            checks.append(ValidationCheckItem(
                check_name="retrieval_similarity_check",
                passed=False,
                detail=f"Retrieval similarity ({retrieval_handoff.retrieval_similarity:.4f}) below high-confidence cutoff ({sim_high:.2f})."
            ))
            dur_ms = round((time.time() - t0) * 1000, 2)
            handoff = ValidationHandoff(
                overall_valid=False,
                checks=checks,
                decision_state="UNCERTAIN",
                final_action="AMBIGUOUS_INTENT_CLARIFICATION"
            )
            trace = AgentTrace(
                agent_name=self.agent_name,
                processing_status=AgentStatus.CLARIFICATION_REQUIRED,
                input_payload=input_payload,
                output_payload={"final_action": "AMBIGUOUS_INTENT_CLARIFICATION"},
                decision_reason="Retrieval similarity borderline; asking user for clarification.",
                duration_ms=dur_ms
            )
            return handoff, trace

        checks.append(ValidationCheckItem(
            check_name="retrieval_similarity_check",
            passed=True,
            detail=f"Retrieval similarity verified ({retrieval_handoff.retrieval_similarity:.4f} >= {sim_high:.2f})."
        ))

        # Gate 6: Placeholder Hygiene Check (Anti-Brace Leakage)
        raw_response = retrieval_handoff.retrieved_response
        has_unresolved_braces = bool(re.search(r'\{\{.*?\}\}', raw_response))
        if has_unresolved_braces:
            checks.append(ValidationCheckItem(
                check_name="placeholder_hygiene_check",
                passed=False,
                detail="Raw template braces detected in output response."
            ))
            dur_ms = round((time.time() - t0) * 1000, 2)
            handoff = ValidationHandoff(
                overall_valid=False,
                checks=checks,
                decision_state="HIGH_CONFIDENCE",
                final_action="NEED_SLOT_CLARIFICATION"
            )
            trace = AgentTrace(
                agent_name=self.agent_name,
                processing_status=AgentStatus.CLARIFICATION_REQUIRED,
                input_payload=input_payload,
                output_payload={"final_action": "NEED_SLOT_CLARIFICATION"},
                decision_reason="Unresolved placeholders detected. Enforcing slot clarification.",
                duration_ms=dur_ms
            )
            return handoff, trace

        checks.append(ValidationCheckItem(
            check_name="placeholder_hygiene_check",
            passed=True,
            detail="No unresolved raw template braces present in output."
        ))

        # Gate 7: Parameter Completeness & Slot Status Check
        if retrieval_handoff.placeholder_status == "clarification_required":
            checks.append(ValidationCheckItem(
                check_name="parameter_completeness_check",
                passed=False,
                detail=f"Missing dynamic customer parameters: {retrieval_handoff.unresolved_placeholders}."
            ))
            dur_ms = round((time.time() - t0) * 1000, 2)
            handoff = ValidationHandoff(
                overall_valid=True,
                checks=checks,
                decision_state="HIGH_CONFIDENCE",
                final_action="NEED_SLOT_CLARIFICATION"
            )
            trace = AgentTrace(
                agent_name=self.agent_name,
                processing_status=AgentStatus.CLARIFICATION_REQUIRED,
                input_payload=input_payload,
                output_payload={"final_action": "NEED_SLOT_CLARIFICATION"},
                decision_reason="Intent confident, but dynamic slot values are missing from customer input.",
                duration_ms=dur_ms
            )
            return handoff, trace

        checks.append(ValidationCheckItem(
            check_name="parameter_completeness_check",
            passed=True,
            detail="All required response parameters and system constants are satisfied."
        ))

        # All Gates Passed: Full Automated Resolution
        dur_ms = round((time.time() - t0) * 1000, 2)
        handoff = ValidationHandoff(
            overall_valid=True,
            checks=checks,
            decision_state="HIGH_CONFIDENCE",
            final_action="PROCEED_AUTOMATED"
        )
        trace = AgentTrace(
            agent_name=self.agent_name,
            processing_status=AgentStatus.SUCCESS,
            input_payload=input_payload,
            output_payload={"final_action": "PROCEED_AUTOMATED"},
            decision_reason="All validation checks passed cleanly. Resolution approved for customer delivery.",
            duration_ms=dur_ms
        )
        return handoff, trace
