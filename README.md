# RELAY AI — Coordinated Multi-Agent Customer Support Intelligence Platform

> **"From customer query to verified resolution."**

RELAY AI is an explainable, deterministic multi-agent customer-support intelligence platform. Built with a **Flask / Python** multi-agent backend and a **React 19 / TypeScript / Tailwind CSS** interactive frontend, it moves customer support beyond single-prompt chatbots into structured, audited, and calibrated resolution pipelines.

---

## 🏛️ Architecture & Agent Responsibilities

RELAY AI operates via specialized, deterministic Python agent modules coordinated by typed Pydantic contracts and immutable execution tracing:

```
CUSTOMER QUERY
     ↓
A1 — INTENT ANALYST
(TF-IDF + Platt Sigmoid Probability Calibration + Margin Separation)
     ↓
A2 — RESPONSE SPECIALIST
(Dual TF-IDF Vector Retrieval against 18,810-sample Training Index + Slot Extraction)
     ↓
VALIDATION AGENT
(7-Point Deterministic Safety & Anti-Fabrication Gate)
     ↓
SUPPORT ORCHESTRATOR
(Outcome Synthesis & Complete Agent Trace)
     ↓
FINAL DECISION & PARAMETERIZED RESPONSE
```

### The Multi-Agent Pipeline

| Component | Class / Service | Primary Responsibility |
| :--- | :--- | :--- |
| **A1 — Intent Analyst** | `app.agents.intent_agent.IntentAnalystAgent` | Multiclass intent classification across 27 domain intents and 11 categories with Platt sigmoid probability calibration ($P_1$) and prediction margin ($P_1 - P_2$). |
| **A2 — Response Specialist** | `app.agents.response_agent.ResponseAgent` | Contextual instruction retrieval using dual TF-IDF index (instruction and response) and dynamic customer slot parameterization (e.g. order numbers, amounts, emails). |
| **Validation Agent** | `app.agents.validation_agent.ValidationAgent` | 7-point deterministic verification gate: component availability, human escalation triggers, domain boundary cutoff, confidence thresholds, retrieval similarity, placeholder hygiene, and parameter completeness. |
| **Support Orchestrator** | `app.orchestration.support_orchestrator.SupportOrchestrator` | Coordinates inter-agent handoffs, manages failure modes, routes uncertainty, and outputs typed `OrchestratorResult` payloads with full execution trace. |

### Deterministic Final Outcomes

1. **`HIGH_CONFIDENCE: PROCEED_AUTOMATED`**: Validated in-domain request with high confidence, strong retrieval similarity, and all required customer slots satisfied.
2. **`HIGH_CONFIDENCE: NEED_SLOT_CLARIFICATION`**: Intent is confident, but required customer-specific parameters (e.g. order number, invoice code) are missing. Polite parameter clarification is requested rather than fabricating customer records.
3. **`UNCERTAIN: AMBIGUOUS_INTENT_CLARIFICATION`**: Low confidence margin between top alternative intents triggers clarifying questions.
4. **`HUMAN_ESCALATION: ESCALATE_TO_HUMAN`**: Escalation intents or keywords (e.g. "human agent", "supervisor") bypass automated resolution and flag context for support specialist review.
5. **`UNSUPPORTED: UNSUPPORTED_REJECTION`**: Queries falling outside the 11 supported service categories are rejected safely.
6. **`SERVICE_ERROR`**: Upstream component failure produces a safe, graceful error message without exposing technical exception details.

---

## 📊 Grounding Corpus & Offline Benchmarks

### Verified Supplied Dataset Information

- **Training Records**: 18,810 (`data/raw/train.csv`)
- **Validation Records**: 4,031 (`data/raw/validation.csv`)
- **Total Records**: 22,841
- **Supported Intents**: 27
- **Supported Categories**: 11 (`ACCOUNT`, `CANCEL`, `CONTACT`, `DELIVERY`, `FEEDBACK`, `INVOICE`, `ORDER`, `PAYMENT`, `REFUND`, `SHIPPING`, `SUBSCRIPTION`)
- **Flags Column**: 349 distinct combination tags without an official codebook. RELAY AI does not invent meanings for individual flag characters.
- **Corpus Nature**: Customer-support instruction-response pairs. It is not a live customer account database, billing ledger, or real-time courier tracking system.

### Verified Offline Evaluation Benchmarks (from `reports/`)

