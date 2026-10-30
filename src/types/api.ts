/**
 * RELAY AI — Frontend Typed API Schemas
 * Directly mirrors backend Pydantic models from app.schemas.agent_models
 * and the canonical API contract in docs/contracts/relay-api-v1.md
 */

export type AgentStatus =
  | "SUCCESS"
  | "UNCERTAIN"
  | "ERROR"
  | "SKIPPED"
  | "CLARIFICATION_REQUIRED"
  | "ESCALATION_REQUIRED";

export interface AgentTrace {
  agent_name: string;
  processing_status: AgentStatus;
  input_payload: Record<string, any>;
  output_payload: Record<string, any>;
  decision_reason: string;
  duration_ms: number;
}

export interface IntentAlternative {
  rank: number;
  intent: string;
  category: string;
  probability: number;
}

export interface ValidationCheckItem {
  check_name: string;
  passed: boolean;
  detail: string;
}

export interface OrchestratorResult {
  original_customer_query: string;
  intent_prediction: string;
  category: string;
  calibrated_confidence: number;
  margin: number;
  alternative_intents: IntentAlternative[];
  retrieved_response: string | null;
  source_example: string | null;
  retrieval_similarity: number | null;
  placeholder_status: string | null;
  unresolved_placeholders: string[];
  validation_checks: ValidationCheckItem[];
  final_decision: string;
  final_response: string;
  complete_agent_trace: AgentTrace[];
  total_duration_ms: number;
  workflow_execution?: {
    workflow_id: string;
    workflow_type: string;
    rationale: string;
    planned_capabilities: string[];
    skipped_capabilities: Record<string, string>;
    conflict_detected: boolean;
  };
  conflict_record?: AgentDisagreementRecord | null;
}

export interface ChatRequest {
  query: string;
  customer_slots?: Record<string, string>;
}

export interface IntentResponse {
  query: string;
  top_intent: string;
  category: string;
  confidence: number;
  margin: number;
  uncertainty_verdict: string;
  alternatives: IntentAlternative[];
  duration_ms: number;
}

export interface HealthComponents {
  api_server: string;
  process_alive?: boolean;
  api_ready?: boolean;
  intent_classifier_file: string;
  response_retriever_file: string;
  calibration_config: string;
  intent_engine_runtime: string;
  retrieval_engine_runtime: string;
  optional_llm?: string;
  optional_database?: string;
}

export interface HealthResponse {
  status: "healthy" | "degraded";
  service: string;
  version: string;
  timestamp: string;
  components: HealthComponents;
}

export interface SystemInfoAgent {
  name: string;
  role: string;
  method: string;
}

export interface SystemInfoResponse {
  system: string;
  tagline: string;
  version: string;
  architecture: {
    type: string;
    agents: SystemInfoAgent[];
  };
  dataset_metadata: {
    source: string;
    training_records: number;
    validation_records: number;
    total_records: number;
    unique_intents: number;
    unique_categories: number;
    categories: string[];
    dataset_columns: string[];
    flags_note: string;
  };
  offline_validation_benchmarks: {
    evaluation_context: string;
    intent_classification: {
      validation_samples: number;
      accuracy: number;
      macro_f1: number;
      weighted_f1: number;
      top_3_accuracy: number;
      expected_calibration_error_ece: number;
      brier_score: number;
    };
    response_retrieval: {
      recall_at_1: number;
      recall_at_3: number;
      recall_at_5: number;
      mean_reciprocal_rank_mrr: number;
      mean_cosine_similarity: number;
    };
    disclaimer: string;
  };
}

export interface AssistantChatRequest {
  session_id?: string;
  message: string;
  customer_context?: Record<string, any>;
}

export interface AssistantChatResponse {
  session_id: string;
  routing_mode: "deterministic_smalltalk" | "product_guide" | "support_demo";
  reply: string;
  intent_detected?: string;
  category?: string;
  confidence?: number;
  margin?: number;
  sources?: Array<{
    source_type: string;
    source_id?: string;
    title?: string;
    similarity?: number;
    snippet?: string;
  }>;
  placeholder_status?: string | null;
  unresolved_placeholders?: string[];
  clarification_needed: boolean;
  escalation_recommended: boolean;
  final_decision?: string;
  turn_count: number;
}

export interface TranscriptionResponse {
  transcription: string;
  detected_language: string;
  audio_duration_seconds: number;
  confidence: number;
}

export interface SpeechRequest {
  text: string;
  voice?: string;
  format?: string;
}

export interface FeedbackPayload {
  query: string;
  intent: string;
  final_decision: string;
  rating: number;
  helpful: boolean;
  comment?: string;
  request_id?: string;
}

