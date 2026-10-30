# RELAY AI — Test Execution Results & Verification Record

**Execution Timestamp:** October 31, 2026, 01:07:02 IST  
**Environment:** macOS 15.x / Python 3.13.9 / Node v24.21.0 / Vite 6.4.5  

---

## 1. Backend Python Test Suite Execution

**Command:**
```bash
python3 -m unittest discover tests -v
```

### Summary
- **Tests Discovered:** **53**
- **Tests Passed:** **53**
- **Tests Failed:** **0**
- **Tests Skipped:** **0**
- **Exit Code:** **0**
- **Duration:** **3.753 seconds**

### Module Breakdown
- [`tests/test_api.py`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/tests/test_api.py): 29 tests passed (Health, info, chat, intent, validation errors, slot sanitation, CORS preflight, replay, feedback, error masking).
- [`tests/test_journeys.py`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/tests/test_journeys.py): 13 tests passed (All 13 user journeys: normal resolution, clarification, ambiguity, escalation, product guide, support demo, evidence, replay, voice synthesis/STT, feedback, dataset info, evaluation benchmarks, failure recovery).
- [`tests/test_multi_agent_system.py`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/tests/test_multi_agent_system.py): 7 tests passed (End-to-end multi-agent orchestration, agent failure fallbacks, Pydantic serialization).
- [`tests/test_uncertainty.py`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/tests/test_uncertainty.py): 4 tests passed (Calibrated probability distribution, prediction margins, out-of-domain rejection, ambiguous intent isolation).

---

## 2. Frontend Vitest Test Suite Execution

**Command:**
```bash
npm test -- --run
```

### Summary
- **Test Files:** **3 passed (3)**
- **Tests Passed:** **19 passed (19)**
- **Tests Failed:** **0**
- **Exit Code:** **0**
- **Duration:** **1.51 seconds**

### Test Files Breakdown
- `src/__tests__/metadata_and_presets.test.ts`: 5 tests passed (Dataset figures 18,810/4,031/27/11, preset input-only verification).
- `src/__tests__/api_client.test.ts`: 5 tests passed (API client fetch mapping, headers, error classes, abort controllers).
- `src/__tests__/components.test.tsx`: 9 tests passed (Header, Sidebar 6 views, WorkspacePreviewCard preview tag, LiveWorkspace query console, DatasetExplorer column schemas, EvaluationDashboard verified metrics, EvidenceLedger 5 provenance layers, DecisionReplayLab counterfactual delta cards, FloatingAssistant launcher).

---

## 3. Production Build Compilation Check

**Command:**
```bash
npm run build
```

### Summary
- **Exit Code:** **0**
- **Duration:** **3.52 seconds**
- **Compiler Output:**
  - `dist/index.html`: 1.25 kB (gzip: 0.62 kB)
  - `dist/assets/index-0VPQYoh-.css`: 44.34 kB (gzip: 8.25 kB)
  - `dist/assets/index-BE1nvddU.js`: 569.38 kB (gzip: 160.83 kB)
- **TypeScript Errors:** **0**

