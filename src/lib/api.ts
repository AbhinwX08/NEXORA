/**
 * RELAY AI — Production API Client
 * Centralized HTTP service for connecting the React frontend to the Flask backend.
 * Implements endpoints defined in docs/contracts/relay-api-v1.md
 */

import {
  ChatRequest,
  OrchestratorResult,
  IntentResponse,
  HealthResponse,
  SystemInfoResponse,
  AssistantChatRequest,
  AssistantChatResponse,
  TranscriptionResponse,
  SpeechRequest,
  FeedbackPayload,
  FeedbackResponse,
  ReplayPayload,
  ReplayResponse,
  AgentDisagreementRecord,
  CapabilityDefinition,
  WorkflowPlan,
  QueryCluster,
  FAQRecommendation,
  KnowledgeVersionSnapshot,
  RetrievalBenchmarkResult,
} from "@/types/api";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  requestId?: string;
  details?: any;

  constructor(message: string, status: number, requestId?: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}

async function requestJson<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body && typeof options.body === "string") {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...((options.headers as Record<string, string>) || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: mergedHeaders,
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const errMsg =
        data?.error ||
        data?.message ||
        `Server responded with HTTP ${response.status} (${response.statusText})`;
      throw new ApiError(errMsg, response.status, data?.request_id, data);
    }

    return data as T;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw error;
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      `Failed to communicate with RELAY AI backend (${error.message || "Network Error"}). Verify the Flask API is running on port 8000.`,
      0
    );
  }
}

/**
 * Checks system status and model readiness.
 */
export async function checkHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/api/health", {
    method: "GET",
    signal,
  });
}

/**
 * Retrieves static metadata, model capabilities, and offline evaluation benchmarks.
 */
export async function getSystemInfo(signal?: AbortSignal): Promise<SystemInfoResponse> {
  return requestJson<SystemInfoResponse>("/api/info", {
    method: "GET",
    signal,
  });
}

/**
 * Executes full multi-agent orchestration for a customer inquiry.
 */
export async function sendChatMessage(
  payload: ChatRequest,
  signal?: AbortSignal
): Promise<OrchestratorResult> {
  return requestJson<OrchestratorResult>("/api/chat", {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}

/**
 * Fast calibrated intent classification (A1 only).
 */
export async function classifyIntent(
  query: string,
  signal?: AbortSignal
): Promise<IntentResponse> {
  return requestJson<IntentResponse>("/api/intent", {
    method: "POST",
    body: JSON.stringify({ query }),
    signal,
  });
}

/**
 * Conversational multi-turn assistant with session memory & RAG.
 */
export async function sendAssistantMessage(
  payload: AssistantChatRequest,
  signal?: AbortSignal
): Promise<AssistantChatResponse> {
  return requestJson<AssistantChatResponse>("/api/assistant/chat", {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}

/**
 * Transcribes audio via server STT service.
 */
export async function transcribeAudio(
  audioBlob: Blob,
  language?: string,
  signal?: AbortSignal
): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.wav");
  if (language) formData.append("language", language);

  const url = `${BASE_URL}/api/voice/transcribe`;
  try {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
      signal,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(data?.error || "Audio transcription failed.", response.status);
    }
    return data as TranscriptionResponse;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || "Failed to transcribe audio.", 0);
  }
}

/**
 * Synthesizes speech from text and returns a playable audio Blob.
 */
export async function synthesizeSpeech(
  payload: SpeechRequest,
  signal?: AbortSignal
): Promise<Blob> {
  const url = `${BASE_URL}/api/voice/speech`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new ApiError(err?.error || "Speech synthesis failed.", response.status);
    }
    return await response.blob();
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || "Speech synthesis failed.", 0);
  }
}

/**
 * Records customer feedback to the backend review queue.
 */
export async function submitFeedback(
  payload: FeedbackPayload,
  signal?: AbortSignal
): Promise<FeedbackResponse> {
  return requestJson<FeedbackResponse>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}

/**
 * Executes decision replay comparison between query variants.
 */
