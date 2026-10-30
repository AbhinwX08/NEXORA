# RELAY AI — Security, Privacy & Input Hardening Audit

**Audited Date:** October 31, 2026  
**Audited Scope:** API Input Boundaries, Secrets, CORS, Memory Isolation, Error Disclosures

---

## 1. Vulnerability & Defense Assessment Matrix

| Security Dimension | Threat Model | Implemented Defense Mechanism | Verified Status |
| :--- | :--- | :--- | :---: |
| **Input Injection & DoS** | Excessively large payloads or SQL/NoSQL injection in query console | Strict Pydantic max-length constraint (2000 characters). Queries exceeding limit are rejected with HTTP 400. | **SECURE** |
| **Parameter Tampering** | Customer slot injection containing script tags or malicious path chars | Slot names and values validated against strict regex: `^[a-zA-Z0-9_\-\s]{1,64}$`. | **SECURE** |
| **Information Disclosure** | Unhandled server exceptions leaking file paths, line numbers, or stack traces | Global `@app.errorhandler` catches all exceptions, scrubs tracebacks, generates random `request_id`, and returns clean JSON. | **SECURE** |
| **Cross-Origin Access** | Unauthorized browser domains invoking API | Configurable CORS origins via `CORS_ORIGINS` environment variable (defaults to localhost:3000 in development). | **SECURE** |
| **Secrets Exposure** | API keys or credentials committed in frontend or backend code | Zero hardcoded API keys in source files. `.env.example` provides template; local `.env` excluded via `.gitignore`. | **SECURE** |
| **Session Memory Leaks** | Conversation state from User A bleeding into User B's turns | Sessions isolated by UUID (`sess_xxxxxxxx`). Session memory does not share state across session IDs. Automatic TTL expiry at 3600s. | **SECURE** |
| **Model Deserialization** | Untrusted arbitrary pickle loading | Model loader restricted strictly to verified, local filenames in `artifacts/models/` and `artifacts/models/candidates/`. | **SECURE** |
| **Audio Upload Exploits** | Malicious binary files disguised as audio | Uploaded audio streams validated by file size limit (10 MB) and parsed via Python standard library `wave` module. | **SECURE** |
| **Prompt Injection** | Customer query attempting to override deterministic safety gates | Deterministic pipeline structure: A1 classification and ValidationAgent rules run in classical ML/code without generative prompt override. | **SECURE** |

---

## 2. Privacy & Data Handling Review

1. **Feedback Storage:** User ratings and comments submitted to `POST /api/feedback` are appended to local append-only JSON Lines storage ([`data/feedback/review_queue.jsonl`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/data/feedback/review_queue.jsonl)). Feedback does not automatically trigger unreviewed retraining.
2. **Diagnostic Gap Logging:** Queries triggering low confidence or out-of-domain rejections are recorded in [`reports/knowledge_gaps.json`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/reports/knowledge_gaps.json) without IP addresses or user-identifying telemetry.
3. **No Unsanctioned Outbound Traffic:** The application does not communicate with external analytics trackers, third-party marketing pixels, or remote telemetry collectors.