- **A1 Intent Validation Accuracy**: 100.0% (4,031 / 4,031 on held-out `validation.csv`)
- **A1 Macro F1 / Weighted F1**: 1.0000 / 1.0000
- **Expected Calibration Error (ECE)**: 0.0119 (1.19%)
- **Brier Score**: 0.00054
- **A2 Retrieval Recall@1**: 1.0000 (Mean Cosine Similarity: 0.8467)
- **Offline Benchmark Latency**: ~0.37 ms per query

*Note: All benchmark figures reflect offline evaluation on the fixed validation split and are not live operational guarantees.*

---

## 📁 Repository Structure

```
relay-ai/
├── app/                              # Backend Multi-Agent Implementation
│   ├── agents/                       # Coordinated Python agents
│   │   ├── intent_agent.py           # A1: Intent Analyst
│   │   ├── response_agent.py         # A2: Response Specialist
│   │   ├── validation_agent.py       # Validation Agent (7-point gate)
│   │   └── decision_agent.py         # Decision & Uncertainty Agent
│   ├── orchestration/
│   │   └── support_orchestrator.py   # Multi-Agent Support Orchestrator
│   ├── schemas/
│   │   └── agent_models.py           # Typed Pydantic schemas (AgentTrace, OrchestratorResult)
│   ├── services/
│   │   └── retrieval_service.py      # TF-IDF Dual Vector Retrieval Engine
│   └── api.py                        # Flask HTTP REST API
├── artifacts/
│   └── models/                       # Trained & Calibrated Model Artifacts
│       ├── intent_classifier.joblib
│       ├── calibrated_intent_classifier.joblib
│       ├── response_retriever.joblib
│       ├── baseline_intent_model.joblib
│       └── calibration_config.json
├── data/
│   └── raw/                          # Raw CSV datasets
│       ├── train.csv                 # 18,810 training records
│       └── validation.csv            # 4,031 validation records
├── reports/                          # Audit & evaluation reports (JSON, CSV, MD)
├── src/                              # React 19 Frontend
│   ├── components/
│   │   ├── workspace/
│   │   │   └── LiveWorkspace.tsx     # Interactive Live AI Workspace with real backend connection
│   │   ├── landing/
│   │   │   ├── LandingPage.tsx       # Enterprise landing page
│   │   │   └── WorkspacePreviewCard.tsx # Illustrative pipeline demonstration
│   │   ├── dataset/
│   │   │   └── DatasetExplorer.tsx   # Verified dataset schema & category breakdown
│   │   ├── evaluation/
│   │   │   └── EvaluationDashboard.tsx # Offline metrics & selective prediction curves
│   │   └── layout/
│   │       ├── Header.tsx            # Header with genuine health telemetry
│   │       └── Sidebar.tsx           # Persistent left navigation
│   ├── data/
│   │   ├── datasetMetadata.ts        # Central single source of truth for metrics
│   │   └── presets.ts                # 5 clearly labelled test prompts (no fake execution)
│   ├── lib/
│   │   ├── api.ts                    # Centralized typed HTTP API service
│   │   └── utils.ts                  # Tailwind utility
│   ├── types/
│   │   └── api.ts                    # TypeScript schemas mirroring backend Pydantic models
│   ├── App.tsx                       # View routing (landing, workspace, dataset, evaluation)
│   └── main.tsx                      # Vite React entrypoint
├── tests/                            # Backend Python test suite (unittest)
│   ├── test_api.py                   # Flask API integration tests
│   ├── test_multi_agent_system.py    # Multi-agent orchestrator end-to-end tests
│   └── test_uncertainty.py           # Uncertainty routing tests
├── requirements.txt                  # Python dependencies
├── .env.example                      # Environment variables reference
├── package.json                      # Node dependencies & test scripts
├── vite.config.ts                    # Vite config with /api development proxy
└── tailwind.config.js                # Design token configuration
```

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Terminal 1: Backend API

```bash
# 1. Navigate to project root
cd relay-ai

# 2. Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Launch backend Flask API server
python3 -m app.api
```
Backend will start on `http://localhost:8000`.

### Terminal 2: Frontend Web Application

```bash
# 1. Navigate to project root
cd relay-ai

# 2. Install Node dependencies
npm install

# 3. Start Vite development server
npm run dev
```
Frontend will be available at `http://localhost:3000`.

---

## 📡 API Documentation

### `GET /api/health`
Returns process vitality, disk artifact presence, and active runtime model instance readiness.
```json
{
  "status": "healthy",
  "service": "RELAY AI Multi-Agent Customer Support Engine",
  "version": "1.0.0",
  "timestamp": "2026-10-30T18:00:00Z",
  "components": {
    "api_server": "running",
    "intent_classifier_file": "available",
    "response_retriever_file": "available",
    "calibration_config": "available",
    "intent_engine_runtime": "ready",
    "retrieval_engine_runtime": "ready"
  }
}
```