export interface FeedbackResponse {
  status: string;
  feedback_id: string;
  message: string;
  recorded_at: string;
}

export interface ReplayPayload {
  query: string;
  modified_query?: string;
  customer_slots?: Record<string, string>;
}

export interface ReplayVariantResult {
  query: string;
  intent: string;
  category: string;
  confidence: number;
  margin: number;
  similarity: number | null;
  final_decision: string;
  duration_ms: number;
}

export interface ReplayResponse {
  variant_a: ReplayVariantResult;
  variant_b: ReplayVariantResult;
  comparison: {
    intent_match: boolean;
    decision_identical: boolean;
    confidence_delta: number;
    margin_delta: number;
    similarity_delta: number;
    latency_delta_ms: number;
  };
}

// ---------------------------------------------------------------------------
// Intelligence Core Schemas (Parts 1, 2, 3)
// ---------------------------------------------------------------------------

export type ConflictType =
  | "INTENT_DISAGREEMENT"
  | "RETRIEVAL_EVIDENCE_DISAGREEMENT"
  | "SLOT_DISAGREEMENT"
  | "EVIDENCE_VS_RESPONSE_DISAGREEMENT"
  | "VALIDATION_VS_DECISION_DISAGREEMENT"
  | "CONFIDENCE_UNCERTAINTY";

export type ConflictSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ResolutionAction =
  | "RESOLVED_BY_EVIDENCE"
  | "REQUIRES_ADDITIONAL_RETRIEVAL"
  | "CLARIFICATION_REQUIRED"
  | "ESCALATION_RECOMMENDED"
  | "CONFLICT_UNRESOLVED";

export interface AgentDisagreementRecord {
  conflict_id: string;
  trace_id: string;
  conversation_id?: string;
  conflict_type: ConflictType;
  severity: ConflictSeverity;
  detected_at: string;
  affected_agents: string[];
  agent_outputs: Record<string, any>;
  evidence_references: Array<Record<string, any>>;
  description: string;
  reason_codes: string[];
  resolution_status: string;
  resolution_action: ResolutionAction;
  resolution_explanation: string;
  retry_count: number;
  final_decision?: string;
}

export type WorkflowType =
  | "WORKFLOW_GREETING"
  | "WORKFLOW_STANDARD_SUPPORT"
  | "WORKFLOW_CLARIFICATION_MISSING_SLOT"
  | "WORKFLOW_AMBIGUOUS_CONFLICT"
  | "WORKFLOW_ESCALATION"
  | "WORKFLOW_PRODUCT_GUIDE";

export interface CapabilityDefinition {
  capability_id: string;
  title: string;
  agent_role: string;
  description: string;
  prerequisites: string[];
  is_mandatory: boolean;
  expected_latency_ms: number;
}

export interface CapabilityExecutionRecord {
  capability_id: string;
  capability_name: string;
  agent_role: string;
  status: "PLANNED" | "EXECUTING" | "EXECUTED" | "SKIPPED" | "FAILED";
  reason: string;
  duration_ms: number;
  input_summary: Record<string, any>;
  output_summary: Record<string, any>;
}

export interface WorkflowPlan {
  workflow_id: string;
  workflow_type: WorkflowType;
  query: string;
  rationale: string;
  planned_capabilities: string[];
  skipped_capabilities: Record<string, string>;
  created_at: string;
}

export interface QueryCluster {
  cluster_id: string;
  title: string;
  primary_intent: string;
  category: string;
  query_count: number;
  exemplar_queries: string[];
  avg_similarity: number;
  priority_score: number;
  status: "ACTIVE" | "ADDRESSED" | "DISMISSED";
  last_seen_at: string;
}

export interface FAQRecommendation {
  suggestion_id: string;
  cluster_id: string;
  proposed_question: string;
  proposed_answer: string;
  grounding_evidence: Array<Record<string, any>>;
  category: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "DEPLOYED";
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  rejection_reason?: string;
}

export interface KnowledgeVersionSnapshot {
  version_id: string;
  created_at: string;
  description: string;
  total_articles: number;
  is_active: boolean;
  previous_version_id?: string;
  applied_suggestion_id?: string;
}

export interface RetrievalBenchmarkResult {
  benchmark_id: string;
  executed_at: string;
  version_id: string;
  total_queries: number;
  passed_queries: number;
  mean_similarity: number;
  min_similarity: number;
  no_regression: boolean;
  details: Array<{
    query: string;
    similarity: number;
    matched_title: string;
    passed: boolean;
  }>;
}
