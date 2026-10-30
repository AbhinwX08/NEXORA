# RELAY AI — Comprehensive Bug Registry & Remediation Log

**Audited Date:** October 31, 2026  
**Defect Classification:** P0 (Critical), P1 (High), P2 (Medium), P3 (Low), P4 (Enhancement)

---

## 1. Resolved Defect Log

| Bug ID | Severity | Affected Area | Root Cause | Fix Applied | Regression Test Added | Verified Status |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| **BUG-01** | **P0** | `LiveWorkspace.tsx` | Query execution used a fake 600ms `setTimeout` with hardcoded preset text instead of communicating with backend. | Rewired component to execute `sendChatMessage(...)` against live `POST /api/chat`. Presets only populate inputs. | `src/__tests__/components.test.tsx` | **FIXED & VERIFIED** |
| **BUG-02** | **P1** | `LiveWorkspace.tsx` | Trace inspection modal used static mock data with hardcoded 98.5ms latency and fabricated success claims. | Rewired to dynamically map real `complete_agent_trace` returned from backend. | `tests/test_multi_agent_system.py` | **FIXED & VERIFIED** |
| **BUG-03** | **P1** | `LiveWorkspace.tsx` | "Dispatch to Customer Webhook" button toggled fake sent state without any external integration. | Replaced button with honest disabled status: *"External Delivery: Webhook Not Configured"*. | `src/__tests__/components.test.tsx` | **FIXED & VERIFIED** |
| **BUG-04** | **P1** | `ResponseAgent.py` | Invented business phone numbers (`1-800-RELAY-AI`), email addresses, and support hours were returned. | Removed all fabricated constants. Returns truthful procedural advice and links to customer portal. | `tests/test_api.py` | **FIXED & VERIFIED** |
| **BUG-05** | **P1** | `SupportOrchestrator.py` | Escalation claimed human agent was contacted without any live CRM or ticketing system connected. | Changed messaging to indicate escalation is recommended and context is prepared for handoff. | `tests/test_journeys.py` | **FIXED & VERIFIED** |
| **BUG-06** | **P2** | `LandingPage.tsx` | Dataset statistics claimed 26,872 records and 10 categories (discrepancy with raw files). | Corrected across all components to verified 18,810 training rows, 4,031 validation, 27 intents, 11 categories. | `src/__tests__/metadata_and_presets.test.ts` | **FIXED & VERIFIED** |
| **BUG-07** | **P2** | `Sidebar.tsx` | Telemetry in sidebar claimed live 42ms latency and 99.42% live F1 score without live instrumentation. | Replaced fake live claims with verified corpus grounding counts (18,810 / 4,031 / 27 intents). | `src/__tests__/components.test.tsx` | **FIXED & VERIFIED** |
| **BUG-08** | **P2** | `api.py` | Health check endpoint only checked if model files existed on disk (`os.path.exists`), not if models loaded in memory. | Added active in-memory singleton readiness checks for orchestrator, classifier, and retriever. | `tests/test_api.py` | **FIXED & VERIFIED** |
| **BUG-09** | **P2** | `api.py` | Unhandled server exceptions leaked internal Python stack traces and file paths to API clients. | Added global error handler with request UUIDs and sanitized error codes. | `tests/test_api.py` | **FIXED & VERIFIED** |
| **BUG-10** | **P3** | `globals.css` | Global scrollbar was hidden (`overflow: hidden`), preventing mouse scrolling in tall workspace views. | Restored accessible custom scrollbars with clean webkit styling. | Manual verification across viewports | **FIXED & VERIFIED** |
| **BUG-11** | **P2** | `Header.tsx` | Mobile header overflowed on narrow viewports (360px–430px). | Redesigned header with responsive collapsible drawer. | Manual verification across viewports | **FIXED & VERIFIED** |
| **BUG-12** | **P2** | `theme.tsx` | `useTheme` threw fatal error when rendered outside `ThemeProvider` in unit tests or SSR. | Added safe fallback context (`theme: "system", resolvedTheme: "dark"`) to prevent rendering crashes. | `src/__tests__/components.test.tsx` | **FIXED & VERIFIED** |
| **BUG-13** | **P2** | `chatbot_router.py` | Product Guide mode had restrictive similarity cutoff (0.15) causing platform documentation queries to fall back to support demo. | Added `preferred_mode` routing prioritization and added calibration documentation to `product_guide.json`. | `tests/test_journeys.py` | **FIXED & VERIFIED** |

---

## 2. Open Non-Blocking Enhancements (P4)

1. **P4-01 (Dense Semantic Embeddings):** While hybrid TF-IDF RRF achieves 1.0 Recall@1 on training exemplars, adding sentence-transformers (e.g. `all-MiniLM-L6-v2`) would enhance paraphrase retrieval for short slang queries.
2. **P4-02 (Live WebSocket Streaming):** Responses are currently delivered via HTTP request-response. Adding WebSockets would support character-by-character token streaming.
3. **P4-03 (Live CRM Connector):** Implement real read-only connectors for Zendesk, Salesforce, or Shopify once official customer API credentials are provided.

