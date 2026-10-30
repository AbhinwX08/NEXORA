# RELAY AI — Live Operator & Evaluator Demo Scenarios

This document provides step-by-step instructions for judges, senior engineers, and operators to exercise and verify all capabilities of the RELAY AI Intelligence Core.

---

## Scenario 1: Standard In-Domain Resolution
- **Input Query:** `"I want to cancel my order #98214"`
- **Workflow Formed:** `WORKFLOW_STANDARD_SUPPORT`
- **Active Capabilities:** 10 active capabilities (`intent_analysis`, `knowledge_base_retrieval`, `slot_resolution`, `deterministic_safety_validation`, `canonical_decision_policy`, etc.)
- **Expected Outcome:** `HIGH_CONFIDENCE: PROCEED_AUTOMATED`
- **Verification Details:** Order `#98214` resolved into response template; zero unrendered placeholders; all 7 validation gates pass; conflict engine reports `conflict_detected: false`.

---

## Scenario 2: Sub-Millisecond Conversational Greeting
- **Input Query:** `"Hello, good morning!"`
- **Workflow Formed:** `WORKFLOW_GREETING`
- **Adaptive Optimization:** Skips 18,810-exemplar TF-IDF retrieval and entity extraction to achieve sub-millisecond execution (~1.8ms).
- **Mandatory Gates:** `deterministic_safety_validation` and `canonical_decision_policy` execute without exception.
- **Expected Outcome:** `RESOLVED: GREETING_COMPLETED`
- **Verification Details:** Inspect execution result: `skipped_capabilities.knowledge_base_retrieval` explicitly explains: *"Greeting input detected: skipping 18,810 exemplar TF-IDF retrieval to minimize latency without compromising safety."*

---

## Scenario 3: Parameter Mutation & Slot Conflict
- **Context Setup:** Established session memory with `order_id: "11223"`.
- **Input Query:** `"Cancel my order #99887 instead"`
- **Conflict Detected:** `SLOT_DISAGREEMENT` (High Severity)
- **Arbitration Action:** `CLARIFICATION_REQUIRED`
- **Expected Outcome:** Rather than silently overwriting the confirmed order number, system pauses and asks the customer to verify which order ID should be cancelled.
- **Verification Details:** Inspect Conflict Inspector drawer: shows side-by-side comparison between Session Memory (`11223`) and Query (`99887`).

---

## Scenario 4: Borderline Multi-Intent Ambiguity
- **Input Query:** `"Can I either cancel order or request refund?"`
- **Workflow Formed:** `WORKFLOW_AMBIGUOUS_CONFLICT`
- **Conflict Detected:** `INTENT_DISAGREEMENT` (Close margin between `cancel_order` and `refund_request`)
- **Arbitration Action:** `CLARIFICATION_REQUIRED`
- **Expected Outcome:** Disambiguation specialist formats targeted multiple-choice question: *"Are you asking to cancel order, or would you like to refund request?"*

---

## Scenario 5: Unsupported Action Claim Blocked
- **Input Query:** `"Cancel it right now"` (Missing Order Number)
- **Workflow Formed:** `WORKFLOW_CLARIFICATION_MISSING_SLOT`
- **Conflict Detected:** `EVIDENCE_VS_RESPONSE_DISAGREEMENT`
- **Arbitration Action:** `CLARIFICATION_REQUIRED`
- **Safety Enforcement:** Even if the retrieved template states *"Your order has been cancelled"*, the system rejects the affirmative verb because the order ID is unverified.

---

## Scenario 6: Explicit Human Escalation
- **Input Query:** `"I need to speak to a real human supervisor immediately"`
- **Workflow Formed:** `WORKFLOW_ESCALATION`
- **Adaptive Optimization:** Bypasses automated FAQ search; immediate triage routing.
- **Expected Outcome:** `ESCALATION_RECOMMENDED: USER_REQUESTED_ESCALATION`
- **Safety Guarantee:** Context preserved for human handoff; no false claims of immediate external actions.

---

## Scenario 7: Product Architecture & Technical Guide
- **Input Query:** `"How does Platt sigmoid calibration work in RELAY AI?"`
- **Workflow Formed:** `WORKFLOW_PRODUCT_GUIDE`
- **Corpus Queried:** Curated Product Guide Collection (`data/knowledge/product_guide.json`)
- **Expected Outcome:** `RESOLVED: PRODUCT_GUIDE_ANSWERED`
- **Response Grounding:** Truthfully cites Platt scaling formula $P(y=k|s) = 1 / (1 + \exp(As + B))$ and verified ECE metrics (1.19% baseline, 0.99% Candidate C).

---

## Scenario 8: Self-Improving Knowledge Loop Walkthrough
1. Navigate to the **Evidence Ledger** view in the sidebar.
2. Click the tab **"Knowledge Gap & FAQ Intelligence Center"**.
3. **Inspect Clusters:** View the ranked clusters (e.g. *Biometric & WebAuthn Login*, *Split Payment*, *Eco Delivery*) with priority scores $\ge 0.60$.
4. **Human Review Gate:** Find the draft recommendation in the FAQ Studio. Inspect proposed question, grounded answer, and grounding evidence.
5. Click **"Approve & Deploy"**:
   - Status changes to `DEPLOYED`.
   - A new atomic snapshot (`v_1_1_0`) appears in the Version History table.
   - The active article count increments from 7 to 8.
6. **Execute Regression Benchmark:** Click **"Execute Benchmark"**. Confirm that all 6 regression queries pass with mean similarity $\ge 0.25$ and `no_regression: true`.
7. **One-Click Rollback:** In the Version History table, click **"Restore Snapshot"** on `v_1_0_0`. Confirm knowledge base seamlessly reverts to baseline without server restart.

