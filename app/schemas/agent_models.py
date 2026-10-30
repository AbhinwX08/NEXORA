"""
RELAY AI — Structured Agent Communication Schemas (Phase 5)
Typed Pydantic models for inter-agent communication, traces, handoffs, and final orchestration.
"""

from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class AgentStatus(str, Enum):
    SUCCESS = "SUCCESS"
    UNCERTAIN = "UNCERTAIN"
    ERROR = "ERROR"
    SKIPPED = "SKIPPED"
    CLARIFICATION_REQUIRED = "CLARIFICATION_REQUIRED"
    ESCALATION_REQUIRED = "ESCALATION_REQUIRED"


class AgentTrace(BaseModel):
    """Execution trace entry for an individual agent in the multi-agent pipeline."""
    agent_name: str
    processing_status: AgentStatus
    input_payload: Dict[str, Any]
    output_payload: Dict[str, Any]
    decision_reason: str
    duration_ms: float


class IntentAlternative(BaseModel):
    """Ranked alternative intent candidate."""
    rank: int
    intent: str
    category: str
    probability: float


class A1IntentHandoff(BaseModel):
    """Structured handoff payload emitted by Agent 1 (Intent Analyst)."""
    original_query: str
    top_intent: str
    category: str
    calibrated_confidence: float
    margin: float
    alternative_intents: List[IntentAlternative]
    uncertainty_verdict: str  # CONFIDENT, UNCERTAIN, UNSUPPORTED, ESCALATE


class A2RetrievalHandoff(BaseModel):
    """Structured handoff payload emitted by Agent 2 (Response Specialist)."""
    retrieved_response: str
    source_example: str
    retrieval_similarity: float
    placeholder_status: str  # 'resolved' or 'clarification_required'
    unresolved_placeholders: List[str] = Field(default_factory=list)
    resolved_slots: Dict[str, str] = Field(default_factory=dict)
    retrieval_method: str = "combined"


class ValidationCheckItem(BaseModel):
    """Specific quality/safety check conducted by the Validation Agent."""
    check_name: str
    passed: bool
    detail: str


class ValidationHandoff(BaseModel):
    """Structured assessment payload emitted by Validation Agent."""
    overall_valid: bool
    checks: List[ValidationCheckItem]
    decision_state: str  # HIGH_CONFIDENCE, UNCERTAIN, UNSUPPORTED, HUMAN_ESCALATION
    final_action: str   # PROCEED_AUTOMATED, NEED_SLOT_CLARIFICATION, AMBIGUOUS_INTENT_CLARIFICATION, UNSUPPORTED_REJECTION, ESCALATE_TO_HUMAN, SERVICE_ERROR


class OrchestratorResult(BaseModel):
    """Complete, end-to-end customer support orchestration result."""
    original_customer_query: str
    intent_prediction: str
    category: str
    calibrated_confidence: float
    margin: float
    alternative_intents: List[IntentAlternative]
    retrieved_response: Optional[str] = None
    source_example: Optional[str] = None
    retrieval_similarity: Optional[float] = None
    placeholder_status: Optional[str] = None
    unresolved_placeholders: List[str] = Field(default_factory=list)
    validation_checks: List[ValidationCheckItem] = Field(default_factory=list)
    final_decision: str
    final_response: str
    complete_agent_trace: List[AgentTrace]
    total_duration_ms: float
    workflow_execution: Optional[Dict[str, Any]] = None
    conflict_record: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Standardized error envelope defined in docs/contracts/relay-api-v1.md."""
    status: str = "error"
    error: str
    error_code: str
    request_id: str
    timestamp: str

