import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkHealth, getSystemInfo, sendChatMessage, ApiError } from "../lib/api";

describe("API Client Service (src/lib/api.ts)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("checkHealth returns parsed health response on 200 OK", async () => {
    const mockHealth = {
      status: "healthy",
      service: "RELAY AI Multi-Agent Customer Support Engine",
      version: "1.0.0",
      timestamp: "2026-10-30T18:00:00Z",
      components: {
        api_server: "running",
        intent_classifier_file: "available",
        response_retriever_file: "available",
        calibration_config: "available",
        intent_engine_runtime: "ready",
        retrieval_engine_runtime: "ready",
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => mockHealth,
    } as any);

    const res = await checkHealth();
    expect(res.status).toBe("healthy");
    expect(res.components.intent_engine_runtime).toBe("ready");
    expect(fetch).toHaveBeenCalledWith("/api/health", expect.any(Object));
  });

  it("getSystemInfo returns verified metadata and offline benchmark metrics", async () => {
    const mockInfo = {
      system: "RELAY AI",
      tagline: "From customer query to verified resolution",
      version: "1.0.0",
      dataset_metadata: {
        training_records: 18810,
        validation_records: 4031,
        total_records: 22841,
        unique_intents: 27,
        unique_categories: 11,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => mockInfo,
    } as any);

    const res = await getSystemInfo();
    expect(res.system).toBe("RELAY AI");
    expect(res.dataset_metadata.training_records).toBe(18810);
    expect(res.dataset_metadata.validation_records).toBe(4031);
    expect(res.dataset_metadata.total_records).toBe(22841);
  });

  it("sendChatMessage posts query payload and returns OrchestratorResult", async () => {
    const mockResult = {
      original_customer_query: "I want to cancel my order #98214",
      intent_prediction: "cancel_order",
      category: "ORDER",
      calibrated_confidence: 0.8264,
      margin: 0.35,
      alternative_intents: [],
      retrieved_response: "To cancel your order 98214...",
      source_example: "cancel purchase with order number",
      retrieval_similarity: 0.6849,
      placeholder_status: "resolved",
      unresolved_placeholders: [],
      validation_checks: [
        { check_name: "domain_boundary_check", passed: true, detail: "Query in-domain" },
      ],
      final_decision: "HIGH_CONFIDENCE: PROCEED_AUTOMATED",
      final_response: "I understand you want to cancel order #98214.",
      complete_agent_trace: [
        {
          agent_name: "A1_IntentAnalyst",
          processing_status: "SUCCESS",
          input_payload: { query: "I want to cancel my order #98214" },
          output_payload: { top_intent: "cancel_order" },
          decision_reason: "High confidence",
          duration_ms: 1.2,
        },
      ],
      total_duration_ms: 3.5,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => mockResult,
    } as any);

    const res = await sendChatMessage({ query: "I want to cancel my order #98214" });
    expect(res.intent_prediction).toBe("cancel_order");
    expect(res.final_decision).toContain("PROCEED_AUTOMATED");
    expect(res.complete_agent_trace.length).toBe(1);
    expect(res.total_duration_ms).toBe(3.5);
  });

  it("handles structured 400 bad request error safely", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      headers: { get: () => "application/json" },
      json: async () => ({ status: "error", error: "Query string is required and cannot be empty." }),
    } as any);

    await expect(sendChatMessage({ query: "" })).rejects.toThrow(ApiError);
  });

  it("handles network failure and backend offline state with descriptive ApiError", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Failed to fetch"));

    await expect(checkHealth()).rejects.toThrow(/Failed to communicate with RELAY AI backend/);
  });
});
