# RELAY AI — Comprehensive Dataset Audit Report

**Audit Timestamp**: 2026-10-30  
**Task**: Intent Classification (27 classes) & Category Derivation (11 categories)  
**Dataset Domain**: Bitext Enterprise Customer Support Intent Corpus  

---

## 1. Executive Summary & Record Counts

| Dataset Split | Record Count | Unique Instructions | Duplicate Instruction Rows | Missing Values |
|---|---|---|---|---|
| **Training (`train.csv`)** | 18,810 | 17,514 | 2,008 | 0 (0.0%) |
| **Validation (`validation.csv`)** | 4,031 | 3,916 | 214 | 0 (0.0%) |
| **Total Combined** | 22,841 | - | - | 0 (0.0%) |

### Key Audit Verifications
- **Total Classes**: Exactly **27 intents** across both train and validation splits (no out-of-vocabulary intent labels).
- **Total Broad Categories**: Exactly **11 categories**.
- **Intent-to-Category Determinism**: **100% consistent**. Every single one of the 27 intents maps deterministically to exactly 1 category across all records.
- **Label Integrity**: 0 conflicting labels in train, 0 in validation, and 0 cross-split label discrepancies.
- **Missing Data**: Zero missing or null values in any column (`flags`, `instruction`, `category`, `intent`, `response`).

---

## 2. Train / Validation Overlap & Dual-Metric Protocol

An exact analysis was conducted on identical query strings between `train.csv` and `validation.csv`:

- **Distinct overlapping query strings**: **368** unique instructions appear in both training and validation.
- **Validation rows with training-seen text**: **459 rows** (11.39% of validation).
- **Validation rows with completely unseen text**: **3572 rows** (88.61% of validation).
- **Label Discrepancies on Overlapping Queries**: **0 conflicts**. When identical instructions occur in both sets, their intent labels match 100% identically.

> [!IMPORTANT]
> **Evaluation Protocol Requirement**:
> To guarantee complete scientific rigor and verify that the model does not merely memorize exact train strings, all evaluation metrics must be reported across **both**:
> 1. **Complete Validation Set**: All 4,031 rows.
> 2. **Unseen Validation Subset**: Only the 3,572 rows whose exact instruction string was never present in training.

---

## 3. Intent Label Distribution (27 Classes)

The dataset exhibits exceptionally balanced intent class distribution (~3.5% to 3.7% per class):

| Intent Label | Mapped Category | Train Count | Train % | Val Count | Val % | Total Count |
|---|---|---|---|---|---|---|
| `cancel_order` | **ORDER** | 699 | 3.72% | 150 | 3.72% | 849 |
| `change_order` | **ORDER** | 698 | 3.71% | 149 | 3.70% | 847 |
| `change_shipping_address` | **SHIPPING** | 681 | 3.62% | 146 | 3.62% | 827 |
| `check_cancellation_fee` | **CANCEL** | 665 | 3.54% | 143 | 3.55% | 808 |
| `check_invoice` | **INVOICE** | 700 | 3.72% | 150 | 3.72% | 850 |
| `check_payment_methods` | **PAYMENT** | 699 | 3.72% | 150 | 3.72% | 849 |
| `check_refund_policy` | **REFUND** | 698 | 3.71% | 149 | 3.70% | 847 |
| `complaint` | **FEEDBACK** | 700 | 3.72% | 150 | 3.72% | 850 |
| `contact_customer_service` | **CONTACT** | 700 | 3.72% | 150 | 3.72% | 850 |
| `contact_human_agent` | **CONTACT** | 699 | 3.72% | 150 | 3.72% | 849 |
| `create_account` | **ACCOUNT** | 698 | 3.71% | 149 | 3.70% | 847 |
| `delete_account` | **ACCOUNT** | 696 | 3.70% | 150 | 3.72% | 846 |
| `delivery_options` | **DELIVERY** | 697 | 3.71% | 149 | 3.70% | 846 |
| `delivery_period` | **DELIVERY** | 699 | 3.72% | 150 | 3.72% | 849 |
| `edit_account` | **ACCOUNT** | 700 | 3.72% | 150 | 3.72% | 850 |
| `get_invoice` | **INVOICE** | 699 | 3.72% | 150 | 3.72% | 849 |
| `get_refund` | **REFUND** | 698 | 3.71% | 149 | 3.70% | 847 |
| `newsletter_subscription` | **SUBSCRIPTION** | 699 | 3.72% | 150 | 3.72% | 849 |
| `payment_issue` | **PAYMENT** | 699 | 3.72% | 150 | 3.72% | 849 |
| `place_order` | **ORDER** | 699 | 3.72% | 149 | 3.70% | 848 |
| `recover_password` | **ACCOUNT** | 696 | 3.70% | 150 | 3.72% | 846 |
| `registration_problems` | **ACCOUNT** | 699 | 3.72% | 150 | 3.72% | 849 |
| `review` | **FEEDBACK** | 698 | 3.71% | 150 | 3.72% | 848 |
| `set_up_shipping_address` | **SHIPPING** | 698 | 3.71% | 150 | 3.72% | 848 |
| `switch_account` | **ACCOUNT** | 700 | 3.72% | 150 | 3.72% | 850 |
| `track_order` | **ORDER** | 697 | 3.71% | 149 | 3.70% | 846 |
| `track_refund` | **REFUND** | 699 | 3.72% | 149 | 3.70% | 848 |

