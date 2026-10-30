"""
RELAY AI — Multi-Agent Orchestrator (Phase 5)
Coordinates Agent 1 (Intent Analyst), Agent 2 (Response Specialist), and Validation Agent.
Enforces typed Pydantic contracts, failure handling, uncertainty routing, and full execution traces.
"""

import os
import sys
import time
import json
from typing import Dict, Any, List, Optional

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
    A2RetrievalHandoff,
    ValidationCheckItem,
    ValidationHandoff,
    OrchestratorResult,
)
from app.agents.intent_agent import IntentAnalystAgent
from app.agents.response_agent import ResponseAgent
from app.agents.validation_agent import ValidationAgent


class SupportOrchestrator:
    """
    Coordinates the multi-agent customer support workflow:
    Query -> A1 Intent -> Confidence Check -> A2 Retrieval -> Validation -> Final Resolution.
    """

    def __init__(
        self,
        intent_model_path: Optional[str] = None,
        calibration_config_path: Optional[str] = None,
        retriever_path: Optional[str] = None,
        allow_fallback: bool = False
    ):
        def _resolve(path: Optional[str], default_rel: str) -> str:
            target = path or default_rel
            if os.path.isabs(target) and os.path.exists(target):
                return target
            root_cand = os.path.join(_PROJECT_ROOT, target)
            if os.path.exists(root_cand):
                return root_cand
            return target

        final_intent = _resolve(intent_model_path, "artifacts/models/intent_classifier.joblib")
        final_config = _resolve(calibration_config_path, "artifacts/models/calibration_config.json")
        final_retriever = _resolve(retriever_path, "artifacts/models/response_retriever.joblib")

        self.intent_agent = IntentAnalystAgent(
            model_path=final_intent,
            config_path=final_config,
            allow_fallback=allow_fallback if intent_model_path is not None else True
        )
        self.response_agent = ResponseAgent(
            retriever_path=final_retriever,
            allow_fallback=allow_fallback
        )
        self.validation_agent = ValidationAgent(
            config_path=final_config
        )

    def process_query(
        self,
        query: str,
        customer_slots: Optional[Dict[str, str]] = None
    ) -> OrchestratorResult:
        """
        Executes end-to-end multi-agent support workflow with complete trace and error handling.
        """
        t0_total = time.time()
        agent_traces: List[AgentTrace] = []

        query_clean = query.strip() if query else ""

        # =========================================================================
        # STEP 1: A1 — INTENT ANALYST
        # =========================================================================
        a1_handoff, a1_trace = self.intent_agent.process(query_clean)
        agent_traces.append(a1_trace)

        # Failure Handling: A1 Unavailable / Error
        if a1_handoff is None:
            dur_total_ms = round((time.time() - t0_total) * 1000, 2)
            return OrchestratorResult(
                original_customer_query=query_clean,
                intent_prediction="service_error",
                category="ERROR",
                calibrated_confidence=0.0,
                margin=0.0,
                alternative_intents=[],
                retrieved_response=None,
                source_example=None,
                retrieval_similarity=None,
                placeholder_status=None,
                unresolved_placeholders=[],
                validation_checks=[
                    ValidationCheckItem(
                        check_name="a1_availability",
                        passed=False,
                        detail="A1 Intent Analyst is unavailable or failed to process query."
                    )
                ],
                final_decision="SERVICE_ERROR: INTENT_ANALYST_UNAVAILABLE",
                final_response="Our customer support service is currently experiencing technical difficulties. Please try again shortly or contact support@relay.ai.",
                complete_agent_trace=agent_traces,
                total_duration_ms=dur_total_ms
            )

        # =========================================================================
        # STEP 2: A2 — RESPONSE SPECIALIST (Contextual Retrieval)
        # Passed original query AND predicted intent AND category
        # =========================================================================
        a2_handoff = None
        # Only query retrieval if not an immediate escalation
        if a1_handoff.uncertainty_verdict != "ESCALATE":
            a2_handoff, a2_trace = self.response_agent.process(
                query=query_clean,
                intent_handoff=a1_handoff,
                customer_slots=customer_slots
            )
            agent_traces.append(a2_trace)
        else:
            # Escalation: A2 skipped
            skip_trace = AgentTrace(
                agent_name="A2_ResponseSpecialist",
                processing_status=AgentStatus.SKIPPED,
                input_payload={"reason": "Human escalation condition detected; knowledge base retrieval bypassed."},
                output_payload={},
                decision_reason="Skipped retrieval because customer request requires human agent routing.",
                duration_ms=0.0
            )
            agent_traces.append(skip_trace)

        # Failure Handling: A2 Unavailable
        if a2_handoff is None and a1_handoff.uncertainty_verdict != "ESCALATE":
            dur_total_ms = round((time.time() - t0_total) * 1000, 2)
            return OrchestratorResult(
                original_customer_query=query_clean,
                intent_prediction=a1_handoff.top_intent,
                category=a1_handoff.category,
                calibrated_confidence=a1_handoff.calibrated_confidence,
                margin=a1_handoff.margin,
                alternative_intents=a1_handoff.alternative_intents,
                retrieved_response=None,
                source_example=None,
                retrieval_similarity=None,
                placeholder_status=None,
                unresolved_placeholders=[],
                validation_checks=[
                    ValidationCheckItem(
                        check_name="a2_availability",
                        passed=False,
                        detail="A2 Response Specialist is unavailable."
                    )
                ],
                final_decision="SERVICE_ERROR: RESPONSE_SPECIALIST_UNAVAILABLE",
                final_response="We have identified your intent, but our response generation system is temporarily offline. A support representative will review your inquiry shortly.",
                complete_agent_trace=agent_traces,
                total_duration_ms=dur_total_ms
            )

        # =========================================================================
        # STEP 3: VALIDATION AGENT (Reliability, Safety, Completeness)
        # =========================================================================
        val_handoff, val_trace = self.validation_agent.process(
            query=query_clean,
            intent_handoff=a1_handoff,
            retrieval_handoff=a2_handoff
        )
        agent_traces.append(val_trace)

        # =========================================================================
        # STEP 4: FINAL DECISION & OUTPUT SYNTHESIS
        # =========================================================================
        action = val_handoff.final_action
        final_decision = f"{val_handoff.decision_state}: {action}"

        if action == "PROCEED_AUTOMATED":
            final_response = a2_handoff.retrieved_response if a2_handoff else ""
        elif action == "NEED_SLOT_CLARIFICATION":
            missing_slots = a2_handoff.unresolved_placeholders if a2_handoff else []
            missing_str = ", ".join(missing_slots) if missing_slots else "additional details"
            intent_label = a1_handoff.top_intent.replace("_", " ")
            final_response = (
                f"To assist you accurately with your {intent_label} request, "
                f"could you please provide your {missing_str}?"
            )
        elif action == "AMBIGUOUS_INTENT_CLARIFICATION":
            intent1 = a1_handoff.top_intent.replace("_", " ")
            alt_list = a1_handoff.alternative_intents
            intent2 = alt_list[1].intent.replace("_", " ") if len(alt_list) > 1 else "another inquiry"
            final_response = (
                f"I want to make sure I assist you accurately. Are you asking to {intent1}, "
                f"or would you like to {intent2}?"
            )
        elif action == "UNSUPPORTED_REJECTION":
            final_response = (
                "I am trained specifically to help with RELAY AI accounts, orders, invoices, payments, deliveries, and returns. "
                "Your inquiry appears to be outside my supported domain. If you need assistance with an existing order or account, please let me know."
            )
        elif action == "ESCALATE_TO_HUMAN":
            final_response = (
                "I am connecting you with a member of our human support team right away. "
                "Our representatives are available Monday to Friday, 9:00 AM – 6:00 PM EST at 1-800-RELAY-AI. "
                "Your conversation context has been transferred to the next available agent."
            )
        else:
            final_response = "Our support system encountered an unexpected condition. Please contact support@relay.ai."

        dur_total_ms = round((time.time() - t0_total) * 1000, 2)

        return OrchestratorResult(
            original_customer_query=query_clean,
            intent_prediction=a1_handoff.top_intent,
            category=a1_handoff.category,
            calibrated_confidence=a1_handoff.calibrated_confidence,
            margin=a1_handoff.margin,
            alternative_intents=a1_handoff.alternative_intents,
            retrieved_response=a2_handoff.retrieved_response if a2_handoff else None,
            source_example=a2_handoff.source_example if a2_handoff else None,
            retrieval_similarity=a2_handoff.retrieval_similarity if a2_handoff else None,
            placeholder_status=a2_handoff.placeholder_status if a2_handoff else None,
            unresolved_placeholders=a2_handoff.unresolved_placeholders if a2_handoff else [],
            validation_checks=val_handoff.checks,
            final_decision=final_decision,
            final_response=final_response,
            complete_agent_trace=agent_traces,
            total_duration_ms=dur_total_ms
        )


