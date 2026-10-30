"""
RELAY AI — Structured Conflict & Disagreement Data Models (Part 1)
Pydantic schemas for the Agent Disagreement & Evidence-Based Conflict Resolution Engine.
"""

from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import time


class ConflictType(str, Enum):
    INTENT_DISAGREEMENT = "INTENT_DISAGREEMENT"
    RETRIEVAL_EVIDENCE_DISAGREEMENT = "RETRIEVAL_EVIDENCE_DISAGREEMENT"
    SLOT_DISAGREEMENT = "SLOT_DISAGREEMENT"
    EVIDENCE_VS_RESPONSE_DISAGREEMENT = "EVIDENCE_VS_RESPONSE_DISAGREEMENT"
    VALIDATION_VS_DECISION_DISAGREEMENT = "VALIDATION_VS_DECISION_DISAGREEMENT"
    CONFIDENCE_UNCERTAINTY = "CONFIDENCE_UNCERTAINTY"


class ConflictSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ResolutionAction(str, Enum):
    RESOLVED_BY_EVIDENCE = "RESOLVED_BY_EVIDENCE"
    REQUIRES_ADDITIONAL_RETRIEVAL = "REQUIRES_ADDITIONAL_RETRIEVAL"
    CLARIFICATION_REQUIRED = "CLARIFICATION_REQUIRED"
    ESCALATION_RECOMMENDED = "ESCALATION_RECOMMENDED"
    CONFLICT_UNRESOLVED = "CONFLICT_UNRESOLVED"


class ConflictResolutionStatus(str, Enum):
    DETECTED = "DETECTED"
    VERIFYING = "VERIFYING"
    RESOLVED = "RESOLVED"
    UNRESOLVED = "UNRESOLVED"
    ESCALATED = "ESCALATED"


class AgentDisagreementRecord(BaseModel):
    """Structured record of a single detected disagreement between agent conclusions."""
    conflict_id: str
    trace_id: str
    conversation_id: Optional[str] = None
    conflict_type: ConflictType
    severity: ConflictSeverity
    detected_at: str = Field(default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    affected_agents: List[str]
    agent_outputs: Dict[str, Any]
    evidence_references: List[Dict[str, Any]] = Field(default_factory=list)
    description: str
    reason_codes: List[str] = Field(default_factory=list)
    resolution_status: ConflictResolutionStatus = ConflictResolutionStatus.DETECTED
    resolution_action: ResolutionAction
    resolution_explanation: str
    retry_count: int = 0
    final_decision: Optional[str] = None

