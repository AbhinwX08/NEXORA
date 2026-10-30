"""
RELAY AI — Agent 2: Response Specialist
Retrieves the most suitable customer support response from the indexed knowledge base.
Performs placeholder detection, slot extraction, and enforces safety rules:
- Never fabricates customer information.
- Never exposes unresolved placeholders as completed customer responses.
- Flags 'clarification_required' when essential customer parameters are missing.
"""

import os
import re
import sys
from typing import Dict, Any, List, Optional
import joblib

# Add project root and src to sys.path
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)
_SRC_DIR = os.path.join(_PROJECT_ROOT, "src")
if _SRC_DIR not in sys.path:
    sys.path.insert(0, _SRC_DIR)

from app.services.retrieval_service import RetrievalService
from app.schemas.agent_models import (
    AgentStatus,
    AgentTrace,
    A1IntentHandoff,
    A2RetrievalHandoff,
)


class ResponseAgent:
    """
    Agent 2: Response Specialist.
    Retrieves, validates, and parameterizes customer support responses.
    """

    # Neutral platform navigation references.
    # Note: Invented phone numbers (1-800-RELAY-AI), fake emails (support@relay.ai),
    # fake URLs (https://relay.ai), fabricated support hours and unverified delivery
    # times have been removed. Any business-specific contact channels or integration
    # values must be provided via customer_slots or external business configuration.
    SYSTEM_CONSTANTS = {
        "Company": "Customer Support",
        "Company Name": "Customer Support",
        "CompanyName": "Customer Support",
        "Website URL": "our official website",
        "Online Company Portal Info": "customer account portal",
        "Customer Support Phone Number": "our customer support line",
        "Customer Support Hours": "operating support hours",
        "Customer Support Email": "our customer support team",
        "Customer Assistance Phone Number": "our customer assistance line",
        "Customer Assistance Hours": "operating support hours",
        "Customer Assistance Email": "our customer assistance team",
        "Login Page URL": "the customer login page",
        "Login URL": "the customer login page",
        "Store Location": "our official store",
        "Online Order Interaction": "Order Details",
        "Key Recovery Page URL": "the account recovery page",
        "Password Recovery Page URL": "the password reset page",
        "Account Recovery Page URL": "the account recovery page",
        "Date Range": "applicable policy window",
        "Delivery Time": "standard delivery timeframe",
    }

    # Customer-specific slots that require actual customer input
    CUSTOMER_SLOTS = {
        "Order Number", "order number", "Order/Claim Number", "Order/Transaction ID",
        "Invoice Number", "Date of the Bill", "Date of the Invoice",
        "Refund Amount", "Money Amount", "Currency Symbol",
        "Tracking Number", "tracking number",
        "Account Type", "Account Category", "Profile Type", "Account ID", "Account Number",
        "Person Name", "Client First Name", "Client Last Name", "Client Full Name", "Salutation",
        "Delivery City", "Delivery Country",
        "Email Address", "email address",
        "Case Number", "Rebate Number", "Rebate Tracking Number", "Reimbursement ID"
    }

    def __init__(
        self,
        retrieval_service: Optional[RetrievalService] = None,
        retriever_path: Optional[str] = "artifacts/models/response_retriever.joblib",
        classifier_path: Optional[str] = "artifacts/models/intent_classifier.joblib",
        allow_fallback: bool = True
    ):
        if retrieval_service is not None:
            self.retriever = retrieval_service
        elif retriever_path and os.path.exists(retriever_path):
            print(f"[ResponseAgent] Loading pre-built retrieval service from: {retriever_path}...")
            self.retriever = RetrievalService.load(retriever_path)
        elif allow_fallback:
            # Fall back to building index from train.csv
            default_train = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                "data/raw/train.csv"
            )
            if os.path.exists(default_train):
                print(f"[ResponseAgent] Building new retrieval service from: {default_train}...")
                self.retriever = RetrievalService(train_path=default_train)
            else:
                self.retriever = None
        else:
            self.retriever = None

        # Optional standalone intent classifier fallback (A1)
        self.classifier = None
        if classifier_path and os.path.exists(classifier_path):
            try:
                clf_artifact = joblib.load(classifier_path)
                if isinstance(clf_artifact, dict) and "pipeline" in clf_artifact:
                    self.classifier = clf_artifact["pipeline"]
                else:
                    self.classifier = clf_artifact
            except Exception as e:
                print(f"[ResponseAgent] Note: Standalone classifier not loaded: {e}")

    def extract_slots_from_query(self, query: str) -> Dict[str, str]:
        """
        Extracts known entity values from the customer's query with contextual disambiguation.
        Prevents treating an order number simultaneously as an invoice number without context.
        """
        slots = {}
        if not isinstance(query, str):
            return slots

        q_lower = query.lower()

        # 1. Explicit Tracking Numbers (e.g. TRK-88219, tracking #9821, courier TRK9901)
        track_explicit = re.search(r'\b(?:TRK|TRACK)[-_]?([A-Z0-9]{5,20})\b', query, re.I)
        track_context = re.search(r'\b(?:tracking|track|courier)\s*(?:#|number|id|no\.?)?\s*([A-Z0-9]{5,20})\b', query, re.I)
        if track_explicit:
            val = track_explicit.group(0).upper()
            slots["Tracking Number"] = val
            slots["tracking number"] = val
        elif track_context:
            val = track_context.group(1).upper()
            slots["Tracking Number"] = val
            slots["tracking number"] = val

        # 2. Invoice / Billing Identifiers (e.g. INV-9042, BILL-102, invoice #1234)
        inv_explicit = re.search(r'\b(?:INV|BILL)[-_]?([0-9]{3,12})\b', query, re.I)
        inv_context = re.search(r'\b(?:invoice|bill|receipt|billing)\s*(?:#|number|id|no\.?)?\s*([0-9]{3,12})\b', query, re.I)
        if inv_explicit:
            val = inv_explicit.group(0).upper()
            slots["Invoice Number"] = val
        elif inv_context:
            val = inv_context.group(1)
            slots["Invoice Number"] = val

        # 3. Order Identifiers (e.g. order #98214, ord 113542617735902, purchase #1002)
        order_context = re.search(r'\b(?:order|ord|purchase)\s*(?:#|number|id|no\.?)?\s*([0-9]{4,18})\b', query, re.I)
        if order_context:
            val = order_context.group(1)
            slots["Order Number"] = val
            slots["order number"] = val
            slots["Order/Claim Number"] = val
            slots["Order/Transaction ID"] = val

        # 4. Bare numeric hashes (e.g. #98214) disambiguated by query context
        if "Order Number" not in slots and "Invoice Number" not in slots and "Tracking Number" not in slots:
            bare_hash = re.search(r'#([0-9]{4,18})\b', query)
            if bare_hash:
                val = bare_hash.group(1)
                if any(w in q_lower for w in ["invoice", "bill", "billing", "receipt"]):
                    slots["Invoice Number"] = val
                elif any(w in q_lower for w in ["track", "ship", "courier", "delivery"]):
                    slots["Tracking Number"] = val
                    slots["tracking number"] = val
                else:
                    slots["Order Number"] = val
                    slots["order number"] = val
                    slots["Order/Claim Number"] = val
                    slots["Order/Transaction ID"] = val

        # 5. Monetary amounts ($50, $29.99, 50 dollars)
        money_m = re.search(r'(\$\s*[0-9]+(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?\s*(?:dollars|usd))', query, re.I)
        if money_m:
            val = money_m.group(1).strip()
            # Clean dollar symbol
            clean_num = re.sub(r'[^\d.]', '', val)
            slots["Refund Amount"] = clean_num
            slots["Money Amount"] = clean_num
            slots["Currency Symbol"] = "$"

        # 6. Account types (gold, platinum, premium, pro, standard, freemium, free)
        acc_m = re.search(r'\b(gold|platinum|premium|pro|standard|freemium|free)\b', query, re.I)
        if acc_m:
            val = acc_m.group(1).capitalize()
            slots["Account Type"] = val
            slots["Account Category"] = val
            slots["Profile Type"] = val

        # 7. Email address
        email_m = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', query)
        if email_m:
            slots["Email Address"] = email_m.group(0)
            slots["email address"] = email_m.group(0)

        return slots

    def process_placeholders(
        self,
        template_response: str,
        extracted_slots: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Detects all {{Variable}} placeholders in response template.
        Resolves known static constants and extracted customer slots.
        Returns resolved text, unresolved customer variables, and status.
        """
        placeholder_regex = re.compile(r'\{\{([^}]+)\}\}')
        all_placeholders = placeholder_regex.findall(template_response)

        resolved_text = template_response
        unresolved_customer_vars = []
        resolved_dict = {}

        for var in all_placeholders:
            var_clean = var.strip()
            # 1. Check extracted customer slots
            if var_clean in extracted_slots:
                val = extracted_slots[var_clean]
                resolved_text = resolved_text.replace(f"{{{{{var}}}}}", val)
                resolved_dict[var_clean] = val
            # 2. Check system static constants
            elif var_clean in self.SYSTEM_CONSTANTS:
                val = self.SYSTEM_CONSTANTS[var_clean]
                resolved_text = resolved_text.replace(f"{{{{{var}}}}}", val)
                resolved_dict[var_clean] = val
            # 3. Unresolved placeholder
            else:
                unresolved_customer_vars.append(var_clean)

        # Deduplicate unresolved
        unresolved_customer_vars = sorted(list(set(unresolved_customer_vars)))

        # Enforce safety rules:
        # If any customer-specific placeholder is unresolved, mark clarification_required!
        if unresolved_customer_vars:
            status = "clarification_required"
            # Format polite clarification request
            slot_names = ", ".join(unresolved_customer_vars)
            clarification_prompt = (
                f"To assist you accurately with your request, could you please provide your {slot_names}?"
            )
            final_response = clarification_prompt
        else:
            status = "resolved"
            final_response = resolved_text

        return {
            "status": status,
            "final_response": final_response,
            "resolved_template": resolved_text,
            "unresolved_placeholders": unresolved_customer_vars,
            "resolved_slots": resolved_dict,
            "raw_template": template_response
        }

    def respond(
        self,
        query: str,
        predicted_intent: Optional[str] = None,
        confidence: float = 1.0,
        method: str = "combined",
        top_k: int = 5,
        intent_restricted: bool = True,
        customer_slots: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Executes Agent 2 retrieval workflow for a customer query:
        1. Determine/confirm intent
        2. Retrieve top-k candidates
        3. Inspect best candidate response
        4. Detect and resolve placeholders
        5. Return completed resolution or clarification_required status
        """
        # Step 1: Intent check (fallback to standalone classifier if not provided)
        intent = predicted_intent
        intent_conf = confidence
        if not intent and self.classifier:
            try:
                preds = self.classifier.predict([query])
                intent = str(preds[0])
                intent_conf = 1.0
            except Exception:
                intent = None

        # Step 2: Retrieve candidates
        candidates = self.retriever.retrieve(
            query=query,
            predicted_intent=intent,
            method=method,
            top_k=top_k,
            intent_restricted=intent_restricted,
            confidence=intent_conf
        )

        if not candidates:
            return {
                "query": query,
                "intent": intent or "unknown",
                "category": "unknown",
                "status": "clarification_required",
                "selected_response": "I'm sorry, I could not find a matching response for your query. Could you please provide more details?",
                "response_template": "",
                "similarity_score": 0.0,
                "unresolved_placeholders": [],
                "resolved_slots": {},
                "candidates": [],
                "retrieval_method": method,
                "intent_restricted": intent_restricted,
                "retrieval_similarity": 0.0
            }

        # Step 3: Best candidate selection
        best_candidate = candidates[0]
        raw_response = best_candidate["response"]

        # Step 4: Extract slots from query and merge with explicit customer_slots
        extracted_slots = self.extract_slots_from_query(query)
        if customer_slots and isinstance(customer_slots, dict):
            extracted_slots.update(customer_slots)
        placeholder_result = self.process_placeholders(raw_response, extracted_slots)

        return {
            "query": query,
            "intent": best_candidate["intent"],
            "category": best_candidate["category"],
            "status": placeholder_result["status"],
            "selected_response": placeholder_result["final_response"],
            "response_template": raw_response,
            "similarity_score": best_candidate["similarity_score"],
            "unresolved_placeholders": placeholder_result["unresolved_placeholders"],
            "resolved_slots": placeholder_result["resolved_slots"],
            "retrieval_method": method,
            "intent_restricted": best_candidate["intent_restricted"],
            "source": {
                "matched_instruction": best_candidate["instruction"],
                "train_index": best_candidate["train_index"]
            },
            "candidates": candidates,
            "retrieval_similarity": best_candidate["similarity_score"]
        }

    def process(
        self,
        query: str,
        intent_handoff: Optional[A1IntentHandoff] = None,
        customer_slots: Optional[Dict[str, str]] = None
    ) -> tuple:
        """
        Multi-agent workflow interface (Phase 5):
        Receives original query, predicted intent, category, and calibrated confidence.
        Returns typed (A2RetrievalHandoff, AgentTrace).
        """
        import time
        t0 = time.time()
        agent_name = "A2_ResponseSpecialist"
        input_payload = {
            "query": query,
            "predicted_intent": intent_handoff.top_intent if intent_handoff else None,
            "category": intent_handoff.category if intent_handoff else None,
            "calibrated_confidence": intent_handoff.calibrated_confidence if intent_handoff else None,
            "customer_slots": customer_slots
        }

        # Handle unavailable retrieval engine
        if self.retriever is None:
            dur_ms = round((time.time() - t0) * 1000, 2)
            trace = AgentTrace(
                agent_name=agent_name,
                processing_status=AgentStatus.ERROR,
                input_payload=input_payload,
                output_payload={"error": "Response retrieval knowledge base is unavailable."},
                decision_reason="A2 unavailable: response index missing or failed to initialize.",
                duration_ms=dur_ms
            )
            return None, trace

        try:
            intent = intent_handoff.top_intent if intent_handoff else None
            conf = intent_handoff.calibrated_confidence if intent_handoff else 1.0

            # Execute contextual response retrieval
            result = self.respond(
                query=query,
                predicted_intent=intent,
                confidence=conf,
                method="combined",
                intent_restricted=True,
                customer_slots=customer_slots
            )

            sim = float(result.get("similarity_score", 0.0))
            status_str = result.get("status", "clarification_required")
            source_matched = result.get("source", {}).get("matched_instruction", "No source match")

            # Weak retrieval check (do not fabricate response)
            if sim < 0.30:
                processing_status = AgentStatus.UNCERTAIN
                decision_reason = f"Weak retrieval similarity ({sim:.4f} < 0.30). Flagging for clarification rather than fabricating response."
            elif status_str == "clarification_required":
                processing_status = AgentStatus.CLARIFICATION_REQUIRED
                missing_str = ", ".join(result.get("unresolved_placeholders", []))
                decision_reason = f"Missing dynamic customer parameter(s): {missing_str}."
            else:
                processing_status = AgentStatus.SUCCESS
                decision_reason = f"Contextual response retrieved with similarity {sim:.4f}; all slots resolved."

            handoff = A2RetrievalHandoff(
                retrieved_response=result.get("selected_response", ""),
                source_example=source_matched,
                retrieval_similarity=round(sim, 4),
                placeholder_status=status_str,
                unresolved_placeholders=result.get("unresolved_placeholders", []),
                resolved_slots=result.get("resolved_slots", {}),
                retrieval_method=result.get("retrieval_method", "combined")
            )

            dur_ms = round((time.time() - t0) * 1000, 2)
            trace = AgentTrace(
                agent_name=agent_name,
                processing_status=processing_status,
                input_payload=input_payload,
                output_payload={
                    "retrieval_similarity": round(sim, 4),
                    "placeholder_status": status_str,
                    "unresolved_placeholders": result.get("unresolved_placeholders", []),
                    "source_example": source_matched
                },
                decision_reason=decision_reason,
                duration_ms=dur_ms
            )

            return handoff, trace

        except Exception as e:
            dur_ms = round((time.time() - t0) * 1000, 2)
            trace = AgentTrace(
                agent_name=agent_name,
                processing_status=AgentStatus.ERROR,
                input_payload=input_payload,
                output_payload={"error": str(e)},
                decision_reason=f"Exception during response retrieval: {str(e)}",
                duration_ms=dur_ms
            )
            return None, trace

    # Alias for method invocation flexibility
    process_query = respond




def main():
    """CLI test entrypoint for Agent 2."""
    test_query = "I need to cancel my order #98214"
    if len(sys.argv) > 1:
        test_query = " ".join(sys.argv[1:])

    print(f"Testing Agent 2 with query: '{test_query}'\n")
    agent = ResponseAgent()
    result = agent.respond(test_query)

    print("=" * 60)
    print("AGENT 2: RESPONSE SPECIALIST RESULT")
    print("=" * 60)
    print(f"Query:              {result['query']}")
    print(f"Intent:             {result['intent']} ({result['category']})")
    print(f"Status:             {result['status']}")
    print(f"Similarity Score:   {result['similarity_score']}")
    print(f"Unresolved Slots:   {result['unresolved_placeholders']}")
    print(f"Resolved Slots:     {result['resolved_slots']}")
    print("-" * 60)
    print(f"Selected Response:\n{result['selected_response']}")
    print("=" * 60)


if __name__ == "__main__":
    main()
