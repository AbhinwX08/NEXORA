# RELAY AI — Demo Readiness & Operator Guide (Part 4)

## 1. System Readiness Checklist

- **Flask Backend API**: Running on `http://127.0.0.1:8000` (PID active, 0 startup errors).
- **Vite React Frontend**: Running on `http://localhost:3000` (Production bundle compiled).
- **Backend Test Suite**: 75/75 tests passing (0 failures, 0 errors).
- **Frontend Vitest Suite**: 19/19 tests passing (0 failures, 0 errors).
- **Corpus & Model Integrity**: Production `.joblib` models and `validation.csv` strictly preserved.

---

## 2. Interactive Operator Walkthrough

### Step 1: Launch Workspace & Observe Dynamic Workflow Formation
1. Open `http://localhost:3000` in the browser.
2. Select preset **"Greeting Query"** or enter `"Good morning!"`.
3. Click **"Execute Query"**.
4. Observe the **Adaptive Workflow Visualizer** card:
   - Workflow Badge: `WORKFLOW_GREETING`
   - Latency: ~1.8 ms (vs. 11.4 ms for standard queries).
   - Planned Capabilities: 5 active safety gates.
   - Bypassed Capabilities: Expand to view the rationale: *"Greeting input detected: skipping 18,810 exemplar TF-IDF retrieval to minimize latency without compromising safety."*

### Step 2: Trigger and Inspect an Agent Conflict
1. In the query console, enter an inquiry with conflicting session parameters:
   - Provide query: `"Cancel order #99887"`
   - Open parameters and set `Order Number = 11223`.
2. Click **"Execute Query"**.
3. Observe the **Conflict Resolution Alert** card:
   - Badge: `SLOT_DISAGREEMENT` (High Severity).
   - Description: Conflicting value for parameter `order_id` (stored `11223` vs query `99887`).
   - Resolution Action: `CLARIFICATION_REQUIRED` (system prompts customer for confirmation rather than silently overwriting).
4. Click **"Conflict Inspector"** in the top action controls to view past disagreements in the system audit log.

### Step 3: Self-Improving Knowledge Gap & FAQ Review Studio
1. In the sidebar, click **"Evidence Ledger"**.
2. Click the tab **"Knowledge Gap & FAQ Intelligence Center"**.
3. View **Clustered Knowledge Deficits**: Note priority scores (e.g. *Biometric Login* scored 0.885).
4. View **FAQ Recommendation Studio**: Inspect candidate Q&A draft grounded in verified category rules.
5. Click **"Approve & Deploy"**:
   - Status updates to `DEPLOYED`.
   - New version snapshot `v_1_1_0` appears in the Version History table.
6. Click **"Execute Benchmark"**: Confirm that all 6 regression queries pass with zero drift.
7. Click **"Restore Snapshot"** on `v_1_0_0` to test atomic rollback back to baseline.

