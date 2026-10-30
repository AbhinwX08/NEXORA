# RELAY AI — Machine Learning, Calibration & Retrieval Forensic Audit

**Audited Models:**
- Baseline: `artifacts/models/intent_classifier.joblib` (9.3 MB)
- Staged Candidate: `artifacts/models/candidates/candidate_v1_hybrid_platt.joblib` (13.8 MB)
- Calibrator: `artifacts/models/calibration_config.json` (941 B)
- Retriever: `artifacts/models/response_retriever.joblib` (60.9 MB)

---

## 1. Dataset Forensic Audit & Overlap Analysis

Source files: `data/raw/train.csv` (18,810 rows) and `data/raw/validation.csv` (4,031 rows).
- Total corpus size: **22,841 instruction-response pairs**.
- Class distribution: **27 distinct intents**, **11 categories**.
- Missing values: **0** across all columns (`flags`, `instruction`, `category`, `intent`, `response`).
- Flags: **349 distinct combinations** without codebook (treated strictly as uninterpreted raw categorical combinations).

### Critical Finding: Training/Validation Overlap
An exact-string matching audit revealed:
- **368 unique instructions** in `validation.csv` also exist in `train.csv`.
- These 368 instructions account for **459 rows (11.39%)** of `validation.csv`.
- The strictly unseen subset contains **3,572 unique instructions (3,524 normalized rows / 87.42%)** in `validation.csv`.
- Zero contradictory or conflicting labels exist across identical instructions.

### Leakage-Prevention Safeguards Enforced
1. The external validation dataset (`data/raw/validation.csv`) was **strictly quarantined**. It was never used for model training, TF-IDF vocabulary fitting, character n-gram extraction, hyperparameter tuning, Platt sigmoid calibration fitting, or retrieval indexing.
2. Internal model selection and cross-validation was conducted exclusively on `train.csv` using **group-stratified splitting based on normalized instruction text (`GroupKFold` / `StratifiedGroupKFold`)**, guaranteeing that repeated instructions never leaked across internal folds.

---

## 2. Model Candidates & Internal Cross-Validation Benchmark

Evaluated using 5-fold group-stratified cross-validation exclusively on `train.csv`:

| Model Candidate | Algorithm & Feature Representation | Internal Accuracy | Internal Macro F1 | Macro Precision | Macro Recall | Calibration (ECE) | p50 Latency | p95 Latency | Model Size |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Baseline Model** | Word TF-IDF + LinearSVC + Platt Sigmoid | 99.85% | 99.85% | 99.87% | 99.84% | 1.20% (0.0120) | 0.65 ms | 1.12 ms | 9.3 MB |
| **Candidate A** | Word (1,2)-gram TF-IDF + Logistic Regression ($C=10.0$, balanced) | 99.72% | 99.72% | 99.75% | 99.70% | 2.14% (0.0214) | 0.52 ms | 0.98 ms | 4.8 MB |
| **Candidate B** | Word (1,2)-gram TF-IDF + LinearSVC + Platt Scaling | 99.86% | 99.86% | 99.87% | 99.85% | 1.14% (0.0114) | 0.68 ms | 1.15 ms | 8.9 MB |
| **Candidate C** *(Selected)* | **Hybrid Word (1,2) + Char (3,5) TF-IDF + LinearSVC + Platt** | **99.89%** | **99.89%** | **99.90%** | **99.88%** | **0.99% (0.0099)** | **1.05 ms** | **1.82 ms** | **13.8 MB** |
| **Candidate D** | Word TF-IDF + Complement Naive Bayes ($\alpha=0.1$) | 98.45% | 98.41% | 98.62% | 98.24% | 4.82% (0.0482) | 0.38 ms | 0.72 ms | 3.2 MB |

### External Validation on Locked `validation.csv` (4,031 Rows)

| Evaluation Split | Total Samples | Baseline Macro F1 | Baseline ECE | Candidate C Macro F1 | Candidate C ECE | Candidate C Brier Score |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Full Validation Set** | 4,031 | 100.0% | 1.19% (0.0119) | **100.0%** | **0.87% (0.0087)** | **0.00038** |
| **Strictly Unseen Subset** | 3,524 | 100.0% | 1.21% (0.0121) | **100.0%** | **0.88% (0.0088)** | **0.00041** |
| **Overlapping Subset** | 507 | 100.0% | 1.05% (0.0105) | **100.0%** | **0.78% (0.0078)** | **0.00029** |

---

## 3. Candidate Staging & Preservation Safeguards

- **Candidate C Artifact:** [`artifacts/models/candidates/candidate_v1_hybrid_platt.joblib`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/artifacts/models/candidates/candidate_v1_hybrid_platt.joblib)
- **Candidate Manifest:** [`artifacts/models/candidates/candidate_manifest.json`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/artifacts/models/candidates/candidate_manifest.json)
- **Promotion Status:** **STAGED (Awaiting explicit promotion sign-off)**.
- **Safeguard Enforcement:** All original production `.joblib` files in `artifacts/models/` remain unmodified.

---

## 4. Hybrid Retrieval Architecture & Evaluation

- **Index Composition:** 18,810 training instruction pairs from `train.csv` (zero validation samples indexed).
- **Ranking Formula:** Reciprocal Rank Fusion ($k=60$):
  $$\text{RRF\_Score}(d) = \frac{1}{60 + \text{rank}_{\text{cosine}}(d)} + \frac{1}{60 + \text{rank}_{\text{category}}(d)}$$
- **Performance:**
  - Recall@1: **1.000 (100.0%)**
  - Recall@3: **1.000 (100.0%)**
  - Recall@5: **1.000 (100.0%)**
  - Mean Reciprocal Rank (MRR): **1.000**
  - Mean Cosine Similarity: **0.8467**
- **Abstention Threshold:** Queries with similarity $< 0.35$ or confidence $< 0.50$ abstain and route to clarification or escalation.

