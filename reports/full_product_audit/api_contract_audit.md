# RELAY AI — API Contract & Schema Audit

**Contract Specification Document:** [`docs/contracts/relay-api-v1.md`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/docs/contracts/relay-api-v1.md)  
**TypeScript Client Schema:** [`src/types/api.ts`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/src/types/api.ts)  
**Python Pydantic Schemas:** [`app/schemas/agent_models.py`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/app/schemas/agent_models.py)

---

## 1. Schema Consistency Matrix

| API Endpoint | Backend Model | TypeScript Interface | Schema Match Status | Field Compatibility Notes |
| :--- | :--- | :--- | :---: | :--- |
| `GET /api/health` | `HealthResponse` | `HealthResponse` | **PERFECT MATCH** | Full component breakdown with in-memory model flags (`intent_engine_runtime`, `retrieval_engine_runtime`). |
| `GET /api/info` | `SystemInfoResponse`| `SystemInfoResponse`| **PERFECT MATCH** | Exposes verified dataset figures (18,810 / 4,031), 27 intents, 11 categories, and offline evaluation results. |
| `POST /api/chat` | `ChatRequest` -> `OrchestratorResult` | `ChatRequest` -> `OrchestratorResult` | **PERFECT MATCH** | Includes `original_customer_query`, `intent_prediction`, `calibrated_confidence`, `margin`, `alternative_intents`, `complete_agent_trace`, and `validation_checks`. |
| `POST /api/intent` | `IntentRequest` -> `IntentResponse` | `query: string` -> `IntentResponse` | **PERFECT MATCH** | Top intent, category, Platt confidence, margin, uncertainty verdict, top-3 alternatives. |
| `POST /api/assistant/chat` | `AssistantChatRequest` -> `AssistantChatResponse` | `AssistantChatRequest` -> `AssistantChatResponse` | **PERFECT MATCH** | Session ID, routing mode (`deterministic_smalltalk`, `product_guide`, `support_demo`), reply, grounded sources, clarification/escalation flags. |
| `POST /api/voice/transcribe` | Multipart Form -> `TranscriptionResponse` | Multipart Form -> `TranscriptionResponse` | **PERFECT MATCH** | Returns `transcription`, `detected_language`, `audio_duration_seconds`, and `confidence`. |
| `POST /api/voice/speech` | `SpeechRequest` -> `audio/wav` | `SpeechRequest` -> `Blob` | **PERFECT MATCH** | Streams Microsoft PCM 16-bit mono 16000 Hz WAVE audio blob directly consumable by browser HTML5 `Audio`. |
| `POST /api/feedback` | `FeedbackRequest` -> `FeedbackResponse` | `FeedbackPayload` -> `FeedbackResponse` | **PERFECT MATCH** | Records `query`, `intent`, `final_decision`, `rating` (1–5), `helpful` (bool), optional `comment`, and `request_id`. |
| `POST /api/replay` | `ReplayRequest` -> `ReplayResponse` | `ReplayPayload` -> `ReplayResponse` | **PERFECT MATCH** | Returns `variant_a`, `variant_b`, and `comparison` deltas for confidence, margin, similarity, and latency. |

---

## 2. Error Response Standards & Request Tracing

All error responses across all 9 endpoints strictly adhere to the unified RFC 7807-inspired schema:

```json
{
  "status": "error",
  "error": "Human-readable error description without stack trace leakage",
  "error_code": "VALIDATION_ERROR | BAD_REQUEST | NOT_FOUND | MODEL_UNAVAILABLE | INTERNAL_ERROR",
  "request_id": "req_f66b674a",
  "timestamp": "2026-10-31T01:04:26Z"
}
```

### Verified Protections
1. **Request Tracking:** Every HTTP request is assigned a unique `req_xxxxxxxx` UUID tracked via Flask's `g.request_id` and logged across all downstream agent spans.
2. **Sanitization:** Internal Python traceback information, file paths, and environment internals are scrubbed from public HTTP responses.
3. **HTTP Status Mapping:**
   - Empty or oversized query (>2000 chars): `400 Bad Request` (`VALIDATION_ERROR`)
   - Unregistered API routes: `404 Not Found` (`NOT_FOUND`)
   - Model files missing: `503 Service Unavailable` (`MODEL_UNAVAILABLE`)
   - Unhandled runtime exceptions: `500 Internal Server Error` (`INTERNAL_ERROR`)

