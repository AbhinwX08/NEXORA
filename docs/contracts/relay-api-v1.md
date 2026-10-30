# RELAY AI — API Contract v1.0.0
**Document Version:** 1.0.0  
**Status:** Canonical & Active  
**Owners:** Account B (Backend, AI, Retrieval & API Contracts)  
**Consumers:** Account A (Frontend, UI/UX, TypeScript Client)  
**Base URL:** `http://localhost:8000` (or configured `PORT`)  
**Specification Standard:** RESTful JSON over HTTP / OpenAPI 3.1 compatible  

---

## 1. Architectural Baseline & Rules of Engagement

RELAY AI is a coordinated, explainable customer-support intelligence platform built on deterministic multi-agent orchestration, classical NLP classification, calibrated probabilities (Platt scaling), and vector-space retrieval indexing.

### 1.1 Team Ownership Boundaries
To ensure zero merge conflicts and preserve modular architecture:
- **Account A (Frontend)** owns: `src/App.tsx`, `src/main.tsx`, `src/components/**`, `src/styles/**`, `src/lib/**`, `src/types/**`, `src/data/**` (frontend presets only), root `index.html`, `package.json`, `package-lock.json`, `tailwind.config.js`, `vite.config.ts`, `tsconfig.json`, `frontend-tests/**`.
- **Account B (Backend)** owns: `app/**`, `src/nlp/**`, `data/**` (backend evaluation and knowledge additions; never raw training CSVs), `artifacts/` metadata (never overwriting model binaries), `reports/**`, `tests/**` (Python), `requirements.txt`, `.env.example`, `docs/contracts/**`, backend Dockerfiles and scripts.
- **Shared Integration Point:** This contract file (`docs/contracts/relay-api-v1.md`). Existing response fields **must never be renamed**. Additions must be backward compatible.

### 1.2 Model & Dataset Preservation Rules
- Never retrain or modify `.joblib` model binaries (`artifacts/models/*.joblib`).
- Never edit or corrupt raw datasets (`data/raw/train.csv`, `data/raw/validation.csv`).
- Never present offline benchmark figures as live runtime guarantees.
- Never invent real customer account data, transactions, or fake business contact details.

---

## 2. Common Protocols, Headers & Error Schema

### 2.1 Request & Response Headers
- **`Content-Type`**: `application/json` (or `multipart/form-data` for audio upload).
- **`X-Request-ID`**: Client may pass an optional request tracing ID string (alphanumeric, $\le 64$ chars). If omitted, the server generates a UUID `req_<hex8>`. The server **always returns** `X-Request-ID` in HTTP response headers and in structured error payloads.
- **CORS**: Enforced via `CORS_ORIGINS` environment variable. Defaults to `http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173`. Preflight `OPTIONS` requests return `204 No Content`.

### 2.2 Global Limits
- **Maximum Request Body Size**: 1 MB (`1,048,576` bytes) for JSON endpoints; 15 MB for voice audio uploads.
- **Maximum Query Length**: 2,000 characters.
- **Service Request Timeout**: Default 15.0 seconds.

### 2.3 Canonical Error Response Schema
All non-2xx HTTP responses follow this standardized envelope:

```json
{
  "status": "error",
  "error": "Human-readable explanation of error",
  "error_code": "VALIDATION_ERROR | BAD_REQUEST | PAYLOAD_TOO_LARGE | MODEL_UNAVAILABLE | INTERNAL_ERROR",
  "request_id": "req_8f1a2b3c",
  "timestamp": "2026-10-31T00:15:00Z"
}
```

| HTTP Status | Error Code | Description |
| :--- | :--- | :--- |
| **400 Bad Request** | `BAD_REQUEST` | Malformed JSON body, empty query string, or invalid data types. |
| **400 Bad Request** | `VALIDATION_ERROR` | Schema field violation (e.g. query length > 2,000 chars, invalid `customer_slots`). |
| **404 Not Found** | `NOT_FOUND` | Unrecognized route. |
| **413 Payload Too Large** | `PAYLOAD_TOO_LARGE` | Request payload exceeds 1 MB limit (or 15 MB for audio). |
| **500 Internal Error** | `INTERNAL_ERROR` | Unexpected server error. Stack traces are logged internally and never leaked. |
| **503 Service Unavailable** | `MODEL_UNAVAILABLE` | System in degraded state; model artifacts uninitialized or failed to load. |

