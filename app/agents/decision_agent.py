"""
RELAY AI — Agent 3: Decision & Uncertainty Specialist (Phase 5 / Prompt B3)
Evaluates calibrated prediction confidence, uncertainty routing, and response safety.
Uses canonical DecisionPolicy to prevent threshold divergence across the system.
"""

import os
import sys
import json
from typing import Dict, Any, List, Optional
import numpy as np
import joblib

# Add project root and src to sys.path
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)
_SRC_DIR = os.path.join(_PROJECT_ROOT, "src")
if _SRC_DIR not in sys.path:
    sys.path.insert(0, _SRC_DIR)

from app.services.retrieval_service import RetrievalService
from app.agents.response_agent import ResponseAgent
from app.orchestration.decision_policy import DecisionPolicy, DecisionOutcome, DecisionAction


class DecisionAgent:
    """
    Agent 3: Decision & Uncertainty Specialist.
    Delegates compound uncertainty assessment to canonical DecisionPolicy.
    """

    def __init__(
        self,
        calibrated_model_path: str = "artifacts/models/calibrated_intent_classifier.joblib",
        calibration_config_path: str = "artifacts/models/calibration_config.json",
        retriever_path: str = "artifacts/models/response_retriever.joblib"
    ):
        def _resolve(path: str) -> str:
            if os.path.isabs(path) and os.path.exists(path):
                return path
            root_cand = os.path.join(_PROJECT_ROOT, path)
            if os.path.exists(root_cand):
                return root_cand
            return path

        self.calibrated_model_path = _resolve(calibrated_model_path)
        self.calibration_config_path = _resolve(calibration_config_path)
        self.retriever_path = _resolve(retriever_path)

        # Canonical Policy Engine
        self.policy = DecisionPolicy(config_path=self.calibration_config_path)

        # Load Calibrated Intent Classifier
        if os.path.exists(self.calibrated_model_path):
            artifact = joblib.load(self.calibrated_model_path)
            self.classifier = artifact.get("calibrated_model") or artifact.get("pipeline")
            self.classes = np.array(artifact.get("classes", []))
            self.intent_to_cat = artifact.get("intent_to_category_mapping", {})
        else:
            raise FileNotFoundError(f"Calibrated model artifact not found at: {self.calibrated_model_path}")

        # Load Response Specialist (A2)
        if os.path.exists(self.retriever_path):
            service = RetrievalService.load(self.retriever_path)
            self.response_agent = ResponseAgent(retrieval_service=service)
        else:
            raise FileNotFoundError(f"Retriever artifact not found at: {self.retriever_path}")

    def evaluate_query(self, query: str, customer_slots: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Executes end-to-end uncertainty assessment and returns inspectable decision object.
        """
        if not isinstance(query, str) or not query.strip():
            return {
                "decision_state": "UNSUPPORTED",
                "action_verdict": "UNSUPPORTED_REJECTION",
                "final_decision": "UNSUPPORTED",
                "reasons": ["Empty query string supplied."],
                "top_intent": "unknown",
                "confidence": 0.0,
                "margin": 0.0,
                "retrieval_similarity": 0.0,
                "final_response": "Please provide a question or describe your customer support issue."
            }

        query_clean = query.strip()

        # 1. Calibrated Classification (A1)
        probs = self.classifier.predict_proba([query_clean])[0]
        sorted_indices = np.argsort(probs)[::-1]

        top_classes = [self.classes[idx] for idx in sorted_indices[:3]]
        top_probs = [float(probs[idx]) for idx in sorted_indices[:3]]

        top_intent = top_classes[0]
        confidence = top_probs[0]
        margin = float(top_probs[0] - top_probs[1]) if len(top_probs) > 1 else top_probs[0]
        predicted_category = self.intent_to_cat.get(top_intent, "GENERAL")

        top_alternatives = []
        for rank, (name, prob) in enumerate(zip(top_classes, top_probs), start=1):
            top_alternatives.append({
                "rank": rank,
                "intent": name,
                "category": self.intent_to_cat.get(name, "GENERAL"),
                "probability": round(prob, 4)
            })

        # 2. Response Retrieval & Slot Extraction (A2)
        a2_result = self.response_agent.process_query(
            query=query_clean,
            predicted_intent=top_intent,
            customer_slots=customer_slots,
            method="combined"
        )
        retrieval_similarity = float(a2_result.get("retrieval_similarity", 0.0))
        placeholder_status = a2_result.get("status", "clarification_required")
        candidate_response = a2_result.get("selected_response", "")
        unresolved_placeholders = a2_result.get("unresolved_placeholders", [])
        resolved_slots = a2_result.get("resolved_slots", {})

        # 3. Canonical Decision Policy Evaluation
        eval_res = self.policy.evaluate(
            query=query_clean,
            intent=top_intent,
            category=predicted_category,
            confidence=confidence,
            margin=margin,
            retrieval_similarity=retrieval_similarity,
            placeholder_status=placeholder_status,
            unresolved_placeholders=unresolved_placeholders,
            alternatives=top_alternatives,
            a1_available=True,
            a2_available=True
        )

        action = eval_res["action"]

        # 4. Synthesize Customer-Facing Response Truthfully
        if action == DecisionAction.PROCEED_AUTOMATED:
            final_response = candidate_response
        elif action == DecisionAction.NEED_SLOT_CLARIFICATION:
            missing_str = ", ".join(unresolved_placeholders) if unresolved_placeholders else "required details"
            final_response = (
                f"To assist you accurately with your request, could you please provide your {missing_str}?"
            )
        elif action == DecisionAction.AMBIGUOUS_INTENT_CLARIFICATION:
            intent1 = top_intent.replace("_", " ")
            intent2 = top_alternatives[1]["intent"].replace("_", " ") if len(top_alternatives) > 1 else "another request"
            final_response = (
                f"I want to make sure I assist you accurately. Are you asking to {intent1}, "
                f"or would you like to {intent2}?"
            )
        elif action == DecisionAction.UNSUPPORTED_REJECTION:
            final_response = (
                "I am trained specifically to help with customer account management, orders, invoices, payments, deliveries, refunds, and subscriptions. "
                "Your inquiry appears to be outside my supported domain. If you need assistance with an existing order or account, please let me know."
            )
        elif action == DecisionAction.ESCALATE_TO_HUMAN:
            final_response = (
                "Your request has been flagged for human support review. Escalation has been recommended, "
                "and your query context has been prepared for handoff to a support specialist once an external ticketing integration is connected."
            )
        else:
            final_response = "Our support service encountered an unexpected condition. Please try again shortly."

        return {
            "decision_state": eval_res["decision_state"],
            "action_verdict": eval_res["action"].value,
            "final_decision": eval_res["final_decision"],
            "reasons": eval_res["reasons"],
            "top_intent": top_intent,
            "category": predicted_category,
            "confidence": round(confidence, 4),
            "margin": round(margin, 4),
            "top_alternatives": top_alternatives,
            "retrieval_similarity": round(retrieval_similarity, 4),
            "placeholder_status": placeholder_status,
            "slot_status": placeholder_status,
            "unresolved_placeholders": unresolved_placeholders,
            "resolved_slots": resolved_slots,
            "final_response": final_response,
            "predicted_category": predicted_category,
            "explanation": {
                "reasons": eval_res.get("reasons", []),
                "decision": eval_res.get("final_decision", ""),
                "metrics_evaluated": {
                    "calibrated_confidence": round(confidence, 4),
                    "margin": round(margin, 4),
                    "retrieval_similarity": round(retrieval_similarity, 4)
                },
                "thresholds_applied": self.policy.config
            }
        }
