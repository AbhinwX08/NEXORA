"""
RELAY AI — Canonical Decision Policy Engine (Prompt B3)
Single source of truth for deterministic multi-agent routing.
Reconciles threshold policies across Intent Analyst (A1), Response Specialist (A2),
Validation Agent, and Support Orchestrator.

Allowed Outcomes:
1. RESOLVED: High calibrated confidence, strong margin, valid retrieval, all parameters resolved.
2. CLARIFICATION_REQUIRED: Borderline intent margin or missing essential customer parameters.
3. ESCALATION_RECOMMENDED: Explicit customer escalation intent or designated escalation route.
4. UNSUPPORTED: Query falls outside supported customer support domain or similarity below cutoff.
5. SERVICE_ERROR: Infrastructure or model availability failure handled gracefully.
"""

import os
import json
import logging
from enum import Enum
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger("relay.decision_policy")

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class DecisionOutcome(str, Enum):
    RESOLVED = "RESOLVED"
    CLARIFICATION_REQUIRED = "CLARIFICATION_REQUIRED"
    ESCALATION_RECOMMENDED = "ESCALATION_RECOMMENDED"
    UNSUPPORTED = "UNSUPPORTED"
    SERVICE_ERROR = "SERVICE_ERROR"


class DecisionAction(str, Enum):
    PROCEED_AUTOMATED = "PROCEED_AUTOMATED"
    NEED_SLOT_CLARIFICATION = "NEED_SLOT_CLARIFICATION"
    AMBIGUOUS_INTENT_CLARIFICATION = "AMBIGUOUS_INTENT_CLARIFICATION"
    ESCALATE_TO_HUMAN = "ESCALATE_TO_HUMAN"
    UNSUPPORTED_REJECTION = "UNSUPPORTED_REJECTION"
    SERVICE_ERROR = "SERVICE_ERROR"