---

## 3. Core Preserved Endpoints (v1.0.0 Active)

### 3.1 `GET /api/health`
Verifies live process vitality and active in-memory runtime readiness of the underlying ML models.

- **Authentication:** None
- **Response HTTP Status:** `200 OK` (Healthy) or `503 Service Unavailable` (Degraded)
- **Response Schema:**
```json
{
  "status": "healthy",
  "service": "RELAY AI Multi-Agent Customer Support Engine",
  "version": "1.0.0",
  "timestamp": "2026-10-31T00:15:00Z",
  "components": {
    "api_server": "running",
    "intent_classifier_file": "available",
    "response_retriever_file": "available",
    "calibration_config": "available",
    "intent_engine_runtime": "ready",
    "retrieval_engine_runtime": "ready",
    "optional_llm": "not_configured",
    "optional_database": "not_configured"
  }
}
```

---

### 3.2 `GET /api/info`
Returns authentic static dataset scope, agent architecture descriptions, and offline validation benchmarks. Does not invent runtime performance claims.

- **Authentication:** None
- **Response HTTP Status:** `200 OK`
- **Response Schema:**
```json
{
  "system": "RELAY AI",
  "tagline": "From customer query to verified resolution",
  "version": "1.0.0",
  "architecture": {
    "type": "Deterministic Multi-Agent Coordination with Classical NLP & Calibration",
    "agents": [
      {
        "name": "A1_IntentAnalyst",
        "role": "Calibrated Multiclass Intent Prediction & Uncertainty Margin Analysis",
        "method": "Logistic Regression / SVM with Sigmoid Probability Calibration"
      },
      {
        "name": "A2_ResponseSpecialist",
        "role": "Contextual Instruction Retrieval & Dynamic Slot Parameterization",
        "method": "Dual TF-IDF Vector Space Matching (Instruction + Response Index)"
      },
      {
        "name": "ValidationAgent",
        "role": "7-Point Quality, Safety, and Anti-Fabrication Verification Gate",
        "method": "Deterministic Boundary & Completeness Rules"
      },
      {
        "name": "SupportOrchestrator",
        "role": "End-to-End Workflow Coordinator & State Management",
        "method": "Typed Pydantic Contracts with Audit Execution Traces"
      }
    ]
  },
  "dataset_metadata": {
    "source": "Customer Support Instruction-Response Corpus",
    "training_records": 18810,
    "validation_records": 4031,
    "total_records": 22841,
    "unique_intents": 27,
    "unique_categories": 11,
    "categories": [
      "ACCOUNT", "CANCEL", "CONTACT", "DELIVERY", "FEEDBACK",
      "INVOICE", "ORDER", "PAYMENT", "REFUND", "SHIPPING", "SUBSCRIPTION"
    ],
    "dataset_columns": ["flags", "instruction", "category", "intent", "response"],
    "flags_note": "349 distinct instruction flag combinations present; no official codebook provided."
  },
  "offline_validation_benchmarks": {
    "evaluation_context": "Evaluated offline on 4,031 held-out validation samples (data/raw/validation.csv)",
    "intent_classification": {
      "validation_samples": 4031,
      "accuracy": 1.0,
      "macro_f1": 1.0,
      "weighted_f1": 1.0,
      "top_3_accuracy": 1.0,
      "expected_calibration_error_ece": 0.0119,
      "brier_score": 0.00054
    },
    "response_retrieval": {
      "recall_at_1": 1.0,
      "recall_at_3": 1.0,
      "recall_at_5": 1.0,
      "mean_reciprocal_rank_mrr": 1.0,
      "mean_cosine_similarity": 0.8467
    },
    "disclaimer": "These metrics represent offline test-set evaluation results and are not live runtime operational guarantees."
  }
}
```

