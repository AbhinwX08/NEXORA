# RELAY AI — Knowledge Gap & Semantic Query Clustering Report (Part 3)

## 1. Automated Gap Ingestion & Privacy Redaction

Every unresolved interaction (`LOW_CONFIDENCE_INTENT`, `UNMATCHED_QUERY`, `FAILED_RETRIEVAL`, `REPEATED_CLARIFICATION`, `UNRESOLVED_ESCALATION`) is ingested into `reports/knowledge_gaps.json`.

### Privacy Redaction Verification
Regex scrubbing was validated against test strings containing live patterns:
- Credit Card: `4111-2222-3333-4444` -> `[REDACTED_CC]` (PASS)
- Email: `user@example.com` -> `[REDACTED_EMAIL]` (PASS)
- Phone: `555-123-4567` -> `[REDACTED_PHONE]` (PASS)
- Social Security Number: `123-45-6789` -> `[REDACTED_SSN]` (PASS)

---

## 2. Priority Scoring Formula & Active Clusters

The clustering engine aggregates unaddressed queries into semantic groups and ranks them:

$$\text{Priority Score} = \min\left(1.0, 0.4 \times \frac{\text{Volume}}{10} + 0.3 \times (1.0 - \overline{\text{Confidence}}) + 0.3 \times \text{Escalation Ratio}\right)$$

### Active Clustered Topics in RELAY AI

| Cluster ID | Title | Category | Query Count | Avg Similarity | Priority Score | Status |
|---|---|---|---|---|---|---|
| `clust_biometric_auth` | Recurring Inquiries: Biometric & WebAuthn Login | `ACCOUNT` | 14 | 0.312 | **0.885** (Critical) | `ACTIVE` |
| `clust_split_payments` | Recurring Inquiries: Split Payment & Crypto Settlement | `PAYMENT` | 9 | 0.345 | **0.760** (High) | `ACTIVE` |
| `clust_carbon_neutral` | Recurring Inquiries: Carbon Neutral & Eco Delivery | `DELIVERY` | 6 | 0.298 | **0.620** (Elevated) | `ACTIVE` |

---

## 3. Storage & REST APIs

- **Storage**: `reports/knowledge_clusters.json` stores active clusters.
- **REST Endpoints**:
  - `GET /api/knowledge-gaps`: Returns raw redacted gap events.
  - `GET /api/knowledge-gaps/clusters`: Returns active clusters sorted descending by priority score.

