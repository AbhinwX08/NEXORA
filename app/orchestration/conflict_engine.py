"""
RELAY AI — Agent Disagreement & Evidence-Based Conflict Resolution Engine (Part 1)
Identifies contradictory, incompatible, or unsupported agent outputs and arbitrates
resolutions deterministically without majority voting or unvalidated LLM overrides.
"""

import os
import re
import time
import uuid
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from app.schemas.conflict_models import (
    ConflictType,
    ConflictSeverity,
    ResolutionAction,
    ConflictResolutionStatus,
    AgentDisagreementRecord,
)

logger = logging.getLogger("relay.conflict_engine")

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONFLICT_LOG_PATH = os.path.join(_PROJECT_ROOT, "reports/agent_conflicts.json")


class ConflictResolutionEngine:
    """
    Subsystem for detecting incompatible agent conclusions, classifying conflict severity,
    and applying deterministic evidence-based resolution rules.
    """

    def __init__(self, log_path: Optional[str] = None):
        self.log_path = log_path or CONFLICT_LOG_PATH
        os.makedirs(os.path.dirname(self.log_path), exist_ok=True)
        self._max_retries = 1

    def detect_and_resolve(
        self,
        trace_id: str,
        query: str,
        a1_output: Optional[Dict[str, Any]],
        a2_output: Optional[Dict[str, Any]],
        validation_output: Optional[Dict[str, Any]],
        session_slots: Optional[Dict[str, str]] = None,
        conversation_id: Optional[str] = None,
        allow_retry: bool = True
    ) -> Optional[AgentDisagreementRecord]:
        """
        Examines outputs from A1 (Intent), A2 (Retrieval/Slots), and ValidationAgent.
        Returns AgentDisagreementRecord if conflict exists, else None.
        """
        conflicts_found: List[AgentDisagreementRecord] = []

        # ---------------------------------------------------------------------
        # 1. SLOT DISAGREEMENT CHECK
        # Compares new user input slots with established session memory
        # ---------------------------------------------------------------------
        if session_slots and a2_output and "resolved_slots" in a2_output:
            new_slots = a2_output["resolved_slots"]
            for slot_key, new_val in new_slots.items():
                if slot_key in session_slots and session_slots[slot_key] != new_val:
                    cid = f"conf_{uuid.uuid4().hex[:8]}"
                    conf = AgentDisagreementRecord(
                        conflict_id=cid,
                        trace_id=trace_id,
                        conversation_id=conversation_id,
                        conflict_type=ConflictType.SLOT_DISAGREEMENT,
                        severity=ConflictSeverity.HIGH,
                        affected_agents=["SessionMemory", "A2_ResponseSpecialist"],
                        agent_outputs={
                            "SessionMemory": {slot_key: session_slots[slot_key]},
                            "A2_ResponseSpecialist": {slot_key: new_val}
                        },
                        evidence_references=[
                            {"source_type": "session_memory", "key": slot_key, "stored_value": session_slots[slot_key]},
                            {"source_type": "current_query", "key": slot_key, "extracted_value": new_val}
                        ],
                        description=f"Conflicting value for parameter '{slot_key}': stored '{session_slots[slot_key]}' vs current '{new_val}'.",
                        reason_codes=["SLOT_VALUE_MUTATION_WITHOUT_CONFIRMATION"],
                        resolution_status=ConflictResolutionStatus.RESOLVED,
                        resolution_action=ResolutionAction.CLARIFICATION_REQUIRED,
                        resolution_explanation=(
                            f"Identified parameter conflict on '{slot_key}'. Rather than silently overwriting the confirmed "
                            f"identifier, the system asks the customer to confirm which identifier should be used."
                        ),
                        retry_count=0,
                        final_decision="CLARIFICATION_REQUIRED: PARAMETER_MISMATCH"
                    )
                    conflicts_found.append(conf)

        # ---------------------------------------------------------------------
        # 2. INTENT DISAGREEMENT CHECK
        # Compares primary intent with strong competing alternative intent
        # ---------------------------------------------------------------------
        if a1_output:
            conf = a1_output.get("calibrated_confidence", 1.0)
            margin = a1_output.get("margin", 1.0)
            top_intent = a1_output.get("top_intent", "")
            alts = a1_output.get("alternatives", [])
            cat = a1_output.get("category", "")

            # If margin is very narrow and secondary intent belongs to different category
            if len(alts) >= 2 and margin < 0.15 and conf < 0.60:
                alt2 = alts[1]
                if alt2.get("category") != cat:
                    cid = f"conf_{uuid.uuid4().hex[:8]}"
                    conf_record = AgentDisagreementRecord(
                        conflict_id=cid,
                        trace_id=trace_id,
                        conversation_id=conversation_id,
                        conflict_type=ConflictType.INTENT_DISAGREEMENT,
                        severity=ConflictSeverity.MEDIUM,
                        affected_agents=["A1_IntentAnalyst"],
                        agent_outputs={
                            "rank_1": {"intent": top_intent, "category": cat, "prob": conf},
                            "rank_2": {"intent": alt2.get("intent"), "category": alt2.get("category"), "prob": alt2.get("probability")}
                        },
                        evidence_references=[
                            {"rank": 1, "intent": top_intent, "confidence": conf},
                            {"rank": 2, "intent": alt2.get("intent"), "confidence": alt2.get("probability")}
                        ],
                        description=f"Close competing intents across domains: '{top_intent}' ({cat}) vs '{alt2.get('intent')}' ({alt2.get('category')}).",
                        reason_codes=["BORDERLINE_INTENT_MARGIN", "CROSS_CATEGORY_COMPETITOR"],
                        resolution_status=ConflictResolutionStatus.RESOLVED,
                        resolution_action=ResolutionAction.CLARIFICATION_REQUIRED,
                        resolution_explanation="Tightly split intent probabilities between distinct categories require disambiguation clarification.",
                        retry_count=0,
                        final_decision="CLARIFICATION_REQUIRED: AMBIGUOUS_INTENT"
                    )
                    conflicts_found.append(conf_record)

        # ---------------------------------------------------------------------
        # 3. EVIDENCE VS RESPONSE DISAGREEMENT
        # Response asserts definitive completed action without verified evidence
        # ---------------------------------------------------------------------
        if a2_output:
            resp_text = a2_output.get("retrieved_response", "") or ""
            sim = a2_output.get("retrieval_similarity", 1.0) or 0.0
            unresolved = a2_output.get("unresolved_placeholders", [])

            # Check if text contains affirmative completion claims while placeholders missing
            has_affirmative_claim = bool(re.search(r'\b(refunded|cancelled|approved|completed|dispatched)\b', resp_text, re.I))
            if has_affirmative_claim and len(unresolved) > 0:
                cid = f"conf_{uuid.uuid4().hex[:8]}"
                conf_record = AgentDisagreementRecord(
                    conflict_id=cid,
                    trace_id=trace_id,
                    conversation_id=conversation_id,
                    conflict_type=ConflictType.EVIDENCE_VS_RESPONSE_DISAGREEMENT,
                    severity=ConflictSeverity.HIGH,
                    affected_agents=["A2_ResponseSpecialist", "ValidationAgent"],
                    agent_outputs={
                        "A2_ResponseSpecialist": {"unresolved_placeholders": unresolved},
                        "ValidationAgent": {"safety_gate": "parameter_completeness_check"}
                    },
                    evidence_references=[
                        {"missing_slots": unresolved, "text_excerpt": resp_text[:120]}
                    ],
                    description="Response template contains definitive action verb but required transaction identifier is unresolved.",
                    reason_codes=["UNSUPPORTED_ACTION_CLAIM", "MISSING_REQUIRED_SLOTS"],
                    resolution_status=ConflictResolutionStatus.RESOLVED,
                    resolution_action=ResolutionAction.CLARIFICATION_REQUIRED,
                    resolution_explanation="Definitive execution statement rejected because transaction slot is missing.",
                    retry_count=0,
                    final_decision="CLARIFICATION_REQUIRED: MISSING_PARAMETER"
                )
                conflicts_found.append(conf_record)

        # ---------------------------------------------------------------------
        # 4. VALIDATION VS DECISION DISAGREEMENT
        # Preliminary resolution claimed but validation checks failed
        # ---------------------------------------------------------------------
        if validation_output and a1_output:
            overall_valid = validation_output.get("overall_valid", True)
            action = validation_output.get("final_action", "")
            if not overall_valid and "PROCEED" in action:
                cid = f"conf_{uuid.uuid4().hex[:8]}"
                conf_record = AgentDisagreementRecord(
                    conflict_id=cid,
                    trace_id=trace_id,
                    conversation_id=conversation_id,
                    conflict_type=ConflictType.VALIDATION_VS_DECISION_DISAGREEMENT,
                    severity=ConflictSeverity.CRITICAL,
                    affected_agents=["ValidationAgent", "DecisionPolicyEngine"],
                    agent_outputs={
                        "ValidationAgent": {"overall_valid": False, "failed_checks": [c["check_name"] for c in validation_output.get("checks", []) if not c.get("passed")]},
                        "DecisionPolicy": {"preliminary_action": action}
                    },
                    evidence_references=validation_output.get("checks", []),
                    description="Preliminary action suggested resolution, but ValidationAgent gate rejected output.",
                    reason_codes=["VALIDATION_SAFETY_GATE_TRIGGERED"],
                    resolution_status=ConflictResolutionStatus.RESOLVED,
                    resolution_action=ResolutionAction.ESCALATION_RECOMMENDED,
                    resolution_explanation="Validation safety rules take absolute precedence over preliminary suggestions.",
                    retry_count=0,
                    final_decision="ESCALATION_RECOMMENDED: SAFETY_CHECK_FAILED"
                )
                conflicts_found.append(conf_record)

        # ---------------------------------------------------------------------
        # 5. RETRIEVAL EVIDENCE DISAGREEMENT
        # High classification confidence but very low retrieval similarity
        # ---------------------------------------------------------------------
        if a1_output and a2_output:
            conf = a1_output.get("calibrated_confidence", 0.0)
            sim = a2_output.get("retrieval_similarity", 0.0) or 0.0
            if conf >= 0.85 and sim < 0.35 and a1_output.get("uncertainty_verdict") != "ESCALATE":
                cid = f"conf_{uuid.uuid4().hex[:8]}"
                conf_record = AgentDisagreementRecord(
                    conflict_id=cid,
                    trace_id=trace_id,
                    conversation_id=conversation_id,
                    conflict_type=ConflictType.RETRIEVAL_EVIDENCE_DISAGREEMENT,
                    severity=ConflictSeverity.HIGH,
                    affected_agents=["A1_IntentAnalyst", "A2_ResponseSpecialist"],
                    agent_outputs={
                        "A1_IntentAnalyst": {"predicted_intent": a1_output.get("top_intent"), "confidence": conf},
                        "A2_ResponseSpecialist": {"similarity": sim, "source_example": a2_output.get("source_example")}
                    },
                    evidence_references=[
                        {"classifier_confidence": conf, "retrieval_similarity": sim}
                    ],
                    description=f"A1 classified intent with high confidence ({conf*100:.1f}%), but A2 found no matching exemplar in train corpus (sim={sim*100:.1f}%).",
                    reason_codes=["CLASSIFIER_RETRIEVAL_DIVERGENCE"],
                    resolution_status=ConflictResolutionStatus.RESOLVED,
                    resolution_action=ResolutionAction.ESCALATION_RECOMMENDED,
                    resolution_explanation="High intent confidence with non-existent exemplar match indicates out-of-distribution nuance requiring human review.",
                    retry_count=0,
                    final_decision="ESCALATION_RECOMMENDED: UNVERIFIED_EXEMPLAR"
                )
                conflicts_found.append(conf_record)

        if not conflicts_found:
            return None

        # Sort by severity: CRITICAL > HIGH > MEDIUM > LOW
        sev_order = {ConflictSeverity.CRITICAL: 0, ConflictSeverity.HIGH: 1, ConflictSeverity.MEDIUM: 2, ConflictSeverity.LOW: 3}
        conflicts_found.sort(key=lambda c: sev_order.get(c.severity, 4))
        chosen_conflict = conflicts_found[0]

        # Record to audit log
        self._record_conflict(chosen_conflict)
        return chosen_conflict

    def _record_conflict(self, record: AgentDisagreementRecord):
        """Persists conflict record to reports/agent_conflicts.json."""
        records = []
        if os.path.exists(self.log_path):
            try:
                with open(self.log_path, "r", encoding="utf-8") as f:
                    records = json.load(f)
            except Exception:
                records = []

        records.append(record.model_dump())
        with open(self.log_path, "w", encoding="utf-8") as f:
            json.dump(records[-200:], f, indent=2)

    def get_recent_conflicts(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns recent conflict records for the Conflict Inspector UI."""
        if not os.path.exists(self.log_path):
            return []
        try:
            with open(self.log_path, "r", encoding="utf-8") as f:
                records = json.load(f)
                return records[-limit:][::-1]
        except Exception as e:
            logger.error(f"Failed to read conflicts from {self.log_path}: {e}")
            return []

    def get_conflict_by_id(self, conflict_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves single conflict detail."""
        for c in self.get_recent_conflicts(limit=200):
            if c.get("conflict_id") == conflict_id:
                return c
        return None