---

### 3.3 `POST /api/intent`
Fast intent classification evaluating Agent 1 (Intent Analyst) directly without invoking retrieval or full validation.

- **Authentication:** None
- **Request Headers:** `Content-Type: application/json`, optional `X-Request-ID`
- **Request Schema:**
```json
{
  "query": "Where can I view my recent invoices and billing receipts?"
}
```
*Constraints:* `query` string, length between 1 and 2,000 characters.

- **Response HTTP Status:** `200 OK`
- **Response Schema:**
```json
{
  "query": "Where can I view my recent invoices and billing receipts?",
  "top_intent": "get_invoice",
  "category": "INVOICE",
  "confidence": 0.9842,
  "margin": 0.9411,
  "uncertainty_verdict": "CONFIDENT",
  "alternatives": [
    {
      "rank": 1,
      "intent": "get_invoice",
      "category": "INVOICE",
      "probability": 0.9842
    },
    {
      "rank": 2,
      "intent": "check_invoice",
      "category": "INVOICE",
      "probability": 0.0431
    },
    {
      "rank": 3,
      "intent": "check_payment_methods",
      "category": "PAYMENT",
      "probability": 0.0084
    }
  ],
  "duration_ms": 3.42
}
```

---

### 3.4 `POST /api/chat`
Primary end-to-end customer support intelligence endpoint. Executes the complete deterministic multi-agent pipeline:
$$\text{Query} \longrightarrow \mathbf{A1}\text{ Intent Analyst} \longrightarrow \mathbf{A2}\text{ Response Specialist} \longrightarrow \text{Validation Agent} \longrightarrow \text{Final Orchestrated Decision}$$

- **Authentication:** None
- **Request Headers:** `Content-Type: application/json`, optional `X-Request-ID`
- **Request Schema:**
```json
{
  "query": "I would like to cancel my order #98214.",
  "customer_slots": {
    "order_id": "98214"
  }
}
```
*Constraints:*
- `query`: String, 1–2,000 characters (required, non-whitespace).
- `customer_slots`: Key-value string map (optional). Valid keys: alphanumeric/underscore strings $\le 64$ chars.

