# RELAY AI — Advanced Classifier Optimization Report (Phase 2)

**Optimization Date**: 2026-10-30 17:07:15  
**Model Version**: `2.0.0-optimized`  
**Selected Best Pipeline**: `Combined_w1_c15`  
**Target Objective**: Intent Accuracy > 70.0%  
**Outcome**: **SUCCESS (TARGET ACHIEVED)**  

---

## 1. Executive Summary & Verification of Primary Target

> [!IMPORTANT]
> **Primary Success Target Achieved**: The frozen optimized classifier achieved **100.00%** overall intent accuracy on `validation.csv`, exceeding the 70.0% requirement by **+30.00 percentage points**.

| Evaluation Cohort | Record Count | Intent Accuracy | Macro-F1 | Weighted-F1 | Top-3 Accuracy |
|---|---|---|---|---|---|
| **All Validation Records** | 4,031 | **100.00%** | **100.00%** | **100.00%** | **100.00%** |
| **Exact-Unseen Instructions** | 3,572 | **100.00%** | **100.00%** | **100.00%** | **100.00%** |

---

## 2. Cross-Validation Leaderboard & Hyperparameter Exploration

All hyperparameter searches and architectural decisions were tuned strictly on `train.csv` (18,810 records) via 5-Fold Stratified Cross-Validation without touching `validation.csv`:

| Rank | Experiment Identifier | CV Accuracy | CV Macro-F1 | CV Weighted-F1 | CV Run Time |
|---|---|---|---|---|---|
| 1 | `Combined_w1_c15` | 99.88% ± 0.03% | **99.88%** ± 0.03% | 99.88% | 4.0s |
| 2 | `LinearSVC_C15` | 99.87% ± 0.03% | **99.87%** ± 0.03% | 99.87% | 3.5s |
| 3 | `Combined_C15` | 99.87% ± 0.03% | **99.87%** ± 0.03% | 99.87% | 4.1s |
| 4 | `Combined_w05_c1` | 99.87% ± 0.05% | **99.87%** ± 0.05% | 99.87% | 3.8s |
| 5 | `Char_2to5` | 99.86% ± 0.02% | **99.86%** ± 0.02% | 99.86% | 5.4s |
| 6 | `Combined_w1_c1` | 99.86% ± 0.04% | **99.86%** ± 0.04% | 99.86% | 3.9s |
| 7 | `Char_3to5` | 99.85% ± 0.03% | **99.85%** ± 0.03% | 99.85% | 4.4s |
| 8 | `LinearSVC_balanced` | 99.85% ± 0.03% | **99.85%** ± 0.03% | 99.85% | 3.3s |
| 9 | `SGD_modified_huber` | 99.84% ± 0.07% | **99.84%** ± 0.07% | 99.84% | 2.3s |
| 10 | `Char_3to6` | 99.84% ± 0.03% | **99.84%** ± 0.03% | 99.84% | 3.4s |
| 11 | `LinearSVC_C05` | 99.84% ± 0.02% | **99.84%** ± 0.02% | 99.84% | 3.2s |
| 12 | `Combined_w15_c1` | 99.82% ± 0.05% | **99.82%** ± 0.05% | 99.82% | 4.3s |
| 13 | `LogisticRegression_C5` | 99.80% ± 0.03% | **99.80%** ± 0.03% | 99.80% | 5.6s |
| 14 | `Word_bigram` | 99.39% ± 0.07% | **99.40%** ± 0.07% | 99.39% | 2.9s |
| 15 | `Word_unigram` | 99.38% ± 0.07% | **99.38%** ± 0.07% | 99.38% | 3.8s |
| 16 | `Word_trigram` | 99.34% ± 0.07% | **99.34%** ± 0.07% | 99.34% | 2.8s |
| 17 | `Word_min_df2` | 99.31% ± 0.09% | **99.32%** ± 0.09% | 99.31% | 1.4s |

### Architectural & Feature Insights
1. **Word vs Character TF-IDF Contribution**:
   - Word-only representations (`Word_bigram`: 99.39% CV F1) perform well on standard vocabulary, but suffer when encountering typos (e.g. `temrination`, `erors`).
   - Character n-grams (`Char_3to5`: 99.86% CV F1) capture subword morphological roots, entity structure, and typo noise with extraordinary robustness.
   - **Combined Word + Character TF-IDF** with sublinear TF scaling yields the highest performance, effectively capturing semantic phrases and resilient subword patterns simultaneously.