### `GET /api/info`
Returns verified corpus metadata, operational categories, and offline evaluation benchmark metrics.

### `POST /api/chat`
Primary customer support interaction endpoint. Executes full multi-agent pipeline (A1 + A2 + Validation).

**Request Body**:
```json
{
  "query": "I want to cancel my order #98214",
  "customer_slots": {
    "Order Number": "98214"
  }
}
```

**Response Body**:
```json
{
  "original_customer_query": "I want to cancel my order #98214",
  "intent_prediction": "cancel_order",
  "category": "ORDER",
  "calibrated_confidence": 0.8264,
  "margin": 0.3455,
  "alternative_intents": [
    { "rank": 1, "intent": "cancel_order", "category": "ORDER", "probability": 0.8264 },
    { "rank": 2, "intent": "change_order", "category": "ORDER", "probability": 0.0521 }
  ],
  "retrieved_response": "I understand you would like to cancel your order associated with purchase number 98214...",
  "source_example": "cancel purchase with order number",
  "retrieval_similarity": 0.6849,
  "placeholder_status": "resolved",
  "unresolved_placeholders": [],
  "validation_checks": [
    { "check_name": "component_availability", "passed": true, "detail": "A1 Intent Analyst payload received successfully." },
    { "check_name": "domain_boundary_check", "passed": true, "detail": "Query conforms to supported business domain." },
    { "check_name": "intent_confidence_and_separation", "passed": true, "detail": "Intent confidence (0.8264) and margin (0.3455) verified." },
    { "check_name": "retrieval_similarity_check", "passed": true, "detail": "Retrieval similarity verified (0.6849 >= 0.45)." },
    { "check_name": "placeholder_hygiene_check", "passed": true, "detail": "No unresolved raw template braces present in output." },
    { "check_name": "parameter_completeness_check", "passed": true, "detail": "All required response parameters and system constants are satisfied." }
  ],
  "final_decision": "HIGH_CONFIDENCE: PROCEED_AUTOMATED",
  "final_response": "I understand you would like to cancel your order associated with purchase number 98214...",
  "complete_agent_trace": [
    {
      "agent_name": "A1_IntentAnalyst",
      "processing_status": "SUCCESS",
      "duration_ms": 1.25,
      "decision_reason": "Calibrated prediction confident..."
    },
    {
      "agent_name": "A2_ResponseSpecialist",
      "processing_status": "SUCCESS",
      "duration_ms": 2.10,
      "decision_reason": "Contextual response retrieved with similarity 0.6849; all slots resolved."
    },
    {
      "agent_name": "ValidationAgent",
      "processing_status": "SUCCESS",
      "duration_ms": 0.35,
      "decision_reason": "All validation checks passed cleanly. Resolution approved for customer delivery."
    }
  ],
  "total_duration_ms": 3.85
}
```

### `POST /api/intent`
Fast intent classification endpoint (A1 only).

---

## 🧪 Testing & Validation

### Backend Python Test Suite (29 Tests)
```bash
python3 -m unittest discover tests
```
Validates:
- Health and info endpoint schemas
- Live multi-agent orchestration via Flask client
- Request validation (empty queries, malformed JSON, oversized payloads, invalid slot parameters)
- Escalation routing, slot clarification, and domain boundary rejection
- Pydantic contract serialization and error handling

### Frontend Test Suite (16 Tests)
```bash
npm test
```
Validates:
- API client service, abort signal handling, error propagation
- Single source of truth dataset metadata integrity (no fabricated 5-flag counts)
- Component rendering (Header, Sidebar, WorkspacePreviewCard, LiveWorkspace, DatasetExplorer, EvaluationDashboard)
- Absence of fake profiles, fake timings, fake KB references, and fake webhook success

### Frontend Production Build
```bash
npm run build
```
Validates TypeScript compilation and Vite production bundle generation with zero errors.

---

## 🔒 Security & Reliability Guarantees

1. **Request Validation**: Enforces length cutoffs ($\le 2,000$ characters) and strict Pydantic schemas on all endpoints.
2. **Safe Error Responses**: Server-side error logging with UUID tracking; no internal Python stack traces exposed to clients.
3. **Restricted CORS**: Configurable via `CORS_ORIGINS`; avoids open wildcard origins in production configurations.
4. **Anti-Fabrication Policy**: Business contact lines, external links, policy durations, and customer records are never invented. Unconfigured external integrations prompt for clarification or route to human escalation.
