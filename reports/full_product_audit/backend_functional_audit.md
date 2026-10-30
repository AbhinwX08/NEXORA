# RELAY AI — Backend Functional & Integration Audit

**Audited Date:** October 31, 2026  
**Backend Framework:** Python 3.13 / Flask 3.0 / Pydantic 2.x / scikit-learn / joblib  
**Audited Service Port:** `http://127.0.0.1:8000`

---

## 1. Verified REST API Routes (9 of 9 Passing)

| Route | Method | Request Model | Response Model | HTTP Status | Verified Functionality |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `/api/health` | `GET` | None | `HealthResponse` | 200 OK | Actively checks in-memory `SupportOrchestrator`, `IntentAnalystAgent`, and `RetrievalService` readiness. |
| `/api/info` | `GET` | None | `SystemInfoResponse`| 200 OK | Exposes verified dataset metadata (18,810 / 4,031) and offline benchmark figures. |
| `/api/chat` | `POST` | `ChatRequest` | `OrchestratorResult`| 200 OK | Full orchestration through A1, A2, Validation Agent, and Canonical Decision Engine. |
| `/api/intent` | `POST` | `IntentRequest` | `IntentResponse` | 200 OK | Fast inference returning top intent, category, Platt confidence, margin, and top-3 alternatives. |
| `/api/assistant/chat` | `POST` | `AssistantChatRequest`| `AssistantChatResponse` | 200 OK | Multi-turn conversational router supporting `product_guide` and `support_demo` modes. |
| `/api/voice/transcribe`| `POST` | Multipart Audio | `TranscriptionResponse`| 200 OK | Ingests WAV/WebM audio blobs and returns normalized text transcripts. |
| `/api/voice/speech` | `POST` | `SpeechRequest` | Audio/WAV stream | 200 OK | Streams valid Microsoft PCM 16-bit mono 16000 Hz WAVE audio. |
| `/api/feedback` | `POST` | `FeedbackPayload` | `FeedbackResponse` | 200 OK | Persists user ratings, helpfulness flags, and comments to `review_queue.jsonl`. |
| `/api/replay` | `POST` | `ReplayRequest` | `ReplayResponse` | 200 OK | Side-by-side comparative execution between base queries and perturbations. |

---

## 2. Agent System & Pipeline Audit

### A1 — Intent Analyst (`app/agents/intent_agent.py`)
- **Model In-Memory Verification:** Loads `artifacts/models/intent_classifier.joblib` and `artifacts/models/calibration_config.json`.
- **Confidence Calibration:** Applies Platt sigmoid transformation $P(y=k \mid s) = \frac{1}{1 + \exp(A \cdot s + B)}$ on raw SVM decision function margins.
- **Uncertainty Margin:** Evaluates difference between rank 1 and rank 2 probabilities ($P_{(1)} - P_{(2)}$). Queries with margin $< 0.10$ or confidence $< 0.65$ are marked `UNCERTAIN: AMBIGUOUS_INTENT_CLARIFICATION`.

### A2 — Response Specialist (`app/agents/response_agent.py`)
- **Corpus 1 Retrieval:** Queries 18,810 training instruction pairs via hybrid Reciprocal Rank Fusion ($k=60$).
- **Dynamic Slot Extraction:** Disambiguates and extracts order numbers (`#98214`), invoice IDs (`INV-1042`), tracking numbers (`TRK-8821`), and monetary amounts (`$45.00`).
- **Placeholder Hygiene:** Binds extracted parameters into templates (`{order_number}`) without leaving dangling raw braces. Unresolved placeholders are reported explicitly to the validation gate.
- **Anti-Fabrication:** Removed invented business constants (no hardcoded phone numbers, fake emails, or invented operating hours).

### Validation Agent Gate (`app/agents/validation_agent.py`)
- **7-Point Deterministic Safety Checks:**
  1. Component Availability Check (`A1` and `A2` payloads present).
  2. Domain Boundary Check (categorized under 11 supported business domains).
  3. Intent Confidence & Margin Check (Confidence $\ge 0.50$, Margin $\ge 0.10$).
  4. Explicit Human Escalation Check (`"human"`, `"agent"`, `"representative"`).
  5. Placeholder Hygiene Check (Zero raw unresolved template syntax in generated text).
  6. Parameter Completeness Check (Customer slots satisfied).
  7. Out-of-Scope Safety Check (Rejection of ungrounded or profanity-laden requests).

### Canonical Decision Engine (`app/orchestration/decision_policy.py`)
- Consolidates all decision outcomes into five canonical statuses:
  - `RESOLVED`: High confidence, in-domain, all required slots present.
  - `CLARIFICATION_REQUIRED`: Confident intent, but customer-specific slot missing.
  - `ESCALATION_RECOMMENDED`: Explicit human escalation requested or safety failure.
  - `UNSUPPORTED`: Non-support question or weak corpus similarity (<0.35).
  - `SERVICE_ERROR`: Degraded component state or internal execution failure.
- Precedence Rules: Escalation > Safety/Domain Boundary > Slot Clarification > Automated Resolution.
- Generative LLM Protection: Optional LLM composer cannot override deterministic validation gates.

---

## 3. Multi-Turn Session Memory (`app/services/session_memory.py`)
- **Session Isolation:** Thread-safe in-memory session manager indexed by session UUID (`sess_xxxxxxxx`).
- **Parameter Accumulation:** Remembers slots across turns (e.g. user provides order number in turn 2 after asking about delivery in turn 1).
- **TTL Expiry:** Automatically purges sessions older than 3600 seconds to prevent unbounded memory growth.

---

## 4. Diagnostics & Knowledge Gap Logging (`app/services/analytics_service.py`)
- `KnowledgeGapDetector` monitors runtime queries and logs weak inquiries ($<50\%$ confidence or $<0.35$ similarity) to [`reports/knowledge_gaps.json`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/reports/knowledge_gaps.json).
- Prevents hallucination by isolating out-of-domain queries into an auditable diagnostic log for future dataset review.

