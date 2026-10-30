"""
RELAY AI — Structured Dynamic Workflow Schemas (Part 2)
Typed Pydantic models for the Dynamic Agent Team Formation, Capability Registry,
Workflow Planning, and Adaptive Execution.
"""

from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import time
from app.schemas.conflict_models import AgentDisagreementRecord


class WorkflowType(str, Enum):
    WORKFLOW_GREETING = "WORKFLOW_GREETING"
    WORKFLOW_STANDARD_SUPPORT = "WORKFLOW_STANDARD_SUPPORT"
    WORKFLOW_CLARIFICATION_MISSING_SLOT = "WORKFLOW_CLARIFICATION_MISSING_SLOT"
    WORKFLOW_AMBIGUOUS_CONFLICT = "WORKFLOW_AMBIGUOUS_CONFLICT"
    WORKFLOW_ESCALATION = "WORKFLOW_ESCALATION"
    WORKFLOW_PRODUCT_GUIDE = "WORKFLOW_PRODUCT_GUIDE"


class CapabilityStatus(str, Enum):
    PLANNED = "PLANNED"
    EXECUTING = "EXECUTING"
    EXECUTED = "EXECUTED"
    SKIPPED = "SKIPPED"
    FAILED = "FAILED"


class CapabilityDefinition(BaseModel):
    """Catalog metadata for an individual registered agent capability."""
    capability_id: str
    title: str
    agent_role: str
    description: str
    prerequisites: List[str] = Field(default_factory=list)
    is_mandatory: bool = False
    expected_latency_ms: float = 1.0


class CapabilityExecutionRecord(BaseModel):
    """Runtime trace for an individual capability within a dynamically formed workflow."""
    capability_id: str
    capability_name: str
    agent_role: str
    status: CapabilityStatus
    reason: str
    duration_ms: float = 0.0
    input_summary: Dict[str, Any] = Field(default_factory=dict)
    output_summary: Dict[str, Any] = Field(default_factory=dict)


class WorkflowPlan(BaseModel):
    """Dynamic plan generated prior to execution, detailing active and skipped capabilities."""
    workflow_id: str
    workflow_type: WorkflowType
    query: str
    rationale: str
    planned_capabilities: List[str]
    skipped_capabilities: Dict[str, str] = Field(default_factory=dict)  # capability_id -> skip reason
    created_at: str = Field(default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))


class WorkflowExecutionResult(BaseModel):
    """Complete record of the dynamic workflow execution."""
    workflow_id: str
    workflow_type: WorkflowType
    plan: WorkflowPlan
    execution_records: List[CapabilityExecutionRecord]
    total_duration_ms: float
    conflict_record: Optional[AgentDisagreementRecord] = None
    is_validated: bool = True
    canonical_decision: str
    final_response: str