- **Response HTTP Status:** `200 OK`
- **Response Schema (`OrchestratorResult`):**
```json
{
  "original_customer_query": "I would like to cancel my order #98214.",
  "intent_prediction": "cancel_order",
  "category": "CANCEL",
  "calibrated_confidence": 0.9912,
  "margin": 0.9785,
  "alternative_intents": [
    {
      "rank": 1,
      "intent": "cancel_order",
      "category": "CANCEL",
      "probability": 0.9912
    },
    {
      "rank": 2,
      "intent": "change_order",
      "category": "ORDER",
      "probability": 0.0127
    },
    {
      "rank": 3,
      "intent": "track_order",
      "category": "ORDER",
      "probability": 0.0041
    }
  ],
  "retrieved_response": "To cancel order #98214, navigate to your Orders page and select Cancel Order if it has not yet entered fulfillment.",
  "source_example": "I want to cancel order {{order_number}}.",
  "retrieval_similarity": 0.8841,
  "placeholder_status": "resolved",
  "unresolved_placeholders": [],
  "validation_checks": [
    {
      "check_name": "calibrated_confidence",
      "passed": true,
      "detail": "Confidence 0.991 >= 0.70 threshold"
    },
    {
      "check_name": "decision_margin",
      "passed": true,
      "detail": "Margin 0.979 >= 0.15 threshold"
    },
    {
      "check_name": "retrieval_similarity",
      "passed": true,
      "detail": "Similarity 0.884 >= 0.30 threshold"
    },
    {
      "check_name": "category_intent_alignment",
      "passed": true,
      "detail": "Intent cancel_order belongs to CANCEL category"
    },
    {
      "check_name": "placeholder_completeness",
      "passed": true,
      "detail": "All required placeholders resolved: ['order_number']"
    },
    {
      "check_name": "human_escalation_intent",
      "passed": true,
      "detail": "Intent is not an explicit human agent request"
    },
    {
      "check_name": "response_content_safety",
      "passed": true,
      "detail": "Response contains no prohibited or malformed content"
    }
  ],
  "final_decision": "RESOLVED_RESPONSE",
  "final_response": "To cancel order #98214, navigate to your Orders page and select Cancel Order if it has not yet entered fulfillment.",
  "complete_agent_trace": [
    {
      "agent_name": "A1_IntentAnalyst",
      "processing_status": "SUCCESS",
      "input_payload": {
        "query": "I would like to cancel my order #98214."
      },
      "output_payload": {
        "top_intent": "cancel_order",
        "category": "CANCEL",
        "calibrated_confidence": 0.9912,
        "margin": 0.9785,
        "uncertainty_verdict": "CONFIDENT"
      },
      "decision_reason": "High calibrated confidence (0.991) with decisive margin (0.979).",
      "duration_ms": 2.14
    },
    {
      "agent_name": "A2_ResponseSpecialist",
      "processing_status": "SUCCESS",
      "input_payload": {
        "intent": "cancel_order",
        "category": "CANCEL",
        "query": "I would like to cancel my order #98214."
      },
      "output_payload": {
        "retrieved_response": "To cancel order #98214, navigate to your Orders page and select Cancel Order if it has not yet entered fulfillment.",
        "similarity": 0.8841,
        "placeholder_status": "resolved",
        "resolved_slots": {
          "order_number": "98214"
        }
      },
      "decision_reason": "Matched training exemplar with cosine similarity 0.884; resolved 1 slot.",
      "duration_ms": 5.82
    },
    {
      "agent_name": "ValidationAgent",
      "processing_status": "SUCCESS",
      "input_payload": {
        "all_checks_passed": true,
        "decision_state": "HIGH_CONFIDENCE"
      },
      "output_payload": {
        "action": "PROCEED_AUTOMATED",
        "passed_checks_count": 7,
        "total_checks_count": 7
      },
      "decision_reason": "All 7 quality and safety verification gates passed.",
      "duration_ms": 0.45
    },
    {
      "agent_name": "SupportOrchestrator",
      "processing_status": "SUCCESS",
      "input_payload": {
        "action": "PROCEED_AUTOMATED"
      },
      "output_payload": {
        "final_decision": "RESOLVED_RESPONSE"
      },
      "decision_reason": "Delivered verified automated resolution.",
      "duration_ms": 8.71
    }
  ],
  "total_duration_ms": 8.71
}
```

#### Final Decision Enumeration
The `final_decision` field will strictly contain one of these five verified values:
1. `RESOLVED_RESPONSE`: High-confidence classification and retrieval; all parameters resolved.
2. `CLARIFICATION_REQUIRED`: Missing parameter slot or ambiguous top candidate margin.
3. `ESCALATION_RECOMMENDED`: Explicit customer escalation request or low-confidence classification.
4. `UNSUPPORTED_REQUEST`: Out-of-domain query with similarity below cutoff.
5. `SERVICE_ERROR`: Internal processing fault handled safely without stack trace leaks.

---

## 4. Planned Backward-Compatible Additions (Account B Extensions)

The following endpoints represent planned services owned by Account B. They adhere to the same schema standards and do not alter existing `/api/chat` or `/api/intent` semantics.

---

### 4.1 `POST /api/assistant/chat`
Conversational multi-turn support assistant with session memory, grounded retrieval-augmented responses (RAG), and deterministic safety guardrails.

- **HTTP Method & Path:** `POST /api/assistant/chat`
- **Authentication:** Optional `Authorization: Bearer <session_token>` or anonymous session.
- **Request Headers:** `Content-Type: application/json`, optional `X-Request-ID`
- **Request Constraints:**
  - `session_id`: Alphanumeric string $\le 64$ chars (required).
  - `message`: User input string, 1 to 2,000 characters (required).
  - `customer_context`: Optional dictionary of authenticated user facts (`user_id`, `plan`, `country`).
  - Max payload size: 1 MB. Timeout: 15 seconds.
