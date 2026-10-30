"""
RELAY AI — Agent 3: Decision & Uncertainty Specialist
Orchestrates calibrated prediction confidence, uncertainty routing, and response safety.
Combines:
- A1 calibrated intent confidence (Platt sigmoid probability)
- A1 prediction margin (P1 - P2)
- A2 retrieval similarity (Combined TF-IDF cosine score)
- Response placeholder status and slot resolution
- Escalation keywords and policy boundaries

Routes queries into 4 explicit decision states:
1. HIGH_CONFIDENCE: Proceed with automated answer or specific slot request
2. UNCERTAIN: Request intent clarification between top alternatives
3. UNSUPPORTED: Politely reject out-of-domain or gibberish requests
4. HUMAN_ESCALATION: Seamlessly hand off to human support
"""

import os
import sys
import json
import re
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


class DecisionAgent:
    """
    Agent 3: Decision & Uncertainty Specialist.
    Evaluates compound uncertainty and determines final customer-facing action.
    """

    def __init__(
        self,
        calibrated_model_path: str = "artifacts/models/calibrated_intent_classifier.joblib",
        calibration_config_path: str = "artifacts/models/calibration_config.json",
        retriever_path: str = "artifacts/models/response_retriever.joblib"
    ):
        self.calibrated_model_path = os.path.abspath(calibrated_model_path)
        self.calibration_config_path = os.path.abspath(calibration_config_path)
        self.retriever_path = os.path.abspath(retriever_path)

        # 1. Load Calibration Config
        if os.path.exists(self.calibration_config_path):
            with open(self.calibration_config_path, "r", encoding="utf-8") as f:
                self.config = json.load(f)
        else:
            self.config = self._default_config()

        # 2. Load Calibrated Intent Classifier
        if os.path.exists(self.calibrated_model_path):
            artifact = joblib.load(self.calibrated_model_path)
            self.classifier = artifact["calibrated_model"]
            self.classes = np.array(artifact["classes"])
            self.intent_to_cat = artifact["intent_to_category_mapping"]
        else:
            raise FileNotFoundError(f"Calibrated model artifact not found at: {self.calibrated_model_path}")

        # 3. Load Response Specialist (A2)
        if os.path.exists(self.retriever_path):
            service = RetrievalService.load(self.retriever_path)
            self.response_agent = ResponseAgent(retrieval_service=service)
        else:
            raise FileNotFoundError(f"Retriever artifact not found at: {self.retriever_path}")

    @staticmethod
    def _default_config() -> dict:
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

    def evaluate_query(self, query: str, customer_slots: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
        """
        Executes end-to-end uncertainty assessment and returns inspectable decision object.
        """
        if not isinstance(query, str) or not query.strip():
            return self._empty_query_response()

        query_clean = query.strip()
        q_lower = query_clean.lower()

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
        # Query A2 in intent-restricted mode based on top predicted intent
        a2_result = self.response_agent.process_query(
            query=query_clean,
            predicted_intent=top_intent,
            customer_slots=customer_slots,
            method="combined"
        )
        retrieval_similarity = float(a2_result.get("retrieval_similarity", 0.0))
        slot_status = a2_result.get("status", "clarification_required")
        candidate_response = a2_result.get("selected_response", "")
        unresolved_placeholders = a2_result.get("unresolved_placeholders", [])
        resolved_slots = a2_result.get("resolved_slots", {})

        # 3. Keyword and Policy Inspection
        esc_keywords = self.config.get("human_escalation_keywords", [])
        matched_esc_keywords = [kw for kw in esc_keywords if kw in q_lower]
        is_escalation_intent = top_intent in self.config.get("human_escalation_intents", [])

        # Thresholds
        conf_thresh = self.config["intent_confidence_thresholds"]["high_confidence_min_prob"]
        margin_thresh = self.config["intent_confidence_thresholds"]["high_confidence_min_margin"]
        unsup_prob_thresh = self.config["intent_confidence_thresholds"]["unsupported_max_prob"]
        unsup_margin_thresh = self.config["intent_confidence_thresholds"]["unsupported_max_margin"]
        sim_high_thresh = self.config["retrieval_thresholds"]["high_confidence_min_similarity"]
        sim_unsup_thresh = self.config["retrieval_thresholds"]["unsupported_similarity_threshold"]

        # 4. Hierarchical Decision Gate
        reasons = []

        # Gate A: Human Escalation
        if is_escalation_intent or len(matched_esc_keywords) > 0:
            decision_state = "HUMAN_ESCALATION"
            action_verdict = "ESCALATE_TO_HUMAN"
            if matched_esc_keywords:
                reasons.append(f"Explicit escalation request detected matching keyword(s): {matched_esc_keywords}")
            if is_escalation_intent:
                reasons.append(f"Predicted intent '{top_intent}' is a designated human escalation contact route")
            final_response = (
                "I am connecting you with a member of our human support team right away. "
                "Our representatives are available Monday to Friday, 9:00 AM – 6:00 PM EST at 1-800-RELAY-AI, "
                "or you can continue chatting with an agent shortly. Your request context has been transferred."
            )

        # Gate B: Unsupported / Out-of-Domain
        elif confidence < unsup_prob_thresh or retrieval_similarity < sim_unsup_thresh or (margin < unsup_margin_thresh and confidence < 0.40):
            decision_state = "UNSUPPORTED"
            action_verdict = "UNSUPPORTED_REJECTION"
            if confidence < unsup_prob_thresh:
                reasons.append(f"Calibrated probability ({confidence:.4f}) is below minimum domain threshold ({unsup_prob_thresh:.2f})")
            if retrieval_similarity < sim_unsup_thresh:
                reasons.append(f"Knowledge-base retrieval similarity ({retrieval_similarity:.4f}) is below out-of-domain cutoff ({sim_unsup_thresh:.2f})")
            if margin < unsup_margin_thresh:
                reasons.append(f"Prediction margin ({margin:.4f}) is flat across multiple candidate classes")
            final_response = (
                "I am trained specifically to help with RELAY AI accounts, orders, invoices, payments, deliveries, and returns. "
                "Your inquiry appears to be outside my supported domain. If you require general assistance, please contact our support team at support@relay.ai."
            )

        # Gate C: Uncertain / Ambiguous
        elif confidence < conf_thresh or margin < margin_thresh or retrieval_similarity < sim_high_thresh:
            decision_state = "UNCERTAIN"
            action_verdict = "AMBIGUOUS_INTENT_CLARIFICATION"
            if margin < margin_thresh:
                alt1 = top_alternatives[0]["intent"].replace("_", " ")
                alt2 = top_alternatives[1]["intent"].replace("_", " ")
                reasons.append(f"Low separation margin ({margin:.4f} < {margin_thresh:.2f}) between '{alt1}' ({confidence:.2f}) and '{alt2}' ({top_probs[1]:.2f})")
                final_response = (
                    f"I want to make sure I assist you accurately. Are you asking to {alt1}, or would you like to {alt2}?"
                )
            elif confidence < conf_thresh:
                reasons.append(f"Calibrated intent confidence ({confidence:.4f}) is borderline ({unsup_prob_thresh:.2f} <= P < {conf_thresh:.2f})")
                final_response = (
                    f"To make sure I route your request correctly, could you please clarify if your request is related to {top_intent.replace('_', ' ')}?"
                )
            else:
                reasons.append(f"Retrieval similarity ({retrieval_similarity:.4f}) is below confident match threshold ({sim_high_thresh:.2f})")
                final_response = (
                    "I understand you may need help with your request, but I couldn't locate an exact procedure match in our current documentation. Could you please provide a few more details?"
                )

        # Gate D: High Confidence
        else:
            decision_state = "HIGH_CONFIDENCE"
            reasons.append(f"Calibrated probability ({confidence:.4f}) meets high confidence threshold (>= {conf_thresh:.2f})")
            reasons.append(f"Prediction margin ({margin:.4f}) exceeds separation threshold (>= {margin_thresh:.2f})")
            reasons.append(f"Retrieval similarity ({retrieval_similarity:.4f}) meets knowledge match threshold (>= {sim_high_thresh:.2f})")

            if slot_status == "resolved":
                action_verdict = "PROCEED_AUTOMATED"
                reasons.append("All required response placeholders and customer parameters successfully resolved")
                final_response = candidate_response
            else:
                action_verdict = "NEED_SLOT_CLARIFICATION"
                missing_str = ", ".join(unresolved_placeholders)
                reasons.append(f"Missing essential customer parameter(s): {missing_str}")
                final_response = f"To assist you accurately with your {top_intent.replace('_', ' ')} request, could you please provide your {missing_str}?"

        return {
            "query": query_clean,
            "decision_state": decision_state,
            "action_verdict": action_verdict,
            "top_intent": top_intent,
            "predicted_category": predicted_category,
            "confidence": round(confidence, 4),
            "margin": round(margin, 4),
            "top_alternatives": top_alternatives,
            "retrieval_similarity": round(retrieval_similarity, 4),
            "slot_status": slot_status,
            "unresolved_placeholders": unresolved_placeholders,
            "resolved_slots": resolved_slots,
            "final_response": final_response,
            "explanation": {
                "decision_state": decision_state,
                "action_verdict": action_verdict,
                "reasons": reasons,
                "metrics_evaluated": {
                    "calibrated_prob": round(confidence, 4),
                    "margin": round(margin, 4),
                    "retrieval_similarity": round(retrieval_similarity, 4),
                    "matched_escalation_keywords": matched_esc_keywords,
                    "is_escalation_intent": is_escalation_intent
                },
                "thresholds_applied": {
                    "confidence_threshold": conf_thresh,
                    "margin_threshold": margin_thresh,
                    "retrieval_similarity_threshold": sim_high_thresh,
                    "unsupported_prob_threshold": unsup_prob_thresh
                }
            }
        }

    def _empty_query_response(self) -> Dict[str, Any]:
        return {
            "query": "",
            "decision_state": "UNSUPPORTED",
            "action_verdict": "UNSUPPORTED_REJECTION",
            "top_intent": "none",
            "predicted_category": "UNKNOWN",
            "confidence": 0.0,
            "margin": 0.0,
            "top_alternatives": [],
            "retrieval_similarity": 0.0,
            "slot_status": "clarification_required",
            "unresolved_placeholders": [],
            "resolved_slots": {},
            "final_response": "Please enter a valid customer support query.",
            "explanation": {
                "reasons": ["Empty or null query string received"]
            }
        }


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="RELAY AI — Agent 3 (Decision & Uncertainty Specialist)")
    parser.add_argument("query", nargs="?", default="I want to cancel my order #98214", help="Customer query to evaluate")
    args = parser.parse_args()

    agent = DecisionAgent()
    result = agent.evaluate_query(args.query)

    print("\n" + "=" * 65)
    print("RELAY AI — DECISION & UNCERTAINTY AGENT EVALUATION")
    print("=" * 65)
    print(f"Customer Query:       {result['query']}")
    print(f"Decision State:       {result['decision_state']}")
    print(f"Action Verdict:       {result['action_verdict']}")
    print(f"Top Intent:           {result['top_intent']} ({result['predicted_category']})")
    print(f"Calibrated Conf:      {result['confidence']*100:.2f}% | Margin: {result['margin']*100:.2f}%")
    print(f"Retrieval Sim:        {result['retrieval_similarity']:.4f}")
    print(f"Slot Status:          {result['slot_status']}")
    print("-" * 65)
    print("Top 3 Alternatives:")
    for alt in result["top_alternatives"]:
        print(f"  [{alt['rank']}] {alt['intent']:28s} ({alt['category']:10s}) : {alt['probability']*100:.2f}%")
    print("-" * 65)
    print("Inspectable Explanation:")
    for r in result["explanation"]["reasons"]:
        print(f"  • {r}")
    print("-" * 65)
    print(f"Final Output Response:\n{result['final_response']}")
    print("=" * 65 + "\n")