2. **Classifier & Regularization Tuning**:
   - `LinearSVC` with L2 penalty and $C=1.0$ or $C=1.5$ establishes a clean, high-margin hyperplane separation across all 27 intent boundaries.
   - `class_weight='balanced'` was compared against `class_weight=None`. Due to the dataset's balanced class distribution (imbalance ratio 1.05:1), unweighted and balanced weights performed equivalently, with unweighted having slightly lower variance.
   - `LogisticRegression(C=5.0)` and `SGDClassifier(loss='modified_huber')` achieved strong results (>99.0%), but LinearSVC consistently maintained higher margins on short queries.

---

## 3. Best Model Architecture Details

- **Model Identifier**: `Combined_w1_c15`
- **Preprocessing Step**: `TextPreprocessor(normalize_unicode=True, lowercase=True, expand_contractions=True, preserve_negations=True)`
- **Feature Representation**:
  - Word-level TF-IDF: `ngram_range=(1, 2)`, `sublinear_tf=True`
  - Character-level TF-IDF: `analyzer='char_wb'`, `ngram_range=(3, 5)`, `sublinear_tf=True`
  - Feature weighting: balanced union
- **Estimator**: `LinearSVC(C=1.0, dual='auto', random_state=42)`
- **Model Storage**: `artifacts/models/intent_classifier.joblib`

---

## 4. Per-Intent Performance Analysis (27 Classes)

| Intent | Category | Precision | Recall | F1-Score | Validation Support |
|---|---|---|---|---|---|
| `cancel_order` | **ORDER** | 100.0% | 100.0% | 100.0% | 150 |
| `change_order` | **ORDER** | 100.0% | 100.0% | 100.0% | 149 |
| `change_shipping_address` | **SHIPPING** | 100.0% | 100.0% | 100.0% | 146 |
| `check_cancellation_fee` | **CANCEL** | 100.0% | 100.0% | 100.0% | 143 |
| `check_invoice` | **INVOICE** | 100.0% | 100.0% | 100.0% | 150 |
| `check_payment_methods` | **PAYMENT** | 100.0% | 100.0% | 100.0% | 150 |
| `check_refund_policy` | **REFUND** | 100.0% | 100.0% | 100.0% | 149 |
| `complaint` | **FEEDBACK** | 100.0% | 100.0% | 100.0% | 150 |
| `contact_customer_service` | **CONTACT** | 100.0% | 100.0% | 100.0% | 150 |
| `contact_human_agent` | **CONTACT** | 100.0% | 100.0% | 100.0% | 150 |
| `create_account` | **ACCOUNT** | 100.0% | 100.0% | 100.0% | 149 |
| `delete_account` | **ACCOUNT** | 100.0% | 100.0% | 100.0% | 150 |
| `delivery_options` | **DELIVERY** | 100.0% | 100.0% | 100.0% | 149 |
| `delivery_period` | **DELIVERY** | 100.0% | 100.0% | 100.0% | 150 |
| `edit_account` | **ACCOUNT** | 100.0% | 100.0% | 100.0% | 150 |
| `get_invoice` | **INVOICE** | 100.0% | 100.0% | 100.0% | 150 |
| `get_refund` | **REFUND** | 100.0% | 100.0% | 100.0% | 149 |
| `newsletter_subscription` | **SUBSCRIPTION** | 100.0% | 100.0% | 100.0% | 150 |
| `payment_issue` | **PAYMENT** | 100.0% | 100.0% | 100.0% | 150 |
| `place_order` | **ORDER** | 100.0% | 100.0% | 100.0% | 149 |
| `recover_password` | **ACCOUNT** | 100.0% | 100.0% | 100.0% | 150 |
| `registration_problems` | **ACCOUNT** | 100.0% | 100.0% | 100.0% | 150 |
| `review` | **FEEDBACK** | 100.0% | 100.0% | 100.0% | 150 |
| `set_up_shipping_address` | **SHIPPING** | 100.0% | 100.0% | 100.0% | 150 |
| `switch_account` | **ACCOUNT** | 100.0% | 100.0% | 100.0% | 150 |
| `track_order` | **ORDER** | 100.0% | 100.0% | 100.0% | 149 |
| `track_refund` | **REFUND** | 100.0% | 100.0% | 100.0% | 149 |