- **Majority Classes (Train)**: `edit_account`, `switch_account`, `check_invoice`, `complaint`, `contact_customer_service` (700 rows each, 3.72%).
- **Minority Classes (Train)**: `check_cancellation_fee` (665 rows, 3.54%), `change_shipping_address` (681 rows, 3.62%).
- **Imbalance Ratio**: Maximum ratio between most frequent and least frequent class is only **1.05:1**, indicating an exceptionally balanced dataset where standard class weighting (`class_weight=None`) should perform reliably alongside balanced mode.

---

## 4. Category Label Distribution & Intent Mapping (11 Categories)

The 11 categories represent broad functional domains aggregating 1 to 6 intents each:

| Category | Associated Intents Count | Train Count | Train % | Val Count | Val % | Key Intents Covered |
|---|---|---|---|---|---|---|
| **ACCOUNT** | 6 | 4,189 | 22.27% | 899 | 22.30% | `create_account, delete_account, edit_account`... |
| **CANCEL** | 1 | 665 | 3.54% | 143 | 3.55% | `check_cancellation_fee` |
| **CONTACT** | 2 | 1,399 | 7.44% | 300 | 7.44% | `contact_customer_service, contact_human_agent` |
| **DELIVERY** | 2 | 1,396 | 7.42% | 299 | 7.42% | `delivery_options, delivery_period` |
| **FEEDBACK** | 2 | 1,398 | 7.43% | 300 | 7.44% | `complaint, review` |
| **INVOICE** | 2 | 1,399 | 7.44% | 300 | 7.44% | `check_invoice, get_invoice` |
| **ORDER** | 4 | 2,793 | 14.85% | 597 | 14.81% | `cancel_order, change_order, place_order`... |
| **PAYMENT** | 2 | 1,398 | 7.43% | 300 | 7.44% | `check_payment_methods, payment_issue` |
| **REFUND** | 3 | 2,095 | 11.14% | 447 | 11.09% | `check_refund_policy, get_refund, track_refund` |
| **SHIPPING** | 2 | 1,379 | 7.33% | 296 | 7.34% | `change_shipping_address, set_up_shipping_address` |
| **SUBSCRIPTION** | 1 | 699 | 3.72% | 150 | 3.72% | `newsletter_subscription` |

### Intent-to-Category Determinism Table

