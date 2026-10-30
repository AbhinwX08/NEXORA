"""
RELAY AI — Agent 1: Intent Analyst (Phase 5)
Performs calibrated intent classification and uncertainty evaluation.
Outputs typed Pydantic handoffs with execution tracing.
"""

import os
import sys
import time
import json
from typing import Tuple, Optional, Dict, Any, List
import numpy as np
import joblib

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
    IntentAlternative,
    A1IntentHandoff,
)


class IntentAnalystAgent:
    """
    A1 — INTENT ANALYST
    Uses saved calibrated intent classifier to predict intent, category, and calibrated probability.
    """

    def __init__(
        self,
        model_path: Optional[str] = None,
        config_path: Optional[str] = None,
        allow_fallback: bool = True
    ):
        self.agent_name = "A1_IntentAnalyst"
        self.model_path = model_path
        self.config_path = config_path
        self.allow_fallback = allow_fallback
        self.classifier = None
        self.classes = []
        self.intent_to_cat = {}
        self.config = {}

        self._load_resources()

    def _load_resources(self):
        """Loads model artifact and calibration configuration."""
        cfg_candidates = []
        if self.config_path:
            cfg_candidates.extend([self.config_path, os.path.join(_PROJECT_ROOT, self.config_path)])
        if self.allow_fallback or not self.config_path:
            cfg_candidates.append(os.path.join(_PROJECT_ROOT, "artifacts/models/calibration_config.json"))

        loaded_cfg = False
        for p in cfg_candidates:
            if os.path.exists(p):
                with open(p, "r", encoding="utf-8") as f:
                    self.config = json.load(f)
                    loaded_cfg = True
                    break

        if not loaded_cfg:
            self.config = {
                "intent_confidence_thresholds": {
                    "high_confidence_min_prob": 0.65,
                    "high_confidence_min_margin": 0.25,
                    "unsupported_max_prob": 0.35,
                    "unsupported_max_margin": 0.05
                },
                "human_escalation_intents": ["contact_customer_service", "contact_human_agent"],
                "human_escalation_keywords": ["human agent", "live agent", "real person", "speak to human", "supervisor", "manager"]
            }

        model_candidates = []
        if self.model_path:
            model_candidates.extend([self.model_path, os.path.join(_PROJECT_ROOT, self.model_path)])
        if self.allow_fallback and not self.model_path:
            model_candidates.extend([
                os.path.join(_PROJECT_ROOT, "artifacts/models/intent_classifier.joblib"),
                os.path.join(_PROJECT_ROOT, "artifacts/models/calibrated_intent_classifier.joblib")
            ])
        self.classifier = None
        for p in model_candidates:
            if os.path.exists(p):
                try:
                    artifact = joblib.load(p)
                    if isinstance(artifact, dict):
                        self.classifier = artifact.get("calibrated_model") or artifact.get("pipeline")
                        self.classes = np.array(artifact.get("classes", []))
                        self.intent_to_cat = artifact.get("intent_to_category_mapping", {})
                    else:
                        self.classifier = artifact
                        self.classes = getattr(artifact, "classes_", np.array([]))
                    break
                except Exception as e:
                    print(f"Error loading model from {p}: {e}")

    def process(self, query: str) -> Tuple[Optional[A1IntentHandoff], AgentTrace]:
        """
        Processes customer query through calibrated classification.
        Returns typed (A1IntentHandoff, AgentTrace).
        """
        t0 = time.time()
        input_payload = {"query": query}

        # Check resource availability
        if self.classifier is None:
            dur_ms = round((time.time() - t0) * 1000, 2)
            trace = AgentTrace(
                agent_name=self.agent_name,
                processing_status=AgentStatus.ERROR,
                input_payload=input_payload,
                output_payload={"error": "Calibrated model artifact is unavailable."},
                decision_reason="A1 unavailable: calibrated model file missing or failed to initialize.",
                duration_ms=dur_ms
            )
            return None, trace

        if not query or not query.strip():
            dur_ms = round((time.time() - t0) * 1000, 2)
            trace = AgentTrace(
                agent_name=self.agent_name,
                processing_status=AgentStatus.UNCERTAIN,
                input_payload=input_payload,
                output_payload={"warning": "Empty customer query received."},
                decision_reason="A1 received empty or whitespace-only input.",
                duration_ms=dur_ms
            )
            return None, trace

        try:
            query_clean = query.strip()
            probs = self.classifier.predict_proba([query_clean])[0]
            sorted_indices = np.argsort(probs)[::-1]

            top_classes = [self.classes[idx] for idx in sorted_indices[:3]]
            top_probs = [float(probs[idx]) for idx in sorted_indices[:3]]

            top_intent = top_classes[0]
            confidence = top_probs[0]
            margin = float(top_probs[0] - top_probs[1]) if len(top_probs) > 1 else top_probs[0]
            category = self.intent_to_cat.get(top_intent, "GENERAL")

            alternatives = [
                IntentAlternative(
                    rank=i + 1,
                    intent=top_classes[i],
                    category=self.intent_to_cat.get(top_classes[i], "GENERAL"),
                    probability=round(top_probs[i], 4)
                )
                for i in range(len(top_classes))
            ]

            # Uncertainty & Escalation Check
            q_lower = query_clean.lower()
            esc_keywords = self.config.get("human_escalation_keywords", [])
            has_esc_keyword = any(kw in q_lower for kw in esc_keywords)
            is_esc_intent = top_intent in self.config.get("human_escalation_intents", [])

            conf_thresh = self.config["intent_confidence_thresholds"]["high_confidence_min_prob"]
            margin_thresh = self.config["intent_confidence_thresholds"]["high_confidence_min_margin"]
            unsup_prob = self.config["intent_confidence_thresholds"]["unsupported_max_prob"]
            unsup_margin = self.config["intent_confidence_thresholds"]["unsupported_max_margin"]

            if is_esc_intent or has_esc_keyword:
                verdict = "ESCALATE"
                status = AgentStatus.ESCALATION_REQUIRED
                reason = f"Intent '{top_intent}' or query contains escalation trigger."
            elif confidence < unsup_prob or (margin < unsup_margin and confidence < 0.40):
                verdict = "UNSUPPORTED"
                status = AgentStatus.UNCERTAIN
                reason = f"Calibrated probability ({confidence:.4f}) is below domain threshold ({unsup_prob:.2f})."
            elif confidence < conf_thresh or margin < margin_thresh:
                verdict = "UNCERTAIN"
                status = AgentStatus.UNCERTAIN
                reason = f"Confidence ({confidence:.4f}) or margin ({margin:.4f}) indicates intent ambiguity."
            else:
                verdict = "CONFIDENT"
                status = AgentStatus.SUCCESS
                reason = f"High confidence prediction ({confidence:.4f} >= {conf_thresh:.2f}) with distinct margin ({margin:.4f})."

            handoff = A1IntentHandoff(
                original_query=query_clean,
                top_intent=top_intent,
                category=category,
                calibrated_confidence=round(confidence, 4),
                margin=round(margin, 4),
                alternative_intents=alternatives,
                uncertainty_verdict=verdict
            )

            dur_ms = round((time.time() - t0) * 1000, 2)
            trace = AgentTrace(
                agent_name=self.agent_name,
                processing_status=status,
                input_payload=input_payload,
                output_payload={
                    "top_intent": top_intent,
                    "category": category,
                    "calibrated_confidence": round(confidence, 4),
                    "margin": round(margin, 4),
                    "uncertainty_verdict": verdict
                },
                decision_reason=reason,
                duration_ms=dur_ms
            )

            return handoff, trace

        except Exception as e:
            dur_ms = round((time.time() - t0) * 1000, 2)
            trace = AgentTrace(
                agent_name=self.agent_name,
                processing_status=AgentStatus.ERROR,
                input_payload=input_payload,
                output_payload={"error": str(e)},
                decision_reason=f"Exception during intent classification: {str(e)}",
                duration_ms=dur_ms
            )
            return None, trace