- **Privacy & Retention:** Conversation turns in memory are ephemeral per session (in-memory or cache with 24-hour TTL). No raw customer messages are used for model training.

#### Request Schema
```json
{
  "session_id": "sess_89a712f0",
  "message": "Can I get a refund for my subscription?",
  "customer_context": {
    "account_tier": "pro",
    "subscription_id": "sub_4412"
  }
}
```

#### Response Schema (`200 OK`)
```json
{
  "session_id": "sess_89a712f0",
  "reply": "Refunds for subscriptions can be requested through your Account Settings within the active billing cycle.",
  "intent_detected": "get_refund",
  "category": "REFUND",
  "confidence": 0.974,
  "sources": [
    {
      "source_type": "dataset_exemplar",
      "similarity": 0.865,
      "snippet": "I want to request a refund for my subscription renewal."
    }
  ],
  "clarification_needed": false,
  "escalation_recommended": false,
  "turn_count": 3,
  "duration_ms": 14.8
}
```

#### Error Codes
- `400 BAD_REQUEST`: Empty message or invalid `session_id`.
- `429 RATE_LIMITED`: Session exceeded 30 messages/minute.
- `503 MODEL_UNAVAILABLE`: Retrieval engine or assistant offline.

---

### 4.2 `POST /api/voice/transcribe`
Speech-to-text service converting customer audio into validated text queries suitable for dispatch to `/api/chat`.

- **HTTP Method & Path:** `POST /api/voice/transcribe`
- **Authentication:** None (or optional API key).
- **Request Content-Type:** `multipart/form-data`
- **Form Fields:**
  - `audio`: Audio binary stream (`audio/wav`, `audio/webm`, `audio/mp3`, `audio/ogg`). Max size: 15 MB.
  - `language`: Optional language hint (e.g. `"en"`, default: auto-detect).
- **Timeout:** 30.0 seconds.
- **Privacy & Retention:** Audio buffers are processed in memory and immediately discarded. Never written to permanent disk storage.

#### Response Schema (`200 OK`)
```json
{
  "transcription": "I need help updating my shipping address for order 48102.",
  "detected_language": "en",
  "audio_duration_seconds": 3.8,
  "confidence": 0.962,
  "duration_ms": 210.4
}
```

#### Error Codes
- `400 BAD_REQUEST`: Missing audio part or unparseable audio container.
- `413 PAYLOAD_TOO_LARGE`: Audio file exceeds 15 MB.
- `415 UNSUPPORTED_MEDIA_TYPE`: Unsupported audio codec.
- `503 SERVICE_UNAVAILABLE`: Speech recognition engine unavailable.

---

### 4.3 `POST /api/voice/speech`
Text-to-speech synthesis converting automated or orchestrated responses into spoken audio streams for voice support channels.

- **HTTP Method & Path:** `POST /api/voice/speech`
- **Authentication:** None
- **Request Headers:** `Content-Type: application/json`, optional `X-Request-ID`
- **Request Constraints:**
  - `text`: String to synthesize, 1 to 1,000 characters.
  - `voice`: Optional voice identifier (e.g. `"en-US-neutral"`).
  - `format`: Audio format (`"mp3"` or `"wav"`, default `"mp3"`).
  - Timeout: 15.0 seconds.

#### Request Schema
```json
{
  "text": "Your order #98214 has been scheduled for cancellation.",
  "voice": "en-US-neutral",
  "format": "mp3"
}
```

#### Response
- **HTTP Status:** `200 OK`
- **Response Headers:** `Content-Type: audio/mpeg` (or `audio/wav`), `Content-Disposition: inline; filename="speech.mp3"`
- **Response Body:** Binary audio byte stream.

#### Error Codes
- `400 BAD_REQUEST`: Empty text or text exceeding 1,000 characters.
- `503 SERVICE_UNAVAILABLE`: Voice synthesis engine uninitialized.

---

### 4.4 `POST /api/feedback`
Reviewed customer feedback and resolution rating intake for operational auditing and continual QA evaluation.