| Intent Class | Deterministic Category |
|---|---|
| `cancel_order` | **ORDER** |
| `change_order` | **ORDER** |
| `change_shipping_address` | **SHIPPING** |
| `check_cancellation_fee` | **CANCEL** |
| `check_invoice` | **INVOICE** |
| `check_payment_methods` | **PAYMENT** |
| `check_refund_policy` | **REFUND** |
| `complaint` | **FEEDBACK** |
| `contact_customer_service` | **CONTACT** |
| `contact_human_agent` | **CONTACT** |
| `create_account` | **ACCOUNT** |
| `delete_account` | **ACCOUNT** |
| `delivery_options` | **DELIVERY** |
| `delivery_period` | **DELIVERY** |
| `edit_account` | **ACCOUNT** |
| `get_invoice` | **INVOICE** |
| `get_refund` | **REFUND** |
| `newsletter_subscription` | **SUBSCRIPTION** |
| `payment_issue` | **PAYMENT** |
| `place_order` | **ORDER** |
| `recover_password` | **ACCOUNT** |
| `registration_problems` | **ACCOUNT** |
| `review` | **FEEDBACK** |
| `set_up_shipping_address` | **SHIPPING** |
| `switch_account` | **ACCOUNT** |
| `track_order` | **ORDER** |
| `track_refund` | **REFUND** |

> **System Architectural Implication**: Because intent-to-category mapping is 100% bijective from intent to category, our RELAY AI system should predict the fine-grained `intent` directly from `instruction`, and determine `category` deterministically via dictionary lookup, avoiding error propagation from a separate category model.

---

## 5. Query Length & Structural Characteristics

Customer instructions are short-to-medium conversational utterances:

| Metric | Train Words | Train Characters | Val Words | Val Characters |
|---|---|---|---|---|
| **Minimum** | 1 | 8 | 1 | 6 |
| **25th Percentile** | 7.0 | 40.0 | 7.0 | 39.0 |
| **Median** | 9.0 | 48.0 | 9.0 | 48.0 |
| **Mean** | 8.70 | 46.93 | 8.62 | 46.53 |
| **75th Percentile** | 11.0 | 55.0 | 10.0 | 55.0 |
| **95th Percentile** | 13.0 | 61.0 | 13.0 | 60.0 |
| **Maximum** | 16 | 92 | 16 | 92 |

---

## 6. Linguistic Variations, Orthographic Noise & Entity Tokens

### Flag Distribution in Training Data
| Flag | Name | Occurrences in Train | % of Train | Description |
|---|---|---|---|---|
| `B` | Base utterance | 18,810 | 100.0% | Canonical user query form |
| `L` | Lexical variation | 16,866 | 89.7% | Synonym substitutions & alternative rephrasings |
| `Q` | Question syntax | 6,258 | 33.3% | Inverted question sentence structures |
| `I` | Interrogative token | 5,435 | 28.9% | Questions starting with wh-words (how, where, what) |
| `Z` | Orthographic noise | 3,689 | 19.6% | Spelling typos, omitted letters, character noise |
| `M` | Misspelling / typo | 3,467 | 18.4% | Common word misspellings (e.g. 'temrination', 'acount') |
| `C` | Complex / compound | 1,876 | 10.0% | Multi-clause sentences with conjunctions |
| `K` | Keyword-dense | 1,548 | 8.2% | Concise telegram-style queries |
| `E` | Expressive / emotional | 1,352 | 7.2% | Polite or emotional language nuances |
| `P` | Polite phrasing | 913 | 4.9% | Courteous requests ('would it be possible', 'could you please') |
| `W` | Offensive / profanity | 912 | 4.8% | Vulgarity/swear words ('damn', 'bloody', 'fucking') |
| `N` | Negation marker | 324 | 1.7% | Explicit negation words ('cannot', 'cant', 'no longer', 'not') |
| `S` | Stylistic / colloquial | 291 | 1.5% | Informal tokens, slang ('ya', 'wanna') |
| `V` | Variant / other | 52 | 0.3% | Other syntactic variants |