def main():
    """CLI test entrypoint for Multi-Agent Orchestrator."""
    import argparse
    parser = argparse.ArgumentParser(description="RELAY AI — Multi-Agent Customer Support Orchestrator (Phase 5)")
    parser.add_argument("query", nargs="?", default="I want to cancel my order #98214", help="Customer query to process")
    args = parser.parse_args()

    orchestrator = SupportOrchestrator()
    result = orchestrator.process_query(args.query)

    print("\n" + "=" * 70)
    print("RELAY AI — MULTI-AGENT ORCHESTRATION RESULT")
    print("=" * 70)
    print(f"Customer Query:         {result.original_customer_query}")
    print(f"Intent Prediction:      {result.intent_prediction} ({result.category})")
    print(f"Calibrated Confidence:  {result.calibrated_confidence*100:.2f}% | Margin: {result.margin*100:.2f}%")
    print(f"Retrieval Similarity:   {result.retrieval_similarity if result.retrieval_similarity is not None else 'N/A'}")
    print(f"Placeholder Status:     {result.placeholder_status or 'N/A'}")
    print(f"Final Decision:         {result.final_decision}")
    print(f"Total Workflow Latency: {result.total_duration_ms:.2f} ms")
    print("-" * 70)
    print("Top 3 Alternative Intents:")
    for alt in result.alternative_intents:
        print(f"  [{alt.rank}] {alt.intent:28s} ({alt.category:10s}) : {alt.probability*100:.2f}%")
    print("-" * 70)
    print("Validation Checks:")
    for chk in result.validation_checks:
        status_str = "PASS" if chk.passed else "FLAG"
        print(f"  [{status_str}] {chk.check_name:30s} : {chk.detail}")
    print("-" * 70)
    print("Complete Agent Trace:")
    for tr in result.complete_agent_trace:
        print(f"  • {tr.agent_name:24s} [{tr.processing_status.value:12s}] in {tr.duration_ms:6.2f}ms | Reason: {tr.decision_reason}")
    print("-" * 70)
    print(f"Final Customer Response:\n{result.final_response}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
