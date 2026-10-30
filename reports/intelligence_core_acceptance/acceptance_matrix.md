# RELAY AI — Acceptance Criteria Verification Matrix

| Acceptance Item | Description & Technical Guarantee | Implementation Reference | Verification Evidence | Status |
|---|---|---|---|---|
| **AC-01: Disagreement Detection** | Detects all 5 conflict types without relying on LLM guesses. | `app/orchestration/conflict_engine.py` | 5 unit tests in `TestAgentConflictEngine` pass. | **ACCEPTED** |
| **AC-02: Deterministic Arbitration** | Evidence and safety gates strictly overrule ungrounded agent outputs. | `ConflictResolutionEngine.detect_and_resolve()` | Critical severity assigned to safety gate contradictions. | **ACCEPTED** |
| **AC-03: Conflict Persistence** | Disagreements logged to `reports/agent_conflicts.json`. | `ConflictResolutionEngine._record_conflict()` | Verified JSON file writing & retrieval. | **ACCEPTED** |
| **AC-04: Capability Registry** | 13 capabilities cataloged with mandatory flags and prerequisites. | `app/orchestration/capability_registry.py` | Registry unit test passes; `validation` marked mandatory. | **ACCEPTED** |
| **AC-05: Dynamic Workflow Formation** | 6 workflows planned dynamically with explicit skip rationales. | `app/orchestration/workflow_planner.py` | All 6 workflow tests pass in `TestDynamicWorkflowFormation`. | **ACCEPTED** |
| **AC-06: Mandatory Gate Invariant** | No workflow or planner can bypass deterministic validation. | `app/orchestration/workflow_executor.py` | `workflow_executor_enforces_mandatory_gates` test passes. | **ACCEPTED** |
| **AC-07: Privacy Redaction** | Credit cards, emails, phones, SSNs masked prior to storage. | `KnowledgeIntelligenceService.redact_pii()` | `test_pii_redaction` passes with regex verification. | **ACCEPTED** |
| **AC-08: Gap Event Clustering** | Semantic grouping and priority scoring for unaddressed queries. | `KnowledgeIntelligenceService.cluster_unresolved_queries()` | Multi-factor priority formula verified in test. | **ACCEPTED** |
| **AC-09: Grounded FAQ Studio** | Proposes Q&A pairs grounded in verified documents; human review gate. | `KnowledgeIntelligenceService.generate_recommendations()` | `test_faq_review_workflow_and_rollback` passes. | **ACCEPTED** |
| **AC-10: Atomic Rollback** | Restores any previous snapshot without downtime or data corruption. | `KnowledgeIntelligenceService.rollback_to_version()` | Snapshot restoration verified in test suite. | **ACCEPTED** |
| **AC-11: Regression Benchmark** | Enforces zero retrieval degradation on knowledge modifications. | `KnowledgeIntelligenceService.run_retrieval_benchmark()` | Live test confirms 6/6 queries pass; mean sim: 0.302. | **ACCEPTED** |
| **AC-12: REST API Contracts** | Hardened Flask endpoints for all intelligence core capabilities. | `app/api.py` | 7 endpoints verified via live HTTP tests. | **ACCEPTED** |
| **AC-13: Frontend Visualizations** | Adaptive Workflow Visualizer, Conflict Inspector, Knowledge Center. | `LiveWorkspace.tsx`, `EvidenceLedger.tsx` | Vitest 19/19 tests pass; production build clean. | **ACCEPTED** |
| **AC-14: Model Weight Protection** | Existing `.joblib` models and `validation.csv` left 100% untouched. | Repository root | File sha256 checksums remain identical. | **ACCEPTED** |