### Orthographic Typos & Noise Analysis (Flags `M` & `Z`)
- Over **7,156** utterances contain deliberate typos, phonetic misspellings, or missing characters.
Examples from dataset:
- *"where can I see the temrination fees?"*
- *"I have  to notify of problems with a registration"*
- *"I have got to obtain reimbursements of money"*
- *"assistance checking the withdrawal penalties"*
- *"question about cancellung purchase {{Order Number}}"*
- *"refunding {{Currency Symbol}}{{Refund Amount}}"*
- *"how can I contact cusomer support?"*
- *"change to {{Account Category}} acount"*

> **Modeling Implication**: Word-only tokenizers fail on unseen typos (e.g. `temrination`, `acount`, `erors`). **Character n-grams (`char_wb`, range 3-5)** are essential to provide subword robustness against spelling mistakes.

### Vulgarity & Emotional Profanity (Flag `W`)
- **912** utterances (4.8% of training) contain frustrated profanity (`damn`, `bloody`, `fucking`).
Examples:
- *"I want to cancel a damn {{Account Type}} account, I need help"*
- *"can I sign up to the damn newsletter?"*
- *"could I swap a bloody item of purchase {{Order Number}}?"*
- *"I'm trying to get my damn bills from {{Person Name}}"*
- *"help me to report damn sign-up erors"*
- *"I want to see how soon can I expect my damn order, help me"*

> **Modeling Implication**: Profanities are noise tokens that must not be misinterpreted as distinct intents. Sublinear TF scaling helps suppress extreme term frequency distortions.

### Negation Queries (Flag `N`)
- **324** utterances contain explicit negation words (`cannot`, `cant`, `no longer`, `not`, `don't`).
Examples:
- *"I can no longer afford purchase {{Order Number}}"*
- *"I can't see if there is anything new on the refund"*
- *"i cant report sign-up problems"*
- *"I can't afford my last item, cancel purchase {{Order Number}}"*
- *"I can't reset my user PIN"*
- *"I cannot create a user, help informing of a signup problem"*

> **Modeling Implication**: Negation often completely flips intent semantics (e.g., *"I can no longer afford purchase {{Order Number}}"* -> `cancel_order`). Preprocessing must never strip negation tokens as standard stopword lists do.

### Entity Placeholders Detected
The following 9 entity template tags are used in customer instructions:
- `{{Account Category}}`
- `{{Account Type}}`
- `{{Currency Symbol}}`
- `{{Delivery City}}`
- `{{Delivery Country}}`
- `{{Invoice Number}}`
- `{{Order Number}}`
- `{{Person Name}}`
- `{{Refund Amount}}`

> **Modeling Implication**: Entity placeholders provide strong semantic signals. For example, `{{Invoice Number}}` or `{{Person Name}}` strongly cues invoice intents (`check_invoice` vs `get_invoice`), whereas `{{Order Number}}` cues order intents (`cancel_order`, `change_order`, `track_order`). Tokenizers should preserve entity markers.

---

## 7. Recommended Preprocessing & Modeling Strategy

Based on the rigorous audit findings:
1. **Unicode & Whitespace**: Normalize with NFKC and standard regex whitespace collapsing.
2. **Casing**: Lowercase all text consistently.
3. **Contractions & Negation**: Expand `can't` -> `cannot`, `won't` -> `will not`, `don't` -> `do not` to preserve negation semantics.
4. **No Stopword Stripping**: Maintain stopword integrity so intent-critical verbs and question words (`how`, `when`, `where`, `can`, `cancel`, `change`) remain intact.
5. **Subword Robustness**: Combine Word TF-IDF (n-grams 1-2) with Character n-grams (`char_wb` 3-5) to achieve 100% resilience against typos, slang, and inflectional variants.
6. **Classifier**: Linear SVM and Logistic Regression with L2 regularization provide strong margin separation across the 27 linearly separable intent clusters.
