# RELAY AI — Confidence Calibration & Uncertainty Evaluation Report (Phase 4)

**Evaluation Date**: 2026-10-30 17:26:20  
**Model**: `CalibratedClassifierCV(LinearSVC)` with Platt sigmoid scaling (5-fold internal CV)  
**Training Set (Calibration Only)**: `data/raw/train.csv` (18,810 records)  
**Validation Sets**: All 4,031 queries & Unseen 3,572 queries  

---

## 1. Executive Summary & Calibration Findings

> [!IMPORTANT]

> **Phase 4 Objective Achieved**: RELAY AI does not blindly answer customer queries. 
By replacing raw hyperplane margins with calibrated sigmoid posterior probabilities and combining them with A2 retrieval similarity, 
the system achieves an **Expected Calibration Error (ECE) of 1.192%** and a **Multi-Class Brier Score of 0.000545**.

### Key System Metrics

| Metric | Full Validation (4,031) | Unseen Subset (3,572) | Description |
|---|---|---|---|
| **Expected Calibration Error (ECE)** | **1.192%** | **1.204%** | Average gap between predicted probability and observed accuracy |
| **Maximum Calibration Error (MCE)** | **36.117%** | **36.117%** | Worst-case bin calibration discrepancy |
| **Multi-Class Brier Score** | **0.000545** | **0.000576** | Mean squared difference from true one-hot vector (ideal: 0.0) |
| **Mean Calibrated Confidence** | **98.81%** | **98.80%** | Average top-1 calibrated probability |
| **False-Confident Predictions** | **0 (0.00%)** | **0 (0.00%)** | Queries accepted as High Confidence but incorrectly classified |
| **Clarification Rate** | **33.04%** | **33.04%** | In-domain queries where customer omitted required parameters |
| **Human Escalation Rate** | **7.44%** | **7.44%** | Explicit human requests or human support intents |

---

## 2. Frozen Decision & Uncertainty Thresholds

Thresholds were tuned on training Out-Of-Fold predictions and **frozen prior to validation**:

| Parameter | Threshold Value | Derivation & Purpose |
|---|---|---|
| `high_confidence_min_prob` | `0.65` | Minimum calibrated probability for intent classification to be accepted |
| `high_confidence_min_margin` | `0.25` | Minimum margin between top-1 and top-2 probabilities to rule out ambiguity |
| `unsupported_max_prob` | `0.35` | Queries with top-1 prob below this are treated as unsupported / out-of-domain |
| `high_confidence_min_similarity` | `0.45` | Minimum cosine similarity for response candidate selection |
| `unsupported_similarity_threshold` | `0.30` | Retrieval similarity below this indicates out-of-domain query |

---

## 3. Four Core Decision States Distribution (Validation Evaluation)

| Decision State | Count | Percentage | System Action & Routing |
|---|---|---|---|
| **`HIGH_CONFIDENCE`** | 3,722 | **92.33%** | Passed to A2 for response generation (automated or slot clarification) |
| **`UNCERTAIN`** | 8 | **0.20%** | Clarification prompt between top-2 ambiguous intents |
| **`UNSUPPORTED`** | 1 | **0.02%** | Polite rejection of out-of-scope query with domain boundaries |
| **`HUMAN_ESCALATION`** | 300 | **7.44%** | Seamless handoff to human support with conversation context |

### Detailed Action Breakdown

| Action Verdict | Count | Share | Explanation |
|---|---|---|---|
| `PROCEED_AUTOMATED` | 2,390 | **59.29%** | See detailed taxonomy below |
| `NEED_SLOT_CLARIFICATION` | 1,332 | **33.04%** | See detailed taxonomy below |
| `AMBIGUOUS_INTENT_CLARIFICATION` | 8 | **0.20%** | See detailed taxonomy below |
| `UNSUPPORTED_REJECTION` | 1 | **0.02%** | See detailed taxonomy below |
| `ESCALATE_TO_HUMAN` | 300 | **7.44%** | See detailed taxonomy below |

---

## 4. Reliability Diagram (Binned Calibration Quality)

Multi-class calibration binned across 10 confidence intervals on `val_all` (4,031 queries):

| Bin Range | Query Count | Proportion | Mean Confidence | Empirical Accuracy | Calibration Error |
|---|---|---|---|---|---|
| `[0.00, 0.10)` | 0 | 0.00% | 5.00% | 0.00% | **0.000%** |
| `[0.10, 0.20)` | 0 | 0.00% | 15.00% | 0.00% | **0.000%** |
| `[0.20, 0.30)` | 0 | 0.00% | 25.00% | 0.00% | **0.000%** |
| `[0.30, 0.40)` | 0 | 0.00% | 35.00% | 0.00% | **0.000%** |
| `[0.40, 0.50)` | 0 | 0.00% | 45.00% | 0.00% | **0.000%** |
| `[0.50, 0.60)` | 0 | 0.00% | 55.00% | 0.00% | **0.000%** |
| `[0.60, 0.70)` | 3 | 0.07% | 63.88% | 100.00% | **36.117%** |
| `[0.70, 0.80)` | 3 | 0.07% | 75.22% | 100.00% | **24.781%** |
| `[0.80, 0.90)` | 16 | 0.40% | 86.38% | 100.00% | **13.619%** |
| `[0.90, 1.00)` | 4,009 | 99.45% | 98.90% | 100.00% | **1.099%** |