class DecisionPolicy:
    """
    Canonical Decision Policy.
    Centralized threshold evaluation preventing threshold drift between DecisionAgent and Orchestrator.
    """

    DEFAULT_CONFIG = {
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
        "human_escalation_intents": [
            "contact_customer_service",
            "contact_human_agent"
        ],
        "human_escalation_keywords": [
            "human agent",
            "live agent",
            "real person",
            "speak to human",
            "talk to human",
            "human representative",
            "supervisor",
            "manager",
            "customer care officer",
            "connect me to person"
        ]
    }

    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path or os.path.join(_PROJECT_ROOT, "artifacts/models/calibration_config.json")
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data
            except Exception as e:
                logger.warning(f"Failed to read config from {self.config_path}: {e}. Using defaults.")
        return dict(self.DEFAULT_CONFIG)

    def evaluate(
        self,
        query: str,
        intent: Optional[str],
        category: Optional[str],
        confidence: float,
        margin: float,
        retrieval_similarity: Optional[float],
        placeholder_status: Optional[str],
        unresolved_placeholders: List[str],
        alternatives: List[Dict[str, Any]],
        a1_available: bool = True,
        a2_available: bool = True
    ) -> Dict[str, Any]:
        """
        Evaluates query state deterministically and returns canonical outcome, action, and reasoning.
        """
        reasons: List[str] = []
        q_lower = query.lower().strip() if query else ""

        # Gate 1: Service Availability
        if not a1_available or not a2_available:
            return {
                "outcome": DecisionOutcome.SERVICE_ERROR,
                "action": DecisionAction.SERVICE_ERROR,
                "decision_state": "SERVICE_ERROR",
                "final_decision": "SERVICE_ERROR",
                "reason": "Underlying model service unavailable",
                "reasons": ["A1 Intent Analyst or A2 Response Specialist uninitialized or failed."]
            }

        # Gate 2: Explicit Human Escalation
        esc_keywords = self.config.get("human_escalation_keywords", self.DEFAULT_CONFIG["human_escalation_keywords"])
        matched_kw = [kw for kw in esc_keywords if kw in q_lower]
        esc_intents = self.config.get("human_escalation_intents", self.DEFAULT_CONFIG["human_escalation_intents"])
        is_esc_intent = intent in esc_intents if intent else False

        if is_esc_intent or len(matched_kw) > 0:
            if matched_kw:
                reasons.append(f"Explicit escalation request detected matching keyword(s): {matched_kw}")
            if is_esc_intent:
                reasons.append(f"Predicted intent '{intent}' is designated human escalation route")
            return {
                "outcome": DecisionOutcome.ESCALATION_RECOMMENDED,
                "action": DecisionAction.ESCALATE_TO_HUMAN,
                "decision_state": "HUMAN_ESCALATION",
                "final_decision": "ESCALATION_RECOMMENDED",
                "reason": "Customer requested human support routing",
                "reasons": reasons
            }

        # Thresholds
        conf_cfg = self.config.get("intent_confidence_thresholds", self.DEFAULT_CONFIG["intent_confidence_thresholds"])
        ret_cfg = self.config.get("retrieval_thresholds", self.DEFAULT_CONFIG["retrieval_thresholds"])

        min_conf = conf_cfg.get("high_confidence_min_prob", 0.65)
        min_margin = conf_cfg.get("high_confidence_min_margin", 0.25)
        unsup_conf = conf_cfg.get("unsupported_max_prob", 0.35)
        unsup_margin = conf_cfg.get("unsupported_max_margin", 0.05)
        min_sim = ret_cfg.get("high_confidence_min_similarity", 0.45)
        unsup_sim = ret_cfg.get("unsupported_similarity_threshold", 0.30)

        sim = retrieval_similarity if retrieval_similarity is not None else 0.0

        # Gate 3: Out-of-Domain / Unsupported
        # Similarity below cutoff OR very low confidence and flat margin
        if sim < unsup_sim or (confidence < unsup_conf and margin < unsup_margin):
            if sim < unsup_sim:
                reasons.append(f"Retrieval similarity ({sim:.4f}) is below out-of-domain cutoff ({unsup_sim:.2f})")
            if confidence < unsup_conf:
                reasons.append(f"Calibrated intent confidence ({confidence:.4f}) is below domain cutoff ({unsup_conf:.2f})")
            return {
                "outcome": DecisionOutcome.UNSUPPORTED,
                "action": DecisionAction.UNSUPPORTED_REJECTION,
                "decision_state": "UNSUPPORTED",
                "final_decision": "UNSUPPORTED",
                "reason": "Query out-of-domain or unrepresented in knowledge base",
                "reasons": reasons
            }

        # Gate 4: Slot Clarification Required
        if placeholder_status == "clarification_required" or len(unresolved_placeholders) > 0:
            reasons.append(f"Customer parameters missing: {unresolved_placeholders}")
            dec_state = "HIGH_CONFIDENCE" if (confidence >= min_conf and margin >= min_margin) else "UNCERTAIN"
            return {
                "outcome": DecisionOutcome.CLARIFICATION_REQUIRED,
                "action": DecisionAction.NEED_SLOT_CLARIFICATION,
                "decision_state": dec_state,
                "final_decision": f"{dec_state}: NEED_SLOT_CLARIFICATION",
                "reason": f"Missing required parameters: {', '.join(unresolved_placeholders)}",
                "reasons": reasons
            }

        # Gate 5: Intent Ambiguity / Low Confidence
        if confidence < min_conf or margin < min_margin:
            alt_names = [a.get("intent", "") for a in alternatives[:2] if isinstance(a, dict)]
            reasons.append(f"Intent uncertainty: confidence={confidence:.4f} (min {min_conf}), margin={margin:.4f} (min {min_margin})")
            return {
                "outcome": DecisionOutcome.CLARIFICATION_REQUIRED,
                "action": DecisionAction.AMBIGUOUS_INTENT_CLARIFICATION,
                "decision_state": "UNCERTAIN",
                "final_decision": "CLARIFICATION_REQUIRED: AMBIGUOUS_INTENT",
                "reason": f"Borderline confidence between top candidate intents: {alt_names}",
                "reasons": reasons
            }

        # Gate 6: Resolved Response
        reasons.append("High confidence intent prediction and verified response retrieval with all parameters resolved.")
        return {
            "outcome": DecisionOutcome.RESOLVED,
            "action": DecisionAction.PROCEED_AUTOMATED,
            "decision_state": "HIGH_CONFIDENCE",
            "final_decision": "RESOLVED_RESPONSE",
            "reason": "Verified resolution ready for delivery",
            "reasons": reasons
        }