- **HTTP Method & Path:** `POST /api/feedback`
- **Authentication:** None
- **Request Headers:** `Content-Type: application/json`, optional `X-Request-ID`
- **Request Constraints:**
  - `query`: The customer's original query string (required).
  - `intent`: The predicted intent string (required).
  - `final_decision`: The orchestrator's decision string (required).
  - `rating`: Integer score between 1 (poor) and 5 (excellent) (required).
  - `helpful`: Boolean indicating resolution usefulness (required).
  - `comment`: Optional user commentary string $\le 500$ chars.
  - `request_id`: Tracing ID associated with the initial interaction.

#### Request Schema
```json
{
  "request_id": "req_8f1a2b3c",
  "query": "I would like to cancel my order #98214.",
  "intent": "cancel_order",
  "final_decision": "RESOLVED_RESPONSE",
  "rating": 5,
  "helpful": true,
  "comment": "Quick and accurate guidance without waiting."
}
```

#### Response Schema (`200 OK`)
```json
{
  "status": "success",
  "feedback_id": "fb_6c29e10d",
  "message": "Feedback successfully recorded.",
  "recorded_at": "2026-10-31T00:15:30Z"
}
```

#### Error Codes
- `400 BAD_REQUEST`: Rating out of bounds (must be 1–5), missing required fields.
- `429 TOO_MANY_REQUESTS`: Rate limit exceeded for feedback submissions.

---

### 4.5 `POST /api/replay` (Pipeline Replay & Diagnostic Audit)
Re-executes an exact historical query or test fixture through the current multi-agent pipeline with deterministic step logging to inspect divergence, regressions, or gate thresholds.

- **HTTP Method & Path:** `POST /api/replay`
- **Authentication:** Internal / Diagnostic tool (configurable access header).
- **Request Headers:** `Content-Type: application/json`
- **Request Constraints:**
  - `query`: String to evaluate (required).
  - `customer_slots`: Optional dictionary.
  - `expected_intent`: Optional ground-truth intent string to assert against.
  - `threshold_overrides`: Optional overrides for `min_confidence` or `min_similarity`.

#### Request Schema
```json
{
  "query": "Where is my package? Tracking number is TRK-88219",
  "customer_slots": {
    "tracking_number": "TRK-88219"
  },
  "expected_intent": "track_order"
}
```

#### Response Schema (`200 OK`)
```json
{
  "replay_status": "MATCH",
  "expected_intent": "track_order",
  "predicted_intent": "track_order",
  "intent_match": true,
  "orchestrator_result": {
    "original_customer_query": "Where is my package? Tracking number is TRK-88219",
    "intent_prediction": "track_order",
    "category": "DELIVERY",
    "calibrated_confidence": 0.989,
    "final_decision": "RESOLVED_RESPONSE"
  },
  "execution_diff": {
    "confidence_delta": 0.0,
    "decision_identical": true
  },
  "total_duration_ms": 7.42
}
```

---

## 5. Summary Table for Frontend Developers (Account A)

| Path | Method | Primary Purpose | Status |
| :--- | :--- | :--- | :--- |
| `/api/health` | `GET` | Readiness & model health check | **Active v1** |
| `/api/info` | `GET` | Authentic dataset info & offline benchmarks | **Active v1** |
| `/api/intent` | `POST` | Fast intent classification (A1 only) | **Active v1** |
| `/api/chat` | `POST` | Full multi-agent orchestration (`OrchestratorResult`) | **Active v1** |
| `/api/assistant/chat` | `POST` | Multi-turn conversational support assistant | *Contract Defined* |
| `/api/voice/transcribe`| `POST` | Audio transcription to text query | *Contract Defined* |
| `/api/voice/speech` | `POST` | Text response to speech audio | *Contract Defined* |
| `/api/feedback` | `POST` | Customer satisfaction & feedback intake | *Contract Defined* |
| `/api/replay` | `POST` | Pipeline replay & diagnostic verification | *Contract Defined* |

*End of API Contract v1.0.0. Account A can implement against these exact schemas with complete confidence in backward compatibility.*

