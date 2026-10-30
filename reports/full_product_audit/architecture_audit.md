# RELAY AI — Architecture & Data Flow Audit

**Audited Date:** October 31, 2026  
**Component Scope:** Frontend Client, REST API Routes, Multi-Agent Orchestrator, Services, Data Layers

---

## 1. System Execution Topology

```
+---------------------------------------------------------------------------------------------------------+
|                                        FRONTEND CLIENT (React 19)                                       |
|                                                                                                         |
|  [ LandingPage ]  [ LiveWorkspace ]  [ EvidenceLedger ]  [ DecisionReplay ]  [ Dataset ]  [ Evaluation ] |
|  [ FloatingAssistant (Product Guide & Support Demo) ]           [ Half-Duplex VoiceController ]         |
+----------------------------------------------------+----------------------------------------------------+
                                                     | (Centralized API Client: src/lib/api.ts)
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                         REST API LAYER (Flask 3.0)                                      |
|                                                                                                         |
|  GET  /api/health            GET  /api/info               POST /api/chat          POST /api/intent      |
|  POST /api/assistant/chat    POST /api/voice/transcribe   POST /api/voice/speech                        |
|  POST /api/feedback          POST /api/replay                                                           |
+----------------------------------------------------+----------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                    SUPPORT ORCHESTRATION PIPELINE                                       |
|                               (app/orchestration/support_orchestrator.py)                               |
|                                                                                                         |
|    1. A1 Intent Analyst      -->   2. A2 Response Specialist   -->   3. Validation Agent Gate           |
|       - Word/Char TF-IDF              - Hybrid RRF Retrieval            - 7 Safety & Boundary Checks    |
|       - LinearSVC + Platt             - Slot Extraction & Binding       - Anti-Fabrication Rules        |
|       - Confidence & Margin           - Corpus 1 Source Lineage         - Unresolved Slot Audit         |
+----------------------------------------------------+----------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                       CANONICAL DECISION ENGINE                                         |
|                               (app/orchestration/decision_policy.py)                                    |
|                                                                                                         |
|    [ RESOLVED ]  [ CLARIFICATION_REQUIRED ]  [ ESCALATION_RECOMMENDED ]  [ UNSUPPORTED ]  [ ERROR ]     |
+----------------------------------------------------+----------------------------------------------------+
                                                     |
                                                     v
+---------------------------------------------------------------------------------------------------------+
|                                      DATA, MODELS & KNOWLEDGE CORPORA                                   |
|                                                                                                         |
|  - Corpus 1: train.csv (18,810 exemplars)                - Knowledge Base: product_guide.json           |
|  - Evaluation: validation.csv (4,031 locked samples)     - Review Queue: review_queue.jsonl             |
|  - Production Models: artifacts/models/*.joblib          - Knowledge Gaps: knowledge_gaps.json          |
|  - Candidate Models: artifacts/models/candidates/        - Session Memory: session_memory.py            |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. End-to-End Traced Data Flow

### Step-by-Step Function Call Chain for `/api/chat`

1. **User Submission:**  
   Customer enters query in `LiveWorkspace.tsx` (e.g. `"I want to cancel my order #98214"`, with optional slots).
2. **Client Dispatch:**  
   Calls `sendChatMessage({ query, customer_slots })` in `src/lib/api.ts` over HTTP POST.
3. **Flask Route Reception:**  
   [`app/api.py`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/app/api.py) `@app.route("/api/chat")`:
   - Validates request payload against `ChatRequest` Pydantic model (`query` length 1–2000 chars, `customer_slots` regex pattern `^[a-zA-Z0-9_\-\s]{1,64}$`).
   - Assigns unique request identifier `req_xxxxxxxx` via Flask `g.request_id`.
4. **Orchestrator Execution:**  
   `SupportOrchestrator.process_query(query, customer_slots)`:
   - **Stage 1 (A1):** Calls `IntentAnalystAgent.predict(query)`. Preprocesses text, generates hybrid word + char TF-IDF feature vector, evaluates calibrated Platt sigmoid model, computes prediction margin and top-3 alternatives.
   - **Stage 2 (A2):** Calls `ResponseAgent.retrieve_and_format(query, predicted_intent, category, customer_slots)`. Performs reciprocal rank fusion ($k=60$) over 18,810 training rows, retrieves matching response template, extracts regex slot patterns, binds customer parameters into placeholders (`{order_number}`), tracks any missing placeholders in `unresolved_placeholders`.
   - **Stage 3 (Validation Gate):** Calls `ValidationAgent.evaluate(query, a1_payload, a2_payload)`. Evaluates 7 deterministic checks (domain boundary, confidence threshold, margin separation, required slot completeness, placeholder hygiene, profanity, human escalation triggers).
   - **Stage 4 (Canonical Decision):** Evaluates `DecisionPolicyEngine.evaluate(...)`. Deterministically maps multi-agent state into one of five canonical outcomes (`RESOLVED`, `CLARIFICATION_REQUIRED`, `ESCALATION_RECOMMENDED`, `UNSUPPORTED`, `SERVICE_ERROR`).
5. **Serialization & Client Rendering:**  
   `OrchestratorResult` serialized to JSON and delivered to `LiveWorkspace.tsx`. Client renders intent badge, calibrated probability gauge, matched training exemplar with similarity score, validation checks checklist, and final verified response.

---

## 3. Decoupling and Single Responsibility Analysis

- **Intent Prediction vs. Generation:** `A1_IntentAnalyst` only outputs intent, category, calibrated probabilities, and margins. It never generates text.
- **Retrieval vs. Invention:** `A2_ResponseSpecialist` only retrieves actual exemplars from `train.csv`. When similarity is below 0.35, it abstains.
- **Safety Policy vs. Heuristics:** `ValidationAgent` and `DecisionPolicyEngine` enforce hard deterministic gates. An optional LLM cannot override validation results.
- **Dual Knowledge Corpora:** Customer support examples are strictly segregated from platform documentation (`product_guide.json`).

