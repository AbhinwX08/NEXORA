# RELAY AI — End-to-End User Journey Verification Results

**Executed Test Suite:** [`tests/test_journeys.py`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/tests/test_journeys.py)  
**Execution Environment:** Active Flask Server on `http://127.0.0.1:8000`  
**Total Journeys Tested:** 13 of 13  
**Result:** **100% PASS (13/13)**

---

## Journey Execution Matrix

| # | User Journey Name | Input Payload / Action | Observed Behavior & Decision | Verification Evidence | Status |
| :-: | :--- | :--- | :--- | :--- | :---: |
| **J01** | **Normal Customer Support Resolution** | `"I want to cancel my order #98214"`, slots: `{"Order Number": "98214"}` | Intent `cancel_order` (0.8264 conf, 0.6593 margin), slot resolved, validation passes, decision `PROCEED_AUTOMATED`. | Full response includes purchase number 98214 and step-by-step cancellation workflow. | **PASS** |
| **J02** | **Missing Information Clarification** | `"I want to cancel my order"` (no order slot) | Intent `cancel_order` detected, missing `Order Number` detected, decision `NEED_SLOT_CLARIFICATION`. | System asks for order number rather than inventing one. | **PASS** |
| **J03** | **Ambiguous Request Handling** | `"I want to make changes to my payment account invoice"` | Evaluates competing intents (`edit_account` vs `check_invoice`), computes margin, preserves top alternatives. | Top-3 alternatives returned with calibrated probabilities. | **PASS** |
| **J04** | **Explicit Human Escalation** | `"I need to speak to a real human agent right now"` | Rule gate detects explicit human request; routes to `ESCALATE_TO_HUMAN`. | Truthful messaging: flags context for representative without claiming handoff completed. | **PASS** |
| **J05** | **Product Documentation Assistant** | `"Explain how Platt sigmoid calibration works in RELAY AI"`, mode: `product_guide` | Routed to `product_guide` knowledge base; retrieves calibration article ($P = 1/(1+e^{-(As+B)})$). | Grounded answer with source citation (`guide_calibration_metrics`). | **PASS** |
| **J06** | **Support Demo Multi-Turn Conversation** | Turn 1: `"Where is my order?"`<br>Turn 2: `"Order #98214"` | Session memory stores session ID; Turn 2 recognizes continuation of delivery query with slot. | Turn count incremented; slots accumulated in session state. | **PASS** |
| **J07** | **Evidence Lineage Inspection** | Ingest query and inspect `AgentTrace` | Complete execution trace returned with A1, A2, and ValidationAgent execution spans. | Provenance tags map to model, corpus, rules, user slots, and external status. | **PASS** |
| **J08** | **Counterfactual Decision Replay** | Query A: `"Where is my package tracking info?"`<br>Query B: `"Where is my package? I want a human!"` | Side-by-side execution computes deltas: Intent unchanged, Decision diverges (`RESOLVED` -> `ESCALATION`). | `decision_identical: false`, latency and confidence deltas computed. | **PASS** |
| **J09** | **Voice Input & Speech Synthesis** | Post text to `/api/voice/speech` -> Send audio to `/api/voice/transcribe` | Returns valid Microsoft PCM 16-bit mono 16000 Hz WAVE audio; STT transcribes speech back to text. | Audio headers verified; STT returns valid transcription JSON. | **PASS** |
| **J10** | **Feedback Intake & Persistence** | Rating: 5, helpful: true, comment: `"Accurate"` to `/api/feedback` | Feedback recorded in review queue with timestamp and request ID. | Appended to `data/feedback/review_queue.jsonl`. | **PASS** |
| **J11** | **Dataset Explorer Audit** | Query `/api/info` dataset metadata | Returns 18,810 training rows, 4,031 validation rows, 22,841 total rows, 27 intents, 11 categories. | Matches disk CSV row counts exactly. | **PASS** |
| **J12** | **Model Evaluation Dashboard** | Query `/api/info` offline benchmarks | Accuracy 100%, ECE 1.19%, Brier 0.00054 on held-out validation set. | Values match verified offline evaluation reports. | **PASS** |
| **J13** | **Failure Recovery & Out-of-Domain Safety**| Empty query (`""`), and out-of-domain query (`"chocolate cake recipe"`) | Empty query rejected with 400 `VALIDATION_ERROR`; cake query rejected with `UNSUPPORTED_REJECTION`. | System does not crash or corrupt memory state. | **PASS** |

