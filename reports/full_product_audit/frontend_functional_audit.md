# RELAY AI — Frontend Functional & Visual Audit

**Audited Date:** October 31, 2026  
**Audited Framework:** React 19 / TypeScript / Vite 6 / Tailwind CSS / Framer Motion / Lucide React  
**Base Test URL:** `http://localhost:3000/`

---

## 1. Primary Views Functional Verification

### View 1: Landing Page (`src/components/landing/LandingPage.tsx`)
- **Status:** **PASS**
- **Brand Identity:** Verified exact headline: *"Every customer query deserves a clear next step."* and tagline: *"From customer query to verified resolution."*
- **Architecture Diagram:** Interactive multi-agent pipeline node sequence accurately depicts the 4-stage pipeline (Customer Query -> A1 Intent Analyst -> A2 Response Specialist -> Validation Agent Gate -> Decision Policy).
- **Truthful Dataset Scope Strip:** Accurately reflects 18,810 training rows, 4,031 validation rows, 27 intents, and 11 categories (no fabricated 26,872 rows or 10 categories).
- **Navigation CTAs:** Action buttons cleanly route to Live Workspace, Dataset Explorer, Evaluation Dashboard, Evidence Ledger, and Replay Lab.
- **Theme Placement:** Verified zero duplicate theme switches on the landing page or hero.

### View 2: Live AI Workspace (`src/components/workspace/LiveWorkspace.tsx`)
- **Status:** **PASS**
- **Execution Flow:** Fully eliminated legacy `setTimeout(..., 600)` simulation. All executions dispatch real HTTP requests to `POST /api/chat`.
- **Query Input Console:** Presets only populate input and slot fields; they do not simulate AI outputs. Empty queries are blocked client-side. Character counter (2000 max) active.
- **Dynamic Slot Injection:** Supports user-defined slot key-value pairs (e.g. `Order Number: 98214`) passed directly to backend.
- **Trace Inspection Modal:** Renders real `AgentTrace` array containing active durations, input payloads, output payloads, and decision reasons.
- **External Webhook Element:** Replaced fake dispatch button with honest disabled status: *"External Delivery: Webhook Not Configured"*.
- **Voice Shortcut:** Embedded `VoiceInputButton` allows dictating inquiries into the input box; `SpeechPlaybackButton` enables reading aloud final responses.

### View 3: Resolution Evidence Ledger (`src/components/evidence/EvidenceLedger.tsx`)
- **Status:** **PASS**
- **Lineage Tracking:** Displays all five verifiable provenance categories:
  1. `MODEL PREDICTION` (Platt calibrated probabilities, intent, category, margin).
  2. `DATASET EXAMPLE` (Cosine similarity, source split `train.csv`, matched training instruction).
  3. `DETERMINISTIC CHECK` (Validation agent 7-point checklist with passed/failed states).
  4. `USER-PROVIDED VALUE` (Extracted and user-supplied parameters).
  5. `EXTERNAL VERIFIED VALUE` (Truthful unconfigured external CRM state).
- **Filtering & Search:** Real-time filter tabs and text search filter evidence records without reloading.
- **Knowledge Gap Log Panel:** Collapsible drawer displays recent low-similarity and out-of-domain inquiries logged to `reports/knowledge_gaps.json`.
- **Export Functionality:** "Export Evidence JSON" downloads complete machine-readable audit report.

### View 4: Decision Replay Lab (`src/components/replay/DecisionReplayLab.tsx`)
- **Status:** **PASS**
- **Counterfactual Scenarios:** 5 pre-built sensitivity suites:
  1. Typo & Paraphrase Robustness (`"I would like to cancel my order please"` vs `"pls cncl my ordr asapp"`).
  2. Human Escalation Gate Activation (`"Where is my package tracking info?"` vs `"Where is my package? I want to speak to a real human agent now!"`).
  3. Slot Completeness Sensitivity (`"I want to cancel my order"` vs `"I want to cancel order #98214"`).
  4. Out-of-Domain Boundary Test (`"How do I track my delivery status?"` vs `"Can you give me a recipe for chocolate cake?"`).
  5. Ambiguous Intent Disambiguation (`"I want to change my account details"` vs `"Can I get a refund on my account billing invoice?"`).
- **Comparative Deltas:** Evaluates both variants via `POST /api/replay` and calculates real deltas ($\Delta$ confidence, $\Delta$ margin, $\Delta$ similarity, $\Delta$ latency, intent match, decision identical).
- **Raw JSON Inspection:** Modal displays complete comparative JSON payload for judges.

### View 5: Dataset Explorer (`src/components/dataset/DatasetExplorer.tsx`)
- **Status:** **PASS**
- **Verified Metrics:** Shows verified 18,810 training rows, 4,031 validation rows, 22,841 total records, 27 intents, and 11 categories.
- **Flags Audit Note:** Explains that 349 distinct flag combinations exist without a codebook and refrains from assigning fabricated semantic meanings.
- **Filtering & Search:** Filter by category and intent; real-time keyword search; pagination across records.

### View 6: Evaluation Dashboard (`src/components/evaluation/EvaluationDashboard.tsx`)
- **Status:** **PASS**
- **Audited Benchmarks:**
  - Validation Accuracy: **100.0%** (4,031 held-out samples).
  - Expected Calibration Error (ECE): **1.19% (0.0119)** on baseline, **0.87% (0.0087)** on Candidate C.
  - Brier Score: **0.00054** on baseline, **0.00038** on Candidate C.
  - Retrieval Recall@1: **1.000**, MRR: **1.000**, Mean Cosine Similarity: **0.8467**.
- **Transparency Notice:** Explicitly clarifies that validation figures represent offline held-out evaluation and not live production guarantees.

---

## 2. Global Secondary Components

### Floating Assistant (`src/components/assistant/FloatingAssistant.tsx`)
- **Launcher:** Fixed pill button at bottom-right of viewport with pulse indicator and unread badge.
- **Dual Modes:**
  1. **Product Guide:** Answers questions about platform architecture, training datasets, Platt calibration, ECE, and pipeline stages using `data/knowledge/product_guide.json`.
  2. **Support Demo:** Interactive customer support conversations routed through the multi-agent pipeline with multi-turn session memory.
- **Citations & Grounding:** Expandable accordion displays source documents, similarity scores, and excerpts.
- **Feedback Widget:** 1-to-5 star rating, helpfulness toggle (yes/no), and optional comment note submitted directly to `POST /api/feedback`.

### Half-Duplex Voice Controller (`src/components/voice/VoiceController.tsx`)
- **Enforced Turn-Taking Rule:** Global audio lock guarantees that active recording stops before TTS speech playback starts, and microphone remains off after audio finishes.
- **Controls:** Pulsing REC badge during capture; live waveform indicator; read-aloud button on responses with stop playback toggle.

### Theme System (`src/lib/theme.tsx`)
- **Strict Location Rule:** Single theme toggle (`Light` / `Dark` / `Auto`) placed **only** at the bottom of the persistent desktop sidebar and within the mobile navigation drawer.
- **Persistence:** LocalStorage key `relay_theme` with automatic sync to `prefers-color-scheme`.

