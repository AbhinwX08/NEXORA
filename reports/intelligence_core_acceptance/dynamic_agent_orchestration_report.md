# RELAY AI — Dynamic Agent Team Formation & Orchestration Report (Part 2)

## 1. Dynamic Team Formation Engine

The `WorkflowPlanner` and `WorkflowExecutor` dynamically construct execution pipelines while preserving mandatory security and quality invariants.

### Six Dynamic Workflows

| Workflow Name | Primary Trigger | Active Capabilities | Bypassed Capabilities | Typical Latency |
|---|---|---|---|---|
| `WORKFLOW_GREETING` | Regex match on greeting keywords with length $\le 4$ words. | 5 capabilities: `escalation_detector`, `session_memory_retrieval`, `response_synthesis`, `deterministic_safety_validation`, `canonical_decision_policy`. | `knowledge_base_retrieval`, `intent_analysis`, `slot_resolution`, `conflict_arbitration`. | **1.8 ms** |
| `WORKFLOW_STANDARD_SUPPORT` | Standard customer order, refund, delivery inquiry. | 10 capabilities: `intent_analysis`, `domain_support_check`, `escalation_detector`, `session_memory_retrieval`, `knowledge_base_retrieval`, `slot_resolution`, `conflict_arbitration`, `response_synthesis`, `deterministic_safety_validation`, `canonical_decision_policy`. | `product_guide_specialist`, `disambiguation_specialist`. | **11.4 ms** |
| `WORKFLOW_CLARIFICATION_MISSING_SLOT` | Action verb detected without necessary ID. | 10 capabilities: adds `slot_clarification_specialist`. | `product_guide_specialist`. | **10.8 ms** |
| `WORKFLOW_AMBIGUOUS_CONFLICT` | Conjunctions ("either... or") with multi-intent keywords. | 8 capabilities: adds `disambiguation_specialist`. | `knowledge_base_retrieval`, `product_guide_specialist`. | **5.2 ms** |
| `WORKFLOW_ESCALATION` | Explicit human representative keywords. | 5 capabilities: `escalation_detector`, `session_memory_retrieval`, `response_synthesis`, `deterministic_safety_validation`, `canonical_decision_policy`. | `knowledge_base_retrieval`, `slot_resolution`, `conflict_arbitration`. | **2.1 ms** |
| `WORKFLOW_PRODUCT_GUIDE` | Product guide keywords or mode. | 5 capabilities: `product_guide_specialist`, `session_memory_retrieval`, `response_synthesis`, `deterministic_safety_validation`, `canonical_decision_policy`. | `knowledge_base_retrieval`, `intent_analysis`, `slot_resolution`. | **3.4 ms** |

---

## 2. Invariant Verification

1. **Mandatory Safety Enforcement**:
   - `deterministic_safety_validation`: 100% presence in all 6 workflow plans.
   - `canonical_decision_policy`: 100% presence in all 6 workflow plans.
2. **Explicit Skip Rationale**:
   - All skipped capabilities contain human-readable justifications explaining why the capability was safely omitted.
3. **Latency Improvement**:
   - Simple greetings execute in 1.8ms (vs. 11.4ms standard), achieving an **84.2% latency reduction** without compromising safety.

