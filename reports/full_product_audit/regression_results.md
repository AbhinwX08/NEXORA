# RELAY AI — Regression & Invariance Verification Report

**Audited Date:** October 31, 2026  
**Objective:** Confirm that bug fixes and architectural enhancements did not regress existing working functionality, introduce data leakage, or alter frozen evaluation baselines.

---

## 1. Frozen Baseline Invariance Checks

| Protected Asset | Expected Check | Verified Result | Invariance Status |
| :--- | :--- | :--- | :---: |
| `data/raw/train.csv` | Exactly 18,810 rows, zero modifications | md5 checksum matches original; row count 18,810 | **UNTOUCHED & PRESERVED** |
| `data/raw/validation.csv` | Exactly 4,031 rows, isolated evaluation | md5 checksum matches original; zero training leakage | **UNTOUCHED & PRESERVED** |
| `artifacts/models/intent_classifier.joblib` | Baseline model file preserved | File size 9.3 MB, identical binary hash | **UNTOUCHED & PRESERVED** |
| `artifacts/models/response_retriever.joblib` | Production retrieval index preserved | File size 60.9 MB, identical binary hash | **UNTOUCHED & PRESERVED** |
| `artifacts/models/calibration_config.json` | Baseline calibration parameters preserved | 941 bytes, identical JSON structure | **UNTOUCHED & PRESERVED** |

---

## 2. API Contract Backward Compatibility

All updates to the frontend and backend strictly preserved the contract established in [`docs/contracts/relay-api-v1.md`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/docs/contracts/relay-api-v1.md):
- `GET /api/health` preserves all existing keys (`service`, `status`, `version`, `components`) while adding active runtime readiness flags.
- `GET /api/info` preserves all top-level keys (`system`, `version`, `dataset_metadata`, `offline_validation_benchmarks`).
- `POST /api/chat` returns all fields required by legacy consumers (`intent_prediction`, `calibrated_confidence`, `category`, `final_response`, `complete_agent_trace`).
- `POST /api/intent` preserves response structure (`top_intent`, `category`, `confidence`, `margin`, `alternatives`).

---

## 3. Decision Precedence Invariance

Regression tests in `tests/test_uncertainty.py` confirmed that decision precedence remains invariant:
1. Explicit escalation triggers immediately take precedence over intent classification.
2. Missing customer slots always route to `NEED_SLOT_CLARIFICATION`, regardless of whether classification confidence is 99%+.
3. Out-of-domain queries always route to `UNSUPPORTED_REJECTION`, preventing hallucinated responses.
4. Total test execution across the entire repository produces 0 failures across 53 Python tests and 19 Vitest tests.

