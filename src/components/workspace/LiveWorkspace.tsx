import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Network,
  RefreshCw,
  Send,
  FileEdit,
  CheckCircle2,
  Check,
  AlertTriangle,
  Copy,
  X,
  Code2,
  Sliders,
  AlertCircle,
  GitFork,
  Scale,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { SAMPLE_PRESETS, PresetItem } from "@/data/presets";
import { sendChatMessage, checkHealth, getConflicts } from "@/lib/api";
import { OrchestratorResult, HealthResponse, AgentDisagreementRecord } from "@/types/api";
import { VoiceInputButton, SpeechPlaybackButton } from "@/components/voice/VoiceController";

export interface LiveWorkspaceProps {
  onBackToLanding: () => void;
}

export const LiveWorkspace: React.FC<LiveWorkspaceProps> = ({ onBackToLanding }) => {
  // Input states
  const [queryInput, setQueryInput] = useState<string>("I want to cancel my order #98214");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("cancel-with-slot");
  const [slotKey, setSlotKey] = useState<string>("Order Number");
  const [slotValue, setSlotValue] = useState<string>("98214");
  const [showSlotFields, setShowSlotFields] = useState<boolean>(false);

  // Runtime states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<OrchestratorResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [backendHealth, setBackendHealth] = useState<HealthResponse | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);

  // UI state
  const [showTraceModal, setShowTraceModal] = useState<boolean>(false);
  const [showConflictModal, setShowConflictModal] = useState<boolean>(false);
  const [recentConflicts, setRecentConflicts] = useState<AgentDisagreementRecord[]>([]);
  const [selectedConflictDetail, setSelectedConflictDetail] = useState<AgentDisagreementRecord | null>(null);
  const [showSkippedCapabilities, setShowSkippedCapabilities] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleOpenConflictInspector = async () => {
    setShowConflictModal(true);
    try {
      const data = await getConflicts(30);
      setRecentConflicts(data.conflicts || []);
      if (data.conflicts && data.conflicts.length > 0) {
        setSelectedConflictDetail(data.conflicts[0]);
      }
    } catch (e) {
      console.error("Failed to load conflicts:", e);
    }
  };

  // Check health on mount
  useEffect(() => {
    fetchHealth();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const data = await checkHealth();
      setBackendHealth(data);
    } catch (err: any) {
      setBackendHealth(null);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const handleSelectPreset = (preset: PresetItem) => {
    setSelectedPresetId(preset.id);
    setQueryInput(preset.query);
    if (preset.defaultSlots) {
      const firstKey = Object.keys(preset.defaultSlots)[0];
      setSlotKey(firstKey);
      setSlotValue(preset.defaultSlots[firstKey]);
      setShowSlotFields(true);
    } else {
      setSlotKey("");
      setSlotValue("");
    }
    // Do NOT simulate execution — only populate the input console
  };

  const handleClear = () => {
    setQueryInput("");
    setSlotKey("");
    setSlotValue("");
  };

  const handleExecuteQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = queryInput.trim();
    if (!query) {
      setExecutionError("Please enter a customer query before submitting.");
      return;
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsProcessing(true);
    setExecutionError(null);

    // Prepare customer_slots if supplied
    const customer_slots: Record<string, string> = {};
    if (slotKey.trim() && slotValue.trim()) {
      customer_slots[slotKey.trim()] = slotValue.trim();
    }

    try {
      const result = await sendChatMessage(
        {
          query,
          customer_slots: Object.keys(customer_slots).length > 0 ? customer_slots : undefined,
        },
        controller.signal
      );

      setExecutionResult(result);
      setToastMessage(`Multi-agent pipeline completed in ${result.total_duration_ms.toFixed(1)}ms`);
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      const msg = err.message || "Failed to process query through the support orchestrator.";
      setExecutionError(msg);
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4500);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyResponse = () => {
    if (!executionResult?.final_response) return;
    navigator.clipboard.writeText(executionResult.final_response).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        setToastMessage("Failed to copy response to clipboard.");
        setTimeout(() => setToastMessage(null), 2500);
      }
    );
  };

  // Find traces for agents
  const a1Trace = executionResult?.complete_agent_trace?.find((t) => t.agent_name === "A1_IntentAnalyst");
  const a2Trace = executionResult?.complete_agent_trace?.find((t) => t.agent_name === "A2_ResponseSpecialist");
  const valTrace = executionResult?.complete_agent_trace?.find((t) => t.agent_name === "ValidationAgent");

  return (
    <div className="flex flex-col w-full bg-[#F5F7FB] min-h-screen text-on-surface">
      {/* 1. Command Header Bar */}
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-[#E3E8F0] flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm text-left">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToLanding}
            className="p-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#101A2B] transition-colors"
            title="Return to Overview & Landing"
            aria-label="Back to Landing Page"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-[#101A2B] flex items-center justify-center text-[#20C6B6] shadow-md">
            <Network className="w-5 h-5 text-[#20C6B6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-[#101A2B] tracking-tight">
                Live AI Workspace
              </h1>
              {backendHealth?.status === "healthy" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#20C6B6]/15 text-[#0B8A7E] text-[11px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20C6B6]"></span>
                  BACKEND ONLINE (PORT 8000)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F4B860]/20 text-[#B45309] text-[11px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F4B860]"></span>
                  BACKEND DEGRADED / OFFLINE
                </span>
              )}
            </div>
            <p className="text-xs text-[#64748B]">
              Coordinated A1 + A2 + Validation Support Pipeline · Deterministic NLP Grounding
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={fetchHealth}
            disabled={isCheckingHealth}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E3E8F0] hover:bg-[#F1F5F9] text-[#64748B] text-xs font-mono transition-colors disabled:opacity-50"
            title="Refresh backend health"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingHealth ? "animate-spin text-[#456BFA]" : ""}`} />
            <span>Health Check</span>
          </button>

          <button
            onClick={handleOpenConflictInspector}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E3E8F0] hover:bg-[#F1F5F9] text-[#64748B] text-xs font-mono transition-colors"
            title="Inspect Agent Disagreements & Conflicts"
          >
            <Scale className="w-3.5 h-3.5 text-amber-500" />
            <span>Conflict Inspector</span>
          </button>

          {executionResult && (
            <button
              onClick={() => setShowTraceModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#101A2B] hover:bg-[#1E2E48] text-white text-xs font-mono transition-colors shadow-sm"
            >
              <Code2 className="w-3.5 h-3.5 text-[#20C6B6]" />
              <span>Inspect Trace</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-[#101A2B] text-white text-xs sm:text-sm font-mono shadow-xl border border-white/10 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-[#20C6B6]"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Workspace Grid */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full grid grid-cols-1 xl:grid-cols-12 gap-6 items-start text-left">
        {/* ========================================================= */}
        {/* COLUMN 1: Query Console & Sample Presets (4 cols)        */}
        {/* ========================================================= */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Query Ingestion Panel */}
          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E3E8F0]">
              <span className="text-sm font-bold text-[#101A2B] flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-[#456BFA]" />
                Customer Query Console
              </span>
              <span className="text-[10px] font-mono text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E3E8F0]">
                {queryInput.length}/2000 chars
              </span>
            </div>

            <form onSubmit={handleExecuteQuery} className="flex flex-col gap-3">
              <textarea
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Enter a real customer inquiry (e.g. 'I want to cancel my order #98214')..."
                rows={4}
                maxLength={2000}
                className="w-full p-3 text-xs sm:text-sm font-mono rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] focus:outline-none focus:border-[#456BFA] focus:bg-white transition-colors resize-none leading-relaxed"
              />

              {/* Optional Customer Slots Accordion */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowSlotFields(!showSlotFields)}
                  className="text-xs text-[#456BFA] hover:text-[#3256e6] font-mono flex items-center gap-1"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{showSlotFields ? "Hide Optional Slots" : "+ Add Customer Slots (Order #, Amount)"}</span>
                </button>

                {showSlotFields && (
                  <div className="mt-2 p-3 rounded-xl border border-[#E3E8F0] bg-[#F8FAFC] flex flex-col gap-2 animate-in fade-in">
                    <span className="text-[10px] font-mono text-[#64748B] uppercase">
                      Explicit Customer / Parameter Slots
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Slot Name (e.g. Order Number)"
                        value={slotKey}
                        onChange={(e) => setSlotKey(e.target.value)}
                        className="p-2 text-xs font-mono rounded-lg border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#456BFA]"
                      />
                      <input
                        type="text"
                        placeholder="Slot Value (e.g. 98214)"
                        value={slotValue}
                        onChange={(e) => setSlotValue(e.target.value)}
                        className="p-2 text-xs font-mono rounded-lg border border-[#CBD5E1] bg-white focus:outline-none focus:border-[#456BFA]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {executionError && (
                <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{executionError}</span>
                </div>
              )}

              {/* Console Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <VoiceInputButton
                    onTranscribed={(spokenText) => {
                      setQueryInput(spokenText);
                    }}
                    disabled={isProcessing}
                  />
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#101A2B] font-mono transition-colors"
                  >
                    Clear Input
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !queryInput.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#456BFA] hover:bg-[#3256e6] text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Running Orchestrator...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Execute Pipeline</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Sample Presets Panel */}
          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E3E8F0]">
              <span className="text-xs font-bold text-[#101A2B] uppercase tracking-wider font-mono">
                Sample Test Presets ({SAMPLE_PRESETS.length})
              </span>
              <span className="text-[10px] text-[#64748B] font-mono">
                Populates console only
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {SAMPLE_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-[#456BFA] bg-[#456BFA]/5 shadow-sm"
                        : "border-[#E3E8F0] bg-[#F8FAFC] hover:border-[#CBD5E1]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-[#101A2B]">
                        {preset.label}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-[#E3E8F0] text-[#475569]">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-[#64748B] line-clamp-1">
                      "{preset.query}"
                    </p>
                    <span className="text-[10px] text-[#475569] mt-1 block">
                      Target Flow: {preset.expectedFlow}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2: Multi-Agent Processing & Intelligence (4 cols)  */}
        {/* ========================================================= */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Dynamic Adaptive Workflow Visualizer (Part 2) */}
          {executionResult?.workflow_execution && (
            <div className="bg-white border border-[#E3E8F0] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#E3E8F0]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    <GitFork className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-[#101A2B]">
                      Dynamic Workflow Formation
                    </h3>
                    <span className="text-[10px] text-[#64748B] font-mono">
                      Adaptive Team Architecture
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700">
                  {executionResult.workflow_execution.workflow_type}
                </span>
              </div>

              <p className="text-xs text-[#475569] leading-relaxed">
                {executionResult.workflow_execution.rationale}
              </p>

              {/* Planned Capabilities */}
              <div>
                <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider block mb-1.5 font-bold">
                  Active Capabilities ({executionResult.workflow_execution.planned_capabilities.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {executionResult.workflow_execution.planned_capabilities.map((cap) => (
                    <span
                      key={cap}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200"
                    >
                      ✓ {cap.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skipped Capabilities Toggle */}
              {Object.keys(executionResult.workflow_execution.skipped_capabilities || {}).length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowSkippedCapabilities(!showSkippedCapabilities)}
                    className="flex items-center justify-between w-full text-left text-[11px] font-mono text-slate-500 hover:text-slate-800"
                  >
                    <span>
                      Bypassed Capabilities ({Object.keys(executionResult.workflow_execution.skipped_capabilities).length})
                    </span>
                    {showSkippedCapabilities ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </button>

                  {showSkippedCapabilities && (
                    <div className="mt-2 space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      {Object.entries(executionResult.workflow_execution.skipped_capabilities).map(([cap, reason]) => (
                        <div key={cap} className="text-[10px] text-slate-600">
                          <span className="font-mono font-bold text-slate-700">{cap}: </span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Conflict Resolution Alert (Part 1) */}
          {executionResult?.conflict_record && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center font-bold text-xs">
                    <Scale className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-amber-950">
                      Agent Disagreement Resolved
                    </h3>
                    <span className="text-[10px] text-amber-800 font-mono">
                      {executionResult.conflict_record.conflict_type}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  executionResult.conflict_record.severity === "CRITICAL"
                    ? "bg-rose-100 text-rose-700"
                    : executionResult.conflict_record.severity === "HIGH"
                    ? "bg-amber-200 text-amber-800"
                    : "bg-blue-100 text-blue-800"
                }`}>
                  {executionResult.conflict_record.severity} SEVERITY
                </span>
              </div>

              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                {executionResult.conflict_record.description}
              </p>

              <div className="p-2.5 bg-white/80 rounded-lg border border-amber-200 text-xs flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-amber-800 uppercase font-bold">Deterministic Resolution</span>
                  <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                    {executionResult.conflict_record.resolution_action}
                  </span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {executionResult.conflict_record.resolution_explanation}
                </p>
              </div>
            </div>
          )}

          {/* Agent 1 Card: Intent Analyst */}
          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E8F0]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#456BFA]/10 text-[#456BFA] flex items-center justify-center font-bold text-xs font-mono">
                  A1
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#101A2B]">
                    A1 — Intent Analyst
                  </h3>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    Calibrated Multiclass Classification
                  </span>
                </div>
              </div>

              {a1Trace && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  a1Trace.processing_status === "SUCCESS"
                    ? "bg-[#20C6B6]/15 text-[#0B8A7E]"
                    : "bg-[#F4B860]/20 text-[#B45309]"
                }`}>
                  {a1Trace.processing_status} · {a1Trace.duration_ms.toFixed(1)}ms
                </span>
              )}
            </div>

            {executionResult ? (
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#E3E8F0]">
                  <span className="text-[#64748B]">Predicted Intent:</span>
                  <span className="font-mono font-bold text-[#101A2B]">
                    {executionResult.intent_prediction}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E3E8F0]">
                    <span className="text-[#64748B] block text-[10px]">Category</span>
                    <span className="font-mono font-bold text-[#456BFA]">
                      {executionResult.category}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E3E8F0]">
                    <span className="text-[#64748B] block text-[10px]">Calibrated Confidence</span>
                    <span className="font-mono font-bold text-[#0B8A7E]">
                      {(executionResult.calibrated_confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {executionResult.alternative_intents && executionResult.alternative_intents.length > 1 && (
                  <div className="mt-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B] block mb-1.5">
                      Ranked Alternatives &amp; Separation Margin ({(executionResult.margin * 100).toFixed(1)}%)
                    </span>
                    <div className="flex flex-col gap-1">
                      {executionResult.alternative_intents.slice(0, 3).map((alt) => (
                        <div key={alt.rank} className="flex items-center justify-between text-[11px] font-mono p-1.5 rounded bg-[#F8FAFC] border border-[#E3E8F0]">
                          <span className="text-[#334155]">
                            #{alt.rank} {alt.intent}
                          </span>
                          <span className="text-[#64748B]">
                            {(alt.probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#94A3B8] font-mono">
                Submit an inquiry to view live intent prediction and uncertainty margin.
              </div>
            )}
          </div>

          {/* Agent 2 Card: Response Specialist */}
          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E8F0]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#20C6B6]/10 text-[#0B8A7E] flex items-center justify-center font-bold text-xs font-mono">
                  A2
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#101A2B]">
                    A2 — Response Specialist
                  </h3>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    Contextual Retrieval &amp; Slot Parameterization
                  </span>
                </div>
              </div>

              {a2Trace && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  a2Trace.processing_status === "SUCCESS"
                    ? "bg-[#20C6B6]/15 text-[#0B8A7E]"
                    : a2Trace.processing_status === "SKIPPED"
                    ? "bg-[#94A3B8]/20 text-[#475569]"
                    : "bg-[#F4B860]/20 text-[#B45309]"
                }`}>
                  {a2Trace.processing_status} {a2Trace.duration_ms > 0 && `· ${a2Trace.duration_ms.toFixed(1)}ms`}
                </span>
              )}
            </div>

            {executionResult ? (
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E3E8F0]">
                    <span className="text-[#64748B] block text-[10px]">Retrieval Similarity</span>
                    <span className="font-mono font-bold text-[#101A2B]">
                      {executionResult.retrieval_similarity !== null
                        ? executionResult.retrieval_similarity.toFixed(4)
                        : "N/A (Skipped)"}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E3E8F0]">
                    <span className="text-[#64748B] block text-[10px]">Placeholder Status</span>
                    <span className={`font-mono font-bold ${
                      executionResult.placeholder_status === "resolved"
                        ? "text-[#0B8A7E]"
                        : "text-[#B45309]"
                    }`}>
                      {executionResult.placeholder_status || "N/A"}
                    </span>
                  </div>
                </div>

                {executionResult.source_example && (
                  <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E3E8F0] flex flex-col gap-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B]">
                      Matched Dataset Instruction:
                    </span>
                    <p className="text-[11px] font-mono text-[#334155] italic">
                      "{executionResult.source_example}"
                    </p>
                  </div>
                )}

                {executionResult.unresolved_placeholders && executionResult.unresolved_placeholders.length > 0 && (
                  <div className="p-2 rounded-lg bg-[#FFF8E6] border border-[#F4B860]/50 text-[11px]">
                    <span className="text-[#B45309] font-semibold block mb-0.5">
                      Required Missing Parameters:
                    </span>
                    <span className="font-mono text-[#78350F]">
                      {executionResult.unresolved_placeholders.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#94A3B8] font-mono">
                Retrieval similarity and matched dataset instructions will appear here.
              </div>
            )}
          </div>

          {/* Validation Agent Card */}
          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E8F0]">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#F4B860]/10 text-[#B45309] flex items-center justify-center font-bold text-xs font-mono">
                  VG
                </span>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-[#101A2B]">
                    Validation Agent Gate
                  </h3>
                  <span className="text-[10px] text-[#64748B] font-mono">
                    7-Point Safety &amp; Anti-Fabrication Audit
                  </span>
                </div>
              </div>

              {valTrace && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  valTrace.processing_status === "SUCCESS"
                    ? "bg-[#20C6B6]/15 text-[#0B8A7E]"
                    : "bg-[#F4B860]/20 text-[#B45309]"
                }`}>
                  {valTrace.processing_status} · {valTrace.duration_ms.toFixed(1)}ms
                </span>
              )}
            </div>

            {executionResult ? (
              <div className="flex flex-col gap-1.5">
                {executionResult.validation_checks.map((chk) => (
                  <div
                    key={chk.check_name}
                    className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E3E8F0] flex items-start gap-2 text-xs"
                  >
                    {chk.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-[#20C6B6] flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-[#F4B860] flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex flex-col">
                      <span className="font-mono font-bold text-[11px] text-[#101A2B]">
                        {chk.check_name}
                      </span>
                      <span className="text-[10px] text-[#64748B] leading-tight">
                        {chk.detail}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#94A3B8] font-mono">
                Validation checks (availability, domain boundary, slot hygiene) will render here.
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 3: Final Decision & Customer Response (4 cols)     */}
        {/* ========================================================= */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Final Orchestration Decision Banner */}
          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E8F0]">
              <span className="text-xs font-bold text-[#101A2B] uppercase tracking-wider font-mono">
                Orchestrator Decision
              </span>
              {executionResult && (
                <span className="text-[10px] font-mono text-[#64748B]">
                  Total: {executionResult.total_duration_ms.toFixed(1)}ms
                </span>
              )}
            </div>

            {executionResult ? (
              <div className="flex flex-col gap-2">
                <div className={`p-3 rounded-xl border text-xs font-mono font-bold ${
                  executionResult.final_decision.includes("PROCEED_AUTOMATED")
                    ? "bg-[#20C6B6]/10 border-[#20C6B6]/30 text-[#0B8A7E]"
                    : executionResult.final_decision.includes("NEED_SLOT_CLARIFICATION")
                    ? "bg-[#456BFA]/10 border-[#456BFA]/30 text-[#3256e6]"
                    : executionResult.final_decision.includes("ESCALATE_TO_HUMAN")
                    ? "bg-[#E87966]/15 border-[#E87966]/40 text-[#C53030]"
                    : "bg-[#F4B860]/15 border-[#F4B860]/40 text-[#B45309]"
                }`}>
                  {executionResult.final_decision}
                </div>

                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E3E8F0] text-[11px] text-[#64748B] leading-relaxed">
                  {executionResult.final_decision.includes("PROCEED_AUTOMATED") &&
                    "All confidence, similarity, and parameter verification gates passed cleanly. Response is approved for automated presentation."}
                  {executionResult.final_decision.includes("NEED_SLOT_CLARIFICATION") &&
                    "Intent is confident, but customer-specific information is missing. Enforcing polite clarification rather than hallucinating details."}
                  {executionResult.final_decision.includes("ESCALATE_TO_HUMAN") &&
                    "Escalation condition met. Customer inquiry context is tagged for handoff to a human representative."}
                  {executionResult.final_decision.includes("UNSUPPORTED") &&
                    "Query falls outside the 11 supported customer support categories. Rejecting politely to maintain safety boundaries."}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#94A3B8] font-mono">
                Awaiting query execution...
              </div>
            )}
          </div>

          {/* Final Customer-Facing Output */}
          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E8F0]">
              <span className="text-xs font-bold text-[#101A2B] uppercase tracking-wider font-mono">
                Generated Customer Response
              </span>
              {executionResult?.final_response && (
                <div className="flex items-center gap-2">
                  <SpeechPlaybackButton textToSpeak={executionResult.final_response} />
                  <button
                    onClick={handleCopyResponse}
                    className="inline-flex items-center gap-1 text-xs font-mono text-[#456BFA] hover:text-[#3256e6] transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#20C6B6]" />
                        <span className="text-[#20C6B6]">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {executionResult ? (
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] text-xs sm:text-sm text-[#1E293B] font-mono leading-relaxed whitespace-pre-wrap">
                {executionResult.final_response}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-[#94A3B8] font-mono bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1]">
                Final parameterized response will appear here once executed.
              </div>
            )}

            {/* Honest Webhook Integration Element (Not Fake Dispatch) */}
            <div className="pt-2 border-t border-[#E3E8F0] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-[#64748B]">
                <span className="font-mono">External Delivery:</span>
                <span className="text-[11px] font-mono bg-[#F1F5F9] px-2 py-0.5 rounded text-[#64748B]">
                  Webhook Not Configured
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-tight">
                No external webhook endpoint is registered for live dispatch. External delivery stays disabled to avoid simulating false network actions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. Real Agent Execution Trace Modal                      */}
      {/* ========================================================= */}
      {showTraceModal && executionResult && (
        <div className="fixed inset-0 z-50 bg-[#101A2B]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8F0] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E3E8F0] flex items-center justify-between bg-[#101A2B] text-white">
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-[#20C6B6]" />
                <div>
                  <h3 className="text-base font-bold tracking-tight">
                    Multi-Agent Pipeline Audit Trace
                  </h3>
                  <p className="text-xs text-white/60 font-mono">
                    Total Pipeline Duration: {executionResult.total_duration_ms.toFixed(2)} ms · 3 Coordinated Agents
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTraceModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Agent Traces List */}
            <div className="p-6 overflow-y-auto flex flex-col gap-6 text-left">
              {executionResult.complete_agent_trace.map((trace, idx) => (
                <div
                  key={trace.agent_name + idx}
                  className="p-4 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#E3E8F0]">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-[#101A2B] text-[#20C6B6] flex items-center justify-center text-[11px] font-mono font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-mono font-bold text-sm text-[#101A2B]">
                        {trace.agent_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-[#64748B]">
                        {trace.duration_ms.toFixed(2)} ms
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        trace.processing_status === "SUCCESS"
                          ? "bg-[#20C6B6]/20 text-[#0B8A7E]"
                          : trace.processing_status === "SKIPPED"
                          ? "bg-[#94A3B8]/20 text-[#475569]"
                          : "bg-[#F4B860]/20 text-[#B45309]"
                      }`}>
                        {trace.processing_status}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-[#334155] leading-relaxed">
                    <strong className="text-[#101A2B] font-semibold">Decision Reason:</strong>{" "}
                    {trace.decision_reason}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                    <div className="p-2.5 rounded-lg bg-white border border-[#E3E8F0] overflow-x-auto">
                      <span className="text-[#64748B] block mb-1 font-bold">Input Payload:</span>
                      <pre className="text-[#334155]">{JSON.stringify(trace.input_payload, null, 2)}</pre>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white border border-[#E3E8F0] overflow-x-auto">
                      <span className="text-[#64748B] block mb-1 font-bold">Output Payload:</span>
                      <pre className="text-[#334155]">{JSON.stringify(trace.output_payload, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#E3E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setShowTraceModal(false)}
                className="px-4 py-2 rounded-xl bg-[#101A2B] text-white text-xs font-mono font-semibold hover:bg-[#1E2E48] transition-colors"
              >
                Close Audit Trace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. Conflict Inspector Modal (Part 1)                      */}
      {/* ========================================================= */}
      {showConflictModal && (
        <div className="fixed inset-0 z-50 bg-[#101A2B]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8F0] rounded-2xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E3E8F0] flex items-center justify-between bg-[#101A2B] text-white">
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold tracking-tight">
                    Agent Disagreement &amp; Conflict Resolution Inspector
                  </h3>
                  <p className="text-xs text-white/60 font-mono">
                    Auditing inter-agent contradictions, evidence overrides, and safety gates
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowConflictModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
              {/* Conflicts List */}
              <div className="md:col-span-5 flex flex-col gap-2.5 border-r border-slate-200 pr-4">
                <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider mb-1">
                  Recorded Disagreements ({recentConflicts.length})
                </span>
                {recentConflicts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-mono bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No active agent conflicts detected yet. Submit an ambiguous query or mutate session slots to observe real conflict resolution.
                  </div>
                ) : (
                  recentConflicts.map((c) => (
                    <button
                      key={c.conflict_id}
                      onClick={() => setSelectedConflictDetail(c)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedConflictDetail?.conflict_id === c.conflict_id
                          ? "bg-amber-50/70 border-amber-400 shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] font-mono font-bold text-slate-800 truncate">
                          {c.conflict_type}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          c.severity === "CRITICAL"
                            ? "bg-rose-100 text-rose-700"
                            : c.severity === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {c.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {c.description}
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{c.affected_agents.join(" vs ")}</span>
                        <span>{c.resolution_action}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Conflict Detail View */}
              <div className="md:col-span-7 flex flex-col gap-4">
                {selectedConflictDetail ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {selectedConflictDetail.conflict_type}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">
                          ID: {selectedConflictDetail.conflict_id} · Trace: {selectedConflictDetail.trace_id}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                        {selectedConflictDetail.resolution_action}
                      </span>
                    </div>

                    <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-950">
                      <strong className="block mb-1 font-semibold">Conflict Description:</strong>
                      {selectedConflictDetail.description}
                    </div>

                    <div>
                      <span className="text-xs font-bold font-mono text-slate-500 uppercase tracking-wider block mb-1">
                        Contradictory Agent Outputs:
                      </span>
                      <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-xs overflow-x-auto max-h-48">
                        <pre>{JSON.stringify(selectedConflictDetail.agent_outputs, null, 2)}</pre>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex flex-col gap-1.5">
                      <strong className="font-semibold text-slate-900">Deterministic Evidence Arbitration:</strong>
                      <p className="leading-relaxed">
                        {selectedConflictDetail.resolution_explanation}
                      </p>
                      <div className="mt-1 pt-1.5 border-t border-slate-200 flex items-center gap-2 text-[10px] font-mono text-slate-500">
                        <span>Status: {selectedConflictDetail.resolution_status}</span>
                        <span>·</span>
                        <span>Retries Bounded: {selectedConflictDetail.retry_count}/1</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 font-mono bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Select a recorded conflict from the left panel to inspect outputs and evidence grounding.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-[#E3E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setShowConflictModal(false)}
                className="px-4 py-2 rounded-xl bg-[#101A2B] text-white text-xs font-mono font-semibold hover:bg-[#1E2E48] transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveWorkspace;
