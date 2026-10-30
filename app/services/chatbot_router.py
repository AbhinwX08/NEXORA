"""
RELAY AI — Conversational Chatbot Router (Prompt B6)
Coordinates multi-turn conversational interaction with 3 routing modes:
1. deterministic_smalltalk: greetings, thanks, goodbyes, general help.
2. product_guide: answers questions about RELAY AI platform, APIs, architecture, and benchmarks.
3. support_demo: customer support inquiries routed through A1, A2, and ValidationAgent.
"""

import re
from typing import Dict, Any, Optional, Tuple
from app.services.product_guide_service import ProductGuideService
from app.services.session_memory import SessionMemoryManager
from app.services.llm_service import GroundedLLMComposer
from app.orchestration.support_orchestrator import SupportOrchestrator

# Pre-compiled smalltalk pattern matchers
_GREETING_RE = re.compile(r'^\s*(hello|hi|hey|good\s+(?:morning|afternoon|evening)|howdy)\b', re.I)
_THANKS_RE = re.compile(r'^\s*(thanks|thank\s+you|much\s+appreciated|thx)\b', re.I)
_GOODBYE_RE = re.compile(r'^\s*(bye|goodbye|see\s+you|have\s+a\s+good\s+(?:day|one))\b', re.I)
_HELP_RE = re.compile(r'^\s*(help|what\s+can\s+you\s+do|how\s+does\s+this\s+work|menu)\b', re.I)

# Product guide keyword indicators
_PRODUCT_KEYWORDS = [
    "relay ai", "architecture", "what model", "how are you trained",
    "dataset size", "validation accuracy", "f1 score", "platt scaling",
    "api endpoints", "support orchestrator", "intent analyst", "response specialist",
    "evaluation dashboard", "who made you", "what is relay", "calibration",
    "platt", "sigmoid", "ece", "brier", "benchmark", "metrics", "metric"
]