export async function executeReplay(
  payload: ReplayPayload,
  signal?: AbortSignal
): Promise<ReplayResponse> {
  return requestJson<ReplayResponse>("/api/replay", {
    method: "POST",
    body: JSON.stringify(payload),
    signal,
  });
}

// ---------------------------------------------------------------------------
// Intelligence Core Client Functions (Parts 1, 2, 3)
// ---------------------------------------------------------------------------

export async function getConflicts(limit = 50, signal?: AbortSignal): Promise<{ conflicts: AgentDisagreementRecord[]; total: number }> {
  return requestJson<{ conflicts: AgentDisagreementRecord[]; total: number }>(`/api/conflicts?limit=${limit}`, {
    method: "GET",
    signal,
  });
}

export async function getConflictDetail(conflictId: string, signal?: AbortSignal): Promise<AgentDisagreementRecord> {
  return requestJson<AgentDisagreementRecord>(`/api/conflicts/${conflictId}`, {
    method: "GET",
    signal,
  });
}

export async function getCapabilities(signal?: AbortSignal): Promise<{ capabilities: CapabilityDefinition[]; mandatory_capabilities: string[] }> {
  return requestJson<{ capabilities: CapabilityDefinition[]; mandatory_capabilities: string[] }>("/api/workflows/capabilities", {
    method: "GET",
    signal,
  });
}

export async function planWorkflow(
  query: string,
  customerSlots?: Record<string, string>,
  preferredMode?: string,
  signal?: AbortSignal
): Promise<WorkflowPlan> {
  return requestJson<WorkflowPlan>("/api/workflows/plan", {
    method: "POST",
    body: JSON.stringify({
      query,
      customer_slots: customerSlots,
      preferred_mode: preferredMode,
    }),
    signal,
  });
}

export async function getKnowledgeGaps(limit = 100, signal?: AbortSignal): Promise<{ gaps: any[]; total: number }> {
  return requestJson<{ gaps: any[]; total: number }>(`/api/knowledge-gaps?limit=${limit}`, {
    method: "GET",
    signal,
  });
}

export async function getKnowledgeClusters(signal?: AbortSignal): Promise<{ clusters: QueryCluster[]; total: number }> {
  return requestJson<{ clusters: QueryCluster[]; total: number }>("/api/knowledge-gaps/clusters", {
    method: "GET",
    signal,
  });
}

export async function getKnowledgeSuggestions(signal?: AbortSignal): Promise<{ suggestions: FAQRecommendation[]; total: number }> {
  return requestJson<{ suggestions: FAQRecommendation[]; total: number }>("/api/knowledge-suggestions", {
    method: "GET",
    signal,
  });
}

export async function reviewKnowledgeSuggestion(
  suggestionId: string,
  action: "APPROVE" | "REJECT",
  reviewer = "Human Supervisor",
  rejectionReason?: string,
  signal?: AbortSignal
): Promise<FAQRecommendation> {
  return requestJson<FAQRecommendation>(`/api/knowledge-suggestions/${suggestionId}/review`, {
    method: "POST",
    body: JSON.stringify({
      action,
      reviewer,
      rejection_reason: rejectionReason,
    }),
    signal,
  });
}

export async function getKnowledgeVersions(signal?: AbortSignal): Promise<{ versions: KnowledgeVersionSnapshot[]; total: number }> {
  return requestJson<{ versions: KnowledgeVersionSnapshot[]; total: number }>("/api/knowledge/versions", {
    method: "GET",
    signal,
  });
}

export async function rollbackKnowledgeVersion(versionId: string, signal?: AbortSignal): Promise<any> {
  return requestJson<any>(`/api/knowledge/versions/${versionId}/rollback`, {
    method: "POST",
    signal,
  });
}

export async function runKnowledgeBenchmark(signal?: AbortSignal): Promise<RetrievalBenchmarkResult> {
  return requestJson<RetrievalBenchmarkResult>("/api/knowledge/benchmark", {
    method: "POST",
    signal,
  });
}