---

## 5. Comparative Error & Misclassification Analysis

### Comparison of Error Profiles Across Model Families on Validation Data

| Model Architecture | Features | Errors on All Validation (4,031) | Errors on Unseen Validation (3,572) | Accuracy | Macro-F1 |
|---|---|---|---|---|---|
| **E_ComplementNB** | Word TF-IDF (1,2) | 73 errors | 70 errors | 98.19% | 98.19% |
| **A_Word_LogReg** | Word TF-IDF (1,2) | 26 errors | 24 errors | 99.35% | 99.36% |
| **B_Word_LinearSVC** | Word TF-IDF (1,2) | 15 errors | 15 errors | 99.63% | 99.63% |
| **C_Char_LinearSVC** | Char TF-IDF `char_wb` (3,5) | 1 error | 1 error | 99.98% | 99.98% |
| **Combined_w1_c15 (Optimized)** | **Word (1,2) + Char (3,5)** | **0 errors** | **0 errors** | **100.00%** | **100.00%** |

### Failure Modes of Word-Only Models (Why Word TF-IDF Failed on 15 Queries)
Inspection of the 15 queries misclassified by `B_Word_LinearSVC` highlights three distinct linguistic vulnerabilities:
1. **Misspelled Key Verbs & Nouns (Flags M & Z)**:
   - *"i do not know how i could casncel order {{Order Number}}"* -> Typo `casncel` caused word tokenizer to drop the verb, misclassifying as `change_order`.
   - *"need assistance reporting an issue with pyments"* -> Typo `pyments` dropped, misclassifying as `registration_problems`.
   - *"I can't aford order {{Order Number}}"* -> Typo `aford` dropped, misclassifying as `change_order`.
   - *"need to speak to customere assistance"* -> Typo `customere` dropped, confusing `contact_customer_service` with `contact_human_agent`.
   - *"could ya help me locae purchase {{Order Number}}"* -> Typo `locae` dropped, misclassifying as `change_order`.
2. **Missing Whitespace / Run-Together Words**:
   - *"what do i have to do to createa premium account"* -> Concatenated `createa` (`create a`), missing the critical creation verb and defaulting to `delete_account`.
   - *"order anitem"* -> Concatenated `anitem` (`an item`), confusing `place_order` with `track_order`.
   - *"modify order00004587345"* -> Missing space between `order` and ID, confusing `change_order` with `edit_account`.
3. **Truncated Forms**:
   - *"I don't know what I need to do to downloa the invoice #00108"* -> Truncated `downloa` missed `get_invoice`, confusing it with `check_invoice`.

### The Single Vulnerability of Char-Only Models
In `C_Char_LinearSVC`, only 1 sample out of 4,031 failed:
- Query: *"cancel purchase113542617735902"* (True: `cancel_order` | Pred: `change_order`)
- Cause: The absence of whitespace between `purchase` and the numeric ID blurred the token boundaries; character n-grams alone had slight tie-breaking ambiguity towards `change_order`.

### How the Optimized Combined Model Achieved Zero Errors (100.00%)
The optimized `Combined_w1_c15` architecture fuses:
- **Word TF-IDF (`ngram_range=(1,2)`)** to anchor salient whole-word intents (e.g. `cancel`, `place`, `invoice`, `address`).
- **Character n-grams (`analyzer='char_wb'`, `ngram_range=(3,5)`, weight 1.5)** to resolve subword typos (`casncel`, `aford`, `pyments`, `downloa`) and run-together tokens (`createa`, `anitem`).
- **LinearSVC with $C=1.0$ and L2 penalty** to build maximal-margin hyperplanes across all 27 intent classes.

This combination fully resolved every edge case, achieving **0 misclassifications across the entire validation dataset (100.00% accuracy and 100.00% Macro-F1)**.
`reports/misclassified_examples.csv` has been saved with the required column schema for auditing.

---

## 6. Category Derivation Verification

Because the dataset exhibits a 100% deterministic 1:1 mapping from each of the 27 intents to its parent category:
- Predicted category is derived via: `category = intent_to_category_mapping[predicted_intent]`.
- Derived Category Accuracy on Validation: **100.00%**.
