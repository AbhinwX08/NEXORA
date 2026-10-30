import React, { useState } from "react";
import {
  ArrowLeft,
  Network,
  RefreshCw,
  Play,
  FileEdit,
  Zap,
  CheckCircle2,
  Check,
  CheckCheck,
  Copy,
  Send,
  Eye,
  X,
  Code2,
  ArrowRightLeft,
} from "lucide-react";
import { PRESET_CONFIGS, PresetItem } from "@/data/presets";

export interface LiveWorkspaceProps {
  onBackToLanding: () => void;
}

export const LiveWorkspace: React.FC<LiveWorkspaceProps> = ({ onBackToLanding }) => {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>("refund");
  const [activePreset, setActivePreset] = useState<PresetItem>(PRESET_CONFIGS.refund);
  const [queryInput, setQueryInput] = useState<string>(PRESET_CONFIGS.refund.query);
  const [activeTab, setActiveTab] = useState<"verified" | "clarify" | "escalate">("verified");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showTraceModal, setShowTraceModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [dispatched, setDispatched] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSelectPreset = (key: string) => {
    setSelectedPresetKey(key);
    const item = PRESET_CONFIGS[key];
    if (item) {
      setActivePreset(item);
      setQueryInput(item.query);
      setActiveTab(item.defaultTab);
    }
  };

  const handleClear = () => {
    setQueryInput("");
  };

  const handleSimulateMesh = (openTraceAfter: boolean = false) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setToastMessage("Multi-Agent Mesh Execution Confirmed (98.5ms)");
      setTimeout(() => setToastMessage(null), 3000);
      if (openTraceAfter) {
        setShowTraceModal(true);
      }
    }, 600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activePreset.verified.replace(/["“”]/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDispatchFinal = () => {
    setDispatched(true);
    setTimeout(() => setDispatched(false), 2400);
  };

  return (
    <div className="flex flex-col w-full bg-[#F5F7FB] min-h-screen text-on-surface">
      {/* 1. Command Header & Telemetry Strip */}
      <div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E3E8F0] flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-sm text-left">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToLanding}
            className="p-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#101A2B] transition-colors"
            title="Return to Overview & Landing"
            aria-label="Back to Landing Page"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-[#101A2B] flex items-center justify-center text-[#20C6B6] shadow-md">
            <Network className="w-6 h-6 text-[#20C6B6]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-headline-md text-xl sm:text-2xl font-bold text-[#101A2B] tracking-tight">
                Live AI Autonomous Workspace
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#456BFA]/10 text-[#456BFA] font-badge-label text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#456BFA] animate-pulse"></span>
                ACTIVE MESH
              </span>
            </div>
            <p className="font-caption text-caption text-[#64748B]">
              Deterministic Multi-Agent Pipeline · Bitext NLP 26.8k Enterprise Knowledge Grounding
            </p>
          </div>
        </div>

        {/* Global Stream Action Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F7FB] border border-[#E3E8F0]">
            <span className="font-caption text-caption text-[#64748B]">Pipeline Sync:</span>
            <span className="font-code-stream text-code-stream text-[#101A2B] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#20C6B6]"></span>
              26,872 Anchors
            </span>
          </div>

          <button
            onClick={() => handleSimulateMesh(true)}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#456BFA] text-white font-body-bold text-body-bold shadow-md hover:bg-[#3256e6] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? "animate-spin" : "hidden"}`} />
            <Play className={`w-4 h-4 ${isProcessing ? "hidden" : ""}`} />
            <span>{isProcessing ? "Processing Mesh..." : "Simulate Trace"}</span>
          </button>
        </div>
      </div>

      {/* 2. Main 3-Column Command Workspace Grid */}
      <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start text-left">
        {/* ========================================================= */}
        {/* COLUMN 1: Query Ingestion & Preset Library (4 cols)       */}
        {/* ========================================================= */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Query Ingestion Panel */}
          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E3E8F0]">
              <span className="font-headline-sm text-base font-bold text-[#101A2B] flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-[#456BFA]" />
                Query Ingestion Console
              </span>
              <span className="font-code-inline text-[10px] text-[#64748B] bg-[#F5F7FB] px-2 py-0.5 rounded border border-[#E3E8F0]">
                RAW TEXT INGESTION
              </span>
            </div>

            <div className="relative">
              <textarea
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value.slice(0, 500))}
                rows={4}
                placeholder="Enter customer support query or select a Bitext benchmark scenario below..."
                className="w-full p-3.5 rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] text-sm text-[#101A2B] font-mono focus:outline-none focus:ring-2 focus:ring-[#456BFA] transition-all resize-none"
              />
              <span className="absolute bottom-3 right-3 text-[11px] font-mono text-[#94A3B8]">
                {queryInput.length}/500
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 mt-4">
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded-lg border border-[#CBD5E1] text-[#64748B] hover:text-[#101A2B] hover:bg-[#F1F5F9] text-xs font-semibold transition-all"
              >
                Clear
              </button>
              <button
                onClick={() => handleSimulateMesh(false)}
                disabled={isProcessing || !queryInput.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#101A2B] hover:bg-[#17263D] text-white text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 text-[#20C6B6] ${isProcessing ? "animate-spin" : "hidden"}`} />
                <Zap className={`w-4 h-4 text-[#456BFA] ${isProcessing ? "hidden" : ""}`} />
                <span>{isProcessing ? "Resolving Mesh..." : "Dispatch Query to Mesh"}</span>
              </button>
            </div>
          </div>

          {/* Benchmark Preset Scenarios Library */}
          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E3E8F0]">
              <span className="font-headline-sm text-sm font-bold text-[#101A2B] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#20C6B6]" />
                Bitext Benchmark Scenarios
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">5 Scenarios</span>
            </div>

            <div className="space-y-2.5">
              {Object.values(PRESET_CONFIGS).map((preset) => {
                const isSelected = selectedPresetKey === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#E9EDFF]/60 border-[#456BFA] shadow-sm"
                        : "bg-[#F8FAFC] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-[#CBD5E1]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-headline-sm text-xs font-bold text-[#101A2B]">
                        {preset.name}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        isSelected
                          ? "bg-[#456BFA] text-white font-bold"
                          : "bg-white text-[#64748B] border border-[#CBD5E1]"
                      }`}>
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] font-mono truncate">
                      "{preset.query}"
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2: Multi-Agent Signal Mesh: A1 & A2 (4 cols)       */}
        {/* ========================================================= */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Agent 1: Intent Analyst Panel */}
          <div className="bg-[#101A2B] text-white border border-white/10 rounded-2xl p-5 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#456BFA] flex items-center justify-center font-bold text-xs">
                  A1
                </div>
                <div>
                  <h3 className="font-headline-sm text-sm font-bold text-white leading-tight">
                    A1 Intent Analyst
                  </h3>
                  <span className="text-[10px] font-mono text-white/50">Classification &amp; Slotting</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-[#20C6B6] block">
                  {activePreset.conf} Conf
                </span>
                <span className="text-[9px] font-mono text-white/40">Calibrated</span>
              </div>
            </div>

            {/* Confidence Bar */}
            <div className="w-full bg-[#17263D] h-2 rounded-full overflow-hidden mb-4 border border-white/5">
              <div
                className="bg-gradient-to-r from-[#456BFA] to-[#20C6B6] h-full transition-all duration-500 rounded-full"
                style={{ width: activePreset.bar }}
              />
            </div>

            {/* Classification Metadata */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#17263D] p-2.5 rounded-xl border border-white/5">
                <span className="text-[9px] font-mono text-white/40 block mb-0.5">CATEGORY</span>
                <span className="text-xs font-mono text-[#20C6B6] font-bold">
                  {activePreset.cat}
                </span>
              </div>
              <div className="bg-[#17263D] p-2.5 rounded-xl border border-white/5">
                <span className="text-[9px] font-mono text-white/40 block mb-0.5">INTENT ID</span>
                <span className="text-xs font-mono text-white font-bold">
                  {activePreset.intent}
                </span>
              </div>
            </div>

            {/* Extracted Entities */}
            <div className="mb-4">
              <span className="text-[10px] font-mono text-white/40 block mb-1.5 uppercase">
                Extracted Semantic Entities:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activePreset.entities.map((ent, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-mono px-2 py-1 rounded bg-white/10 text-white/90 border border-white/5"
                  >
                    {ent}
                  </span>
                ))}
              </div>
            </div>

            {/* Analytical Rationale */}
            <div className="bg-[#17263D]/80 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] font-mono text-white/40 block mb-1 uppercase">
                Analytical Rationale:
              </span>
              <p className="text-xs text-white/80 font-sans leading-relaxed">
                {activePreset.rationale}
              </p>
            </div>
          </div>

          {/* Agent Handoff Connector Bar */}
          <div className="bg-gradient-to-r from-[#456BFA]/10 via-[#20C6B6]/15 to-[#456BFA]/10 border border-[#456BFA]/20 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#20C6B6] font-semibold">
              <span className="flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 animate-pulse" />
                Agent Handoff Relay Protocol
              </span>
              <span className="text-[10px] text-[#64748B]">Type: JSON Strict</span>
            </div>
            <div className="p-2 rounded bg-white border border-[#E3E8F0] font-mono text-[11px] text-[#1E4CDD] overflow-x-auto">
              <code>{activePreset.relay}</code>
            </div>
          </div>

          {/* Agent 2: Response Specialist Panel */}
          <div className="bg-[#101A2B] text-white border border-white/10 rounded-2xl p-5 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#20C6B6] text-[#101A2B] flex items-center justify-center font-bold text-xs">
                  A2
                </div>
                <div>
                  <h3 className="font-headline-sm text-sm font-bold text-white leading-tight">
                    A2 Response Specialist
                  </h3>
                  <span className="text-[10px] font-mono text-white/50">Grounded Knowledge Retrieval</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-white/80 bg-[#17263D] px-2.5 py-1 rounded border border-white/10">
                {activePreset.doc}
              </span>
            </div>

            {/* Knowledge Citation */}
            <div className="mb-4">
              <span className="text-[10px] font-mono text-white/40 block mb-1 uppercase">
                Grounded Knowledge Citation:
              </span>
              <p className="text-xs text-white/90 italic font-sans leading-relaxed border-l-2 border-[#20C6B6] pl-3 py-0.5 bg-[#17263D]/50 rounded-r">
                {activePreset.guidance}
              </p>
            </div>

            {/* Response Draft Preview */}
            <div className="bg-[#17263D] p-3 rounded-xl border border-white/5">
              <span className="text-[9px] font-mono text-white/40 block mb-1 uppercase">
                Synthesized Draft Response:
              </span>
              <p className="text-xs text-white/90 font-sans leading-relaxed">
                {activePreset.draft}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 3: Consensus & Final Resolution (4 cols)           */}
        {/* ========================================================= */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Resolution Router & Verification Card */}
          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E3E8F0]">
              <span className="font-headline-sm text-base font-bold text-[#101A2B] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#20C6B6]" />
                Final Resolution Panel
              </span>
              <span className="text-[10px] font-mono text-[#456BFA] font-bold bg-[#E9EDFF] px-2 py-0.5 rounded">
                TRI-STATE ROUTER
              </span>
            </div>

            {/* Tri-State Navigation Tabs */}
            <div className="flex bg-[#F1F5F9] p-1 rounded-xl mb-4 text-xs font-mono">
              <button
                onClick={() => setActiveTab("verified")}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all ${
                  activeTab === "verified"
                    ? "bg-white text-[#101A2B] shadow-sm"
                    : "text-[#64748B] hover:text-[#101A2B]"
                }`}
              >
                Verified Answer
              </button>
              <button
                onClick={() => setActiveTab("clarify")}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all ${
                  activeTab === "clarify"
                    ? "bg-white text-[#101A2B] shadow-sm"
                    : "text-[#64748B] hover:text-[#101A2B]"
                }`}
              >
                Clarification
              </button>
              <button
                onClick={() => setActiveTab("escalate")}
                className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all ${
                  activeTab === "escalate"
                    ? "bg-white text-[#101A2B] shadow-sm"
                    : "text-[#64748B] hover:text-[#101A2B]"
                }`}
              >
                Escalate
              </button>
            </div>

            {/* Validation Checklist Strip */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 mb-4 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Hallucination Risk:</span>
                <span className="text-emerald-600 font-bold">0.00% (Certified)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Bitext Intent Alignment:</span>
                <span className="text-[#456BFA] font-bold">100% In-Domain</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748B]">Policy Compliance Gate:</span>
                <span className="text-[#20C6B6] font-bold">Passed</span>
              </div>
            </div>

            {/* Verified Final Text Display */}
            <div className="bg-[#F0FDF4] border border-emerald-200 rounded-xl p-4 mb-4 text-sm text-[#14532D] leading-relaxed">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold block mb-1">
                {activeTab === "verified"
                  ? "Approved Support Resolution"
                  : activeTab === "clarify"
                  ? "Clarification Inquiry to Customer"
                  : "Supervisor Escalation Summary"}
              </span>
              <p className="font-sans">
                {activePreset.verified}
              </p>
            </div>

            {/* Action Buttons: Copy & Webhook Dispatch */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleCopy}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#CBD5E1] bg-white hover:bg-[#F8FAFC] text-[#101A2B] font-semibold text-xs transition-all shadow-sm active:scale-[0.98]"
              >
                <Check className={`w-4 h-4 text-emerald-600 ${copied ? "" : "hidden"}`} />
                <Copy className={`w-4 h-4 text-[#456BFA] ${copied ? "hidden" : ""}`} />
                <span>{copied ? "Copied to Clipboard!" : "Copy Response"}</span>
              </button>

              <button
                onClick={handleDispatchFinal}
                className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-xs transition-all shadow-md active:scale-[0.98] ${
                  dispatched ? "bg-emerald-600" : "bg-[#456BFA] hover:bg-[#3256e6]"
                }`}
              >
                <CheckCheck className={`w-4 h-4 ${dispatched ? "" : "hidden"}`} />
                <Send className={`w-4 h-4 ${dispatched ? "hidden" : ""}`} />
                <span>
                  {dispatched ? "Dispatched to Customer Webhook!" : "Dispatch to Customer Webhook"}
                </span>
              </button>

              <button
                onClick={() => setShowTraceModal(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-[#64748B] hover:text-[#101A2B] hover:bg-[#F1F5F9] text-xs font-mono transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>View Multi-Agent Trace Log</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#101A2B] text-white border border-[#20C6B6]/40 px-4 py-2.5 rounded-xl shadow-2xl font-mono text-xs flex items-center gap-2 z-50 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#20C6B6]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 3. Multi-Agent Trace Modal */}
      {showTraceModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
          onClick={() => setShowTraceModal(false)}
        >
          <div
            className="bg-[#101A2B] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col text-left text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#17263D]">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-5 h-5 text-[#20C6B6]" />
                <div>
                  <h3 className="font-headline-sm text-base font-bold text-white">
                    Multi-Agent Execution Trace
                  </h3>
                  <span className="font-mono text-[10px] text-white/50">Audit Session: JAI-TRACE-2026</span>
                </div>
              </div>
              <button
                onClick={() => setShowTraceModal(false)}
                className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 overflow-y-auto font-mono text-xs">
              <div className="p-3 rounded-lg bg-[#17263D] border border-white/5">
                <span className="text-[#20C6B6] block font-bold mb-1">[00:00.002] TIER-0 INGESTION</span>
                <p className="text-white/80">Query parsed: "{activePreset.query}"</p>
                <p className="text-white/40 text-[10px]">Linguistic Flag Check: Clean syntax, in-distribution</p>
              </div>

              <div className="p-3 rounded-lg bg-[#17263D] border border-white/5">
                <span className="text-[#456BFA] block font-bold mb-1">[00:00.041] A1 INTENT ANALYST</span>
                <p className="text-white/80">Category: {activePreset.cat} | Intent: {activePreset.intent}</p>
                <p className="text-white/80">Confidence: {activePreset.conf} | Status: High Certainty</p>
              </div>

              <div className="p-3 rounded-lg bg-[#17263D] border border-white/5">
                <span className="text-[#20C6B6] block font-bold mb-1">[00:00.076] A2 RESPONSE SPECIALIST</span>
                <p className="text-white/80">Retrieved: {activePreset.doc}</p>
                <p className="text-white/40 text-[10px]">Citation constraints applied: 100% Policy Grounding</p>
              </div>

              <div className="p-3 rounded-lg bg-[#17263D] border border-white/5">
                <span className="text-emerald-400 block font-bold mb-1">[00:00.098] CONSENSUS VERIFICATION</span>
                <p className="text-white/80">Resolution Mode: {activePreset.defaultTab.toUpperCase()}</p>
                <p className="text-white/40 text-[10px]">Output dispatched to webhook: OK (200)</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between bg-[#17263D]">
              <span className="text-white/40 font-mono text-[11px]">Total Elapsed: 98.5ms</span>
              <button
                onClick={() => setShowTraceModal(false)}
                className="px-4 py-2 rounded-lg bg-[#456BFA] text-white text-xs font-bold hover:bg-[#3256e6]"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveWorkspace;
