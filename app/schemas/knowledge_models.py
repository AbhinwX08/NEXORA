"""
RELAY AI — Self-Improving Knowledge Gap & FAQ Intelligence Models (Part 3)
Typed Pydantic schemas for Knowledge Gap Events, Clustered Queries,
FAQ Recommendations, Version Snapshots, and Retrieval Benchmarks.
"""

from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import time


class KnowledgeGapType(str, Enum):
    LOW_CONFIDENCE_INTENT = "LOW_CONFIDENCE_INTENT"
    UNMATCHED_QUERY = "UNMATCHED_QUERY"
    FAILED_RETRIEVAL = "FAILED_RETRIEVAL"
    REPEATED_CLARIFICATION = "REPEATED_CLARIFICATION"
    UNRESOLVED_ESCALATION = "UNRESOLVED_ESCALATION"


class GapStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ADDRESSED = "ADDRESSED"
    DISMISSED = "DISMISSED"


class FAQReviewStatus(str, Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DEPLOYED = "DEPLOYED"


class KnowledgeGapEvent(BaseModel):
    """Structured record of a single customer interaction that exposed a knowledge deficit."""
    gap_id: str
    trace_id: str
    conversation_id: Optional[str] = None
    redacted_query: str
    gap_type: KnowledgeGapType
    occurred_at: str = Field(default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    intent_hypothesis: Optional[str] = None
    calibrated_confidence: Optional[float] = None
    retrieval_similarity: Optional[float] = None
    reason: str


class QueryCluster(BaseModel):
    """Semantically grouped cluster of recurring unaddressed knowledge gap queries."""
    cluster_id: str
    title: str
    primary_intent: str
    category: str
    query_count: int
    exemplar_queries: List[str]
    avg_similarity: float
    priority_score: float
    status: GapStatus = GapStatus.ACTIVE
    last_seen_at: str = Field(default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))


class FAQRecommendation(BaseModel):
    """Proposed Q&A entry grounded in verified evidence awaiting human review."""
    suggestion_id: str
    cluster_id: str
    proposed_question: str
    proposed_answer: str
    grounding_evidence: List[Dict[str, Any]] = Field(default_factory=list)
    category: str
    status: FAQReviewStatus = FAQReviewStatus.PENDING_REVIEW
    created_at: str = Field(default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    rejection_reason: Optional[str] = None


class KnowledgeVersionSnapshot(BaseModel):
    """Immutable version snapshot of the knowledge base for safe atomic updates and rollback."""
    version_id: str
    created_at: str = Field(default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    description: str
    total_articles: int
    is_active: bool = False
    previous_version_id: Optional[str] = None
    applied_suggestion_id: Optional[str] = None


class RetrievalBenchmarkResult(BaseModel):
    """Verification results validating that knowledge base modifications caused no regression."""
    benchmark_id: str
    executed_at: str = Field(default_factory=lambda: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    version_id: str
    total_queries: int
    passed_queries: int
    mean_similarity: float
    min_similarity: float
    no_regression: bool
    details: List[Dict[str, Any]] = Field(default_factory=list)