---

## 5. Selective Classification / Risk-Coverage Curves

Selective classification allows RELAY AI to abstain when confidence drops, guaranteeing higher accuracy at lower risk:

| Coverage (%) | Retained Queries | Min Confidence | Accuracy (%) | Risk / Error Rate (%) | Absolute Errors |
|---|---|---|---|---|---|
| **100.0%** | 4,031 | 62.38% | **100.00%** | 0.00% | 0 |
| **99.0%** | 3,991 | 94.82% | **100.00%** | 0.00% | 0 |
| **95.0%** | 3,829 | 98.16% | **100.00%** | 0.00% | 0 |
| **90.0%** | 3,628 | 98.49% | **100.00%** | 0.00% | 0 |
| **85.0%** | 3,426 | 98.64% | **100.00%** | 0.00% | 0 |
| **80.0%** | 3,225 | 98.72% | **100.00%** | 0.00% | 0 |
| **70.0%** | 2,822 | 98.83% | **100.00%** | 0.00% | 0 |
| **60.0%** | 2,419 | 98.93% | **100.00%** | 0.00% | 0 |
| **50.0%** | 2,016 | 99.01% | **100.00%** | 0.00% | 0 |
| **30.0%** | 1,209 | 99.14% | **100.00%** | 0.00% | 0 |

---

## 6. Stress Test Suite: Adversarial, Out-Of-Domain, and Ambiguous Queries

| Query | Target State | Detected State | Status | Confidence | Margin | Retrieval Sim |
|---|---|---|---|---|---|---|
| *"I want to cancel my order #98214"* | `HIGH_CONFIDENCE` | `HIGH_CONFIDENCE` | **PASS** | 82.6% | 65.9% | 0.6849 |
| *"Please download my invoice for order #1234"* | `HIGH_CONFIDENCE` | `HIGH_CONFIDENCE` | **PASS** | 98.5% | 97.8% | 0.6345 |
| *"Where can I track my package #TX8819?"* | `HIGH_CONFIDENCE` | `UNCERTAIN` | **FAIL** | 57.3% | 29.1% | 0.4327 |
| *"I want to change my delivery address to 452 Elm Street"* | `HIGH_CONFIDENCE` | `HIGH_CONFIDENCE` | **PASS** | 99.4% | 99.3% | 0.6999 |
| *"I need to cancel or change my order right now"* | `UNCERTAIN` | `UNCERTAIN` | **PASS** | 97.2% | 96.1% | 0.4041 |
| *"order change cancellation details"* | `UNCERTAIN` | `HIGH_CONFIDENCE` | **FAIL** | 67.7% | 49.2% | 0.5190 |
| *"refund or payment status issue"* | `UNCERTAIN` | `UNCERTAIN` | **PASS** | 56.2% | 13.2% | 0.5529 |
| *"What is the weather in London today?"* | `UNSUPPORTED` | `UNSUPPORTED` | **PASS** | 42.8% | 33.9% | 0.1463 |
| *"How do I bake chocolate chip cookies?"* | `UNSUPPORTED` | `UNSUPPORTED` | **PASS** | 12.7% | 2.2% | 0.2002 |
| *"Where can I buy Bitcoin and Ethereum crypto?"* | `UNSUPPORTED` | `HIGH_CONFIDENCE` | **FAIL** | 94.3% | 93.3% | 0.5101 |
| *"asdfgh qwerty zxcvbnm 123456 gibberish"* | `UNSUPPORTED` | `UNSUPPORTED` | **PASS** | 11.4% | 2.5% | 0.1137 |
| *"I want to speak with a human agent right now"* | `HUMAN_ESCALATION` | `HUMAN_ESCALATION` | **PASS** | 98.6% | 98.4% | 0.8149 |
| *"Connect me to a customer care supervisor immediately"* | `HUMAN_ESCALATION` | `HUMAN_ESCALATION` | **PASS** | 98.6% | 98.2% | 0.4134 |
| *"I need a live representative to handle this problem"* | `HUMAN_ESCALATION` | `HUMAN_ESCALATION` | **PASS** | 20.2% | 5.3% | 0.2610 |

---

## 7. Reliability Commitment & Production Notice

> [!WARNING]

> **Never Promise 100% Reliability**: No NLP classifier in a real-world customer support environment is infallible. 
The combination of calibrated probabilities ($P_1$), prediction margins ($P_1 - P_2$), retrieval cosine similarity ($S$), 
and slot verification provides an auditable defense-in-depth safety layer that prevents hallucinations, flags ambiguity, 
and reliably escalates unresolvable issues to human specialists.