class ChatbotRouter:
    """
    Evaluates customer turn and routes to the appropriate backend capability.
    """

    def __init__(
        self,
        orchestrator: Optional[SupportOrchestrator] = None,
        product_guide: Optional[ProductGuideService] = None,
        session_memory: Optional[SessionMemoryManager] = None
    ):
        self.orchestrator = orchestrator or SupportOrchestrator()
        self.product_guide = product_guide or ProductGuideService()
        self.session_memory = session_memory or SessionMemoryManager()
        self.llm_composer = GroundedLLMComposer()

    def handle_turn(
        self,
        session_id: Optional[str],
        message: str,
        customer_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes one conversational turn and updates session memory.
        """
        session = self.session_memory.get_or_create_session(session_id)
        msg_clean = message.strip()
        msg_lower = msg_clean.lower()

        # -------------------------------------------------------------
        # Mode 1: Deterministic Smalltalk
        # -------------------------------------------------------------
        if _GREETING_RE.search(msg_lower):
            reply = "Hello! I am the RELAY AI support assistant. How can I help you today with your orders, billing, or account?"
            self.session_memory.update_session(session.session_id, msg_clean, reply, intent="greeting", decision="SMALLTALK")
            return {
                "session_id": session.session_id,
                "routing_mode": "deterministic_smalltalk",
                "reply": reply,
                "intent_detected": "greeting",
                "category": "CONTACT",
                "confidence": 1.0,
                "sources": [],
                "clarification_needed": False,
                "escalation_recommended": False,
                "turn_count": len(session.history) + 1
            }

        if _THANKS_RE.search(msg_lower):
            reply = "You're very welcome! Please let me know if there's anything else I can assist you with."
            self.session_memory.update_session(session.session_id, msg_clean, reply, intent="gratitude", decision="SMALLTALK")
            return {
                "session_id": session.session_id,
                "routing_mode": "deterministic_smalltalk",
                "reply": reply,
                "intent_detected": "gratitude",
                "category": "FEEDBACK",
                "confidence": 1.0,
                "sources": [],
                "clarification_needed": False,
                "escalation_recommended": False,
                "turn_count": len(session.history) + 1
            }

        if _GOODBYE_RE.search(msg_lower):
            reply = "Goodbye! Thank you for contacting customer support. Have a wonderful day!"
            self.session_memory.update_session(session.session_id, msg_clean, reply, intent="farewell", decision="SMALLTALK")
            return {
                "session_id": session.session_id,
                "routing_mode": "deterministic_smalltalk",
                "reply": reply,
                "intent_detected": "farewell",
                "category": "CONTACT",
                "confidence": 1.0,
                "sources": [],
                "clarification_needed": False,
                "escalation_recommended": False,
                "turn_count": len(session.history) + 1
            }

        if _HELP_RE.search(msg_lower):
            reply = (
                "I can help you with: \n"
                "• Order status, tracking, and cancellations\n"
                "• Invoices, billing statements, and payments\n"
                "• Refund requests and return policies\n"
                "• Account profile and subscription management\n"
                "Feel free to ask a question or provide an order number!"
            )
            self.session_memory.update_session(session.session_id, msg_clean, reply, intent="help", decision="SMALLTALK")
            return {
                "session_id": session.session_id,
                "routing_mode": "deterministic_smalltalk",
                "reply": reply,
                "intent_detected": "help",
                "category": "CONTACT",
                "confidence": 1.0,
                "sources": [],
                "clarification_needed": False,
                "escalation_recommended": False,
                "turn_count": len(session.history) + 1
            }

        # -------------------------------------------------------------
        # Mode 2: Product Guide (Collection B)
        # -------------------------------------------------------------
        preferred_guide = customer_context and customer_context.get("preferred_mode") == "product_guide"
        is_product_query = preferred_guide or any(k in msg_lower for k in _PRODUCT_KEYWORDS)
        if is_product_query:
            min_sim = 0.05 if preferred_guide else 0.10
            guide_docs = self.product_guide.retrieve(msg_clean, top_k=2, min_similarity=min_sim)
            if guide_docs:
                composed = self.llm_composer.compose(msg_clean, guide_docs, system_role="product_expert")
                self.session_memory.update_session(
                    session.session_id, msg_clean, composed.answer, intent="product_guide_inquiry", decision="PRODUCT_GUIDE"
                )
                return {
                    "session_id": session.session_id,
                    "routing_mode": "product_guide",
                    "reply": composed.answer,
                    "intent_detected": "product_guide_inquiry",
                    "category": "PRODUCT_DOCUMENTATION",
                    "confidence": guide_docs[0]["similarity"],
                    "sources": [
                        {
                            "source_type": "product_guide",
                            "source_id": d["id"],
                            "title": d["title"],
                            "similarity": d["similarity"]
                        }
                        for d in guide_docs
                    ],
                    "clarification_needed": False,
                    "escalation_recommended": False,
                    "turn_count": len(session.history) + 1
                }

        # -------------------------------------------------------------
        # Mode 3: Support Demo (Collection A via SupportOrchestrator)
        # -------------------------------------------------------------
        # Merge accumulated slots from session memory
        slots_to_pass = dict(session.accumulated_slots)
        if customer_context and isinstance(customer_context, dict):
            for k, v in customer_context.items():
                if isinstance(v, str):
                    slots_to_pass[k] = v

        result = self.orchestrator.process_query(
            query=msg_clean,
            customer_slots=slots_to_pass
        )

        # Extract newly discovered slots from A2 if available
        new_slots = {}
        for tr in result.complete_agent_trace:
            if tr.agent_name == "A2_ResponseSpecialist":
                out = tr.output_payload
                if isinstance(out, dict) and "resolved_slots" in out:
                    new_slots.update(out["resolved_slots"])

        self.session_memory.update_session(
            session_id=session.session_id,
            user_message=msg_clean,
            assistant_reply=result.final_response,
            intent=result.intent_prediction,
            category=result.category,
            decision=result.final_decision,
            new_slots=new_slots
        )

        is_escalation = "ESCALATE" in result.final_decision
        is_clarification = "CLARIFICATION" in result.final_decision

        sources = []
        if result.source_example:
            sources.append({
                "source_type": "dataset_exemplar",
                "similarity": result.retrieval_similarity or 0.0,
                "snippet": result.source_example
            })

        return {
            "session_id": session.session_id,
            "routing_mode": "support_demo",
            "reply": result.final_response,
            "intent_detected": result.intent_prediction,
            "category": result.category,
            "confidence": result.calibrated_confidence,
            "margin": result.margin,
            "sources": sources,
            "placeholder_status": result.placeholder_status,
            "unresolved_placeholders": result.unresolved_placeholders,
            "clarification_needed": is_clarification,
            "escalation_recommended": is_escalation,
            "final_decision": result.final_decision,
            "turn_count": len(session.history) + 1
        }

