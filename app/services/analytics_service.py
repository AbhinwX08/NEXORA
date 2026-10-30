"""
RELAY AI — Evidence Records, Decision Replay & Knowledge Gap Analytics (Prompt B8)
Powers backend explainability, decision replay diagnostics, and knowledge gap tracking.
"""

import os
import json
import time
from typing import Dict, Any, List, Optional
from app.schemas.agent_models import OrchestratorResult, AgentStatus
from app.services.session_memory import SessionState

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def build_resolution_evidence_record(result: OrchestratorResult) -> Dict[str, Any]:
    """
    Feature A: Resolution Evidence Record.
    Classifies each data point by provenance:
    - model_prediction: ML intent classification and calibrated Platt probabilities
    - dataset_example: Matched training exemplar from train.csv (with source_id)
    - deterministic_check: ValidationAgent 7-point safety and completeness gates
    - user_provided: Customer-supplied parameters or context slots
    - externally_verified: Honest state indicating whether external DB/ERP is integrated
    """
    evidence_items = []

    # 1. Model Prediction Provenance
    evidence_items.append({
        "provenance_type": "model_prediction",
        "component": "A1_IntentAnalyst",
        "metric": "intent_prediction",
        "value": result.intent_prediction,
        "category": result.category,
        "calibrated_confidence": result.calibrated_confidence,
        "margin": result.margin,
        "description": "Platt sigmoid calibrated multi-class probability."
    })

    # 2. Dataset Exemplar Provenance
    if result.source_example:
        evidence_items.append({
            "provenance_type": "dataset_example",
            "component": "A2_ResponseSpecialist",
            "source_split": "train.csv (18,810 samples)",
            "similarity_score": result.retrieval_similarity,
            "matched_instruction": result.source_example,
            "description": "Cosine similarity match over training customer support corpus."
        })

    # 3. Deterministic Validation Checks
    for chk in result.validation_checks:
        evidence_items.append({
            "provenance_type": "deterministic_check",
            "component": "ValidationAgent",
            "check_name": chk.check_name,
            "passed": chk.passed,
            "detail": chk.detail
        })

    # 4. User Provided Slots
    resolved_slots = {}
    for trace in result.complete_agent_trace:
        if trace.agent_name == "A2_ResponseSpecialist":
            resolved_slots = trace.output_payload.get("resolved_slots", {})

    for k, v in resolved_slots.items():
        evidence_items.append({
            "provenance_type": "user_provided",
            "slot_name": k,
            "slot_value": v,
            "description": "Extracted from customer query or supplied in request payload."
        })

    # 5. External Verification Status
    evidence_items.append({
        "provenance_type": "externally_verified",
        "status": "unconfigured",
        "description": "External ERP, order tracking, and live ticketing integrations are not configured."
    })

    return {
        "query": result.original_customer_query,
        "final_decision": result.final_decision,
        "total_duration_ms": result.total_duration_ms,
        "evidence_count": len(evidence_items),
        "evidence_items": evidence_items,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }


def execute_decision_replay(
    orchestrator,
    query_a: str,
    query_b: str,
    slots_a: Optional[Dict[str, str]] = None,
    slots_b: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Feature B: Decision Replay.
    Executes two real query variants through the actual multi-agent pipeline
    and computes genuine execution deltas without hypothetical scores.
    """
    res_a: OrchestratorResult = orchestrator.process_query(query=query_a, customer_slots=slots_a)
    res_b: OrchestratorResult = orchestrator.process_query(query=query_b, customer_slots=slots_b)

    intent_match = res_a.intent_prediction == res_b.intent_prediction
    conf_delta = round(res_b.calibrated_confidence - res_a.calibrated_confidence, 4)
    margin_delta = round(res_b.margin - res_a.margin, 4)
    sim_a = res_a.retrieval_similarity or 0.0
    sim_b = res_b.retrieval_similarity or 0.0
    sim_delta = round(sim_b - sim_a, 4)
    decision_identical = res_a.final_decision == res_b.final_decision

    return {
        "variant_a": {
            "query": query_a,
            "intent": res_a.intent_prediction,
            "category": res_a.category,
            "confidence": res_a.calibrated_confidence,
            "margin": res_a.margin,
            "similarity": res_a.retrieval_similarity,
            "final_decision": res_a.final_decision,
            "duration_ms": res_a.total_duration_ms
        },
        "variant_b": {
            "query": query_b,
            "intent": res_b.intent_prediction,
            "category": res_b.category,
            "confidence": res_b.calibrated_confidence,
            "margin": res_b.margin,
            "similarity": res_b.retrieval_similarity,
            "final_decision": res_b.final_decision,
            "duration_ms": res_b.total_duration_ms
        },
        "comparison": {
            "intent_match": intent_match,
            "decision_identical": decision_identical,
            "confidence_delta": conf_delta,
            "margin_delta": margin_delta,
            "similarity_delta": sim_delta,
            "latency_delta_ms": round(res_b.total_duration_ms - res_a.total_duration_ms, 2)
        }
    }


class KnowledgeGapDetector:
    """
    Feature C: Knowledge Gap Detector.
    Records weak/unsupported customer inquiries into an auditable diagnostic report.
    """

    def __init__(self, log_path: Optional[str] = None):
        self.log_path = log_path or os.path.join(_PROJECT_ROOT, "reports/knowledge_gaps.json")
        os.makedirs(os.path.dirname(self.log_path), exist_ok=True)

    def record_if_gap(self, query: str, result: OrchestratorResult):
        sim = result.retrieval_similarity or 0.0
        is_gap = (sim < 0.35) or ("UNSUPPORTED" in result.final_decision) or (result.calibrated_confidence < 0.50)

        if not is_gap:
            return

        gaps = []
        if os.path.exists(self.log_path):
            try:
                with open(self.log_path, "r", encoding="utf-8") as f:
                    gaps = json.load(f)
            except Exception:
                gaps = []

        gaps.append({
            "query": query,
            "predicted_intent": result.intent_prediction,
            "confidence": result.calibrated_confidence,
            "retrieval_similarity": sim,
            "final_decision": result.final_decision,
            "logged_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        })

        # Keep last 100 gaps
        with open(self.log_path, "w", encoding="utf-8") as f:
            json.dump(gaps[-100:], f, indent=2)


def generate_conversation_summary(session: SessionState) -> Dict[str, Any]:
    """
    Feature D: Conversation Summary.
    Generates a concise structured summary from session turns.
    """
    intents = [turn.intent_detected for turn in session.history if turn.intent_detected]
    primary_intent = intents[-1] if intents else "unknown"

    return {
        "session_id": session.session_id,
        "turns_completed": len(session.history),
        "primary_intent": primary_intent,
        "resolved_parameters": session.accumulated_slots,
        "last_decision": session.history[-1].decision if session.history else None,
        "recommended_next_step": "Awaiting customer response" if session.history else "New session"
    }

