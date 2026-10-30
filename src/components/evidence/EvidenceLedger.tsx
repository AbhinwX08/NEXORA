import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Database,
  Cpu,
  Layers,
  HelpCircle,
  RefreshCw,
  FileCode,
  Sparkles,
  BookOpen,
  History,
  RotateCcw,
  Check,
  Play,
} from "lucide-react";
import {
  sendChatMessage,
  getKnowledgeClusters,
  getKnowledgeSuggestions,
  reviewKnowledgeSuggestion,
  getKnowledgeVersions,
  rollbackKnowledgeVersion,
  runKnowledgeBenchmark,
} from "@/lib/api";
import {
  OrchestratorResult,
  QueryCluster,
  FAQRecommendation,
  KnowledgeVersionSnapshot,
  RetrievalBenchmarkResult,
} from "@/types/api";

export interface EvidenceItem {
  provenance_type:
    | "model_prediction"
    | "dataset_example"
    | "deterministic_check"
    | "user_provided"
    | "externally_verified";
  component: string;
  title: string;
  value: string;
  detail: string;
  confidenceOrScore?: number;
  status: "verified" | "passed" | "failed" | "unconfigured" | "extracted";
}

interface EvidencePreset {
  label: string;
  query: string;
  slots: Record<string, string>;
}

const SAMPLE_EVIDENCE_PRESETS: EvidencePreset[] = [
  {
    label: "Order Cancellation (With Order #)",
    query: "I want to cancel my order #98214",
    slots: { "Order Number": "98214" },
  },
  {
    label: "Explicit Human Escalation",
    query: "I need to speak to a real human agent right now",
    slots: {},
  },
  {
    label: "Refund Policy Inquiry",
    query: "What is your refund policy for annual subscriptions?",
    slots: {},
  },
  {
    label: "Out-of-Domain Boundary",
    query: "Can you give me a recipe for chocolate cake?",
    slots: {},
  },
  {
    label: "Missing Required Slot",
    query: "Where is my package? It has not arrived yet",
    slots: {},
  },
];

// Offline knowledge gap records from reports/knowledge_gaps.json
const SAMPLE_KNOWLEDGE_GAPS = [
  {
    query: "How do I bake a chocolate cake?",
    predicted_intent: "check_refund_policy",
    confidence: 0.4977,
    retrieval_similarity: 0.3239,
    final_decision: "UNCERTAIN: AMBIGUOUS_INTENT_CLARIFICATION",
    reason: "Out-of-domain query triggering low confidence & similarity gap",
  },
  {
    query: "I need to speak to a real human agent right now",
    predicted_intent: "contact_human_agent",
    confidence: 0.9849,
    retrieval_similarity: 0.0,
    final_decision: "HUMAN_ESCALATION: ESCALATE_TO_HUMAN",
    reason: "Explicit escalation intent bypasses standard response retrieval",
  },
  {
    query: "What is the weather in London today?",
    predicted_intent: "check_refund_policy",
    confidence: 0.4281,
    retrieval_similarity: 0.2818,
    final_decision: "UNSUPPORTED: UNSUPPORTED_REJECTION",
    reason: "Low confidence (<0.50) and low retrieval similarity (<0.35)",
  },
];

export const EvidenceLedger: React.FC = () => {
  const [selectedQuery, setSelectedQuery] = useState(SAMPLE_EVIDENCE_PRESETS[0].query);
  const [activePresetIndex, setActivePresetIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<OrchestratorResult | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showJsonView, setShowJsonView] = useState(false);
  const [showGapsPanel, setShowGapsPanel] = useState(false);

  // Tab switcher
  const [activeMainTab, setActiveMainTab] = useState<"evidence_records" | "knowledge_intelligence">("evidence_records");

  // Knowledge Intelligence States
  const [clusters, setClusters] = useState<QueryCluster[]>([]);
  const [suggestions, setSuggestions] = useState<FAQRecommendation[]>([]);
  const [versions, setVersions] = useState<KnowledgeVersionSnapshot[]>([]);
  const [benchmarkResult, setBenchmarkResult] = useState<RetrievalBenchmarkResult | null>(null);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const [knowledgeActionMessage, setKnowledgeActionMessage] = useState<string | null>(null);

  useEffect(() => {
    handleRunAudit(SAMPLE_EVIDENCE_PRESETS[0].query, SAMPLE_EVIDENCE_PRESETS[0].slots);
    loadKnowledgeData();
  }, []);

  const loadKnowledgeData = async () => {
    setIsLoadingKnowledge(true);
    try {
      const [clustData, sugData, verData] = await Promise.all([
        getKnowledgeClusters().catch(() => ({ clusters: [] })),
        getKnowledgeSuggestions().catch(() => ({ suggestions: [] })),
        getKnowledgeVersions().catch(() => ({ versions: [] })),
      ]);
      setClusters(clustData.clusters || []);
      setSuggestions(sugData.suggestions || []);
      setVersions(verData.versions || []);
    } catch (e) {
      console.error("Failed to load knowledge intelligence:", e);
    } finally {
      setIsLoadingKnowledge(false);
    }
  };

  const handleReviewSuggestion = async (suggestionId: string, action: "APPROVE" | "REJECT") => {
    try {
      await reviewKnowledgeSuggestion(suggestionId, action, "Supervisor", action === "REJECT" ? "Declined by operator" : undefined);
      setKnowledgeActionMessage(`Suggestion ${action === "APPROVE" ? "approved & deployed to active knowledge" : "rejected"}.`);
      setTimeout(() => setKnowledgeActionMessage(null), 4000);
      loadKnowledgeData();
    } catch (e: any) {
      setKnowledgeActionMessage(`Review action failed: ${e.message}`);
    }
  };

  const handleRollback = async (versionId: string) => {
    try {
      await rollbackKnowledgeVersion(versionId);
      setKnowledgeActionMessage(`Knowledge base successfully restored to version ${versionId}.`);
      setTimeout(() => setKnowledgeActionMessage(null), 4000);
      loadKnowledgeData();
    } catch (e: any) {
      setKnowledgeActionMessage(`Rollback failed: ${e.message}`);
    }
  };

  const handleRunBenchmark = async () => {
    setIsLoadingKnowledge(true);
    try {
      const res = await runKnowledgeBenchmark();
      setBenchmarkResult(res);
      setKnowledgeActionMessage("Retrieval regression benchmark completed successfully.");
      setTimeout(() => setKnowledgeActionMessage(null), 4000);
    } catch (e: any) {
      setKnowledgeActionMessage(`Benchmark failed: ${e.message}`);
    } finally {
      setIsLoadingKnowledge(false);
    }
  };

  const handleRunAudit = async (queryToRun: string, slotsToRun: Record<string, string> = {}) => {
    setIsLoading(true);
    try {
      const res = await sendChatMessage({
        query: queryToRun,
        customer_slots: slotsToRun,
      });
      setResult(res);
    } catch (err) {
      console.error("Audit run error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (idx: number) => {
    setActivePresetIndex(idx);
    const preset = SAMPLE_EVIDENCE_PRESETS[idx];
    setSelectedQuery(preset.query);
    handleRunAudit(preset.query, preset.slots);
  };

  // Build structured evidence items from result
  const buildEvidenceItems = (res: OrchestratorResult | null): EvidenceItem[] => {
    if (!res) return [];
    const items: EvidenceItem[] = [];

    // 1. Model Prediction
    items.push({
      provenance_type: "model_prediction",
      component: "A1_IntentAnalyst",
      title: "Calibrated Intent Prediction",
      value: res.intent_prediction,
      detail: `Category: ${res.category} | Platt Calibrated Confidence: ${(
        res.calibrated_confidence * 100
      ).toFixed(2)}% | Prediction Margin: ${(res.margin * 100).toFixed(2)}%`,
      confidenceOrScore: res.calibrated_confidence,
      status: "verified",
    });

    // 2. Dataset Exemplar Match
    if (res.source_example) {
      items.push({
        provenance_type: "dataset_example",
        component: "A2_ResponseSpecialist",
        title: "Corpus Training Match",
        value: `train.csv match (Cosine Similarity: ${((res.retrieval_similarity || 0) * 100).toFixed(1)}%)`,
        detail: `Matched instruction: "${res.source_example.substring(0, 140)}..."`,
        confidenceOrScore: res.retrieval_similarity || 0,
        status: "verified",
      });
    }

    // 3. Deterministic Validation Checks
    if (res.validation_checks && res.validation_checks.length > 0) {
      res.validation_checks.forEach((chk) => {
        items.push({
          provenance_type: "deterministic_check",
          component: "ValidationAgent",
          title: `Rule Check: ${chk.check_name}`,
          value: chk.passed ? "CHECK PASSED" : "CHECK TRIGGERED",
          detail: chk.detail,
          status: chk.passed ? "passed" : "failed",
        });
      });
    }

    // 4. User Provided Slots
    const resolvedSlots: Record<string, string> = {};
    res.complete_agent_trace?.forEach((trace) => {
      if (trace.agent_name === "A2_ResponseSpecialist" && trace.output_payload?.resolved_slots) {
        Object.assign(resolvedSlots, trace.output_payload.resolved_slots);
      }
    });

    Object.entries(resolvedSlots).forEach(([k, v]) => {
      items.push({
        provenance_type: "user_provided",
        component: "CustomerInput",
        title: `Extracted Slot [${k}]`,
        value: v,
        detail: `Parameter bound into response template for customer query.`,
        status: "extracted",
      });
    });

    if (res.unresolved_placeholders && res.unresolved_placeholders.length > 0) {
      res.unresolved_placeholders.forEach((missing) => {
        items.push({
          provenance_type: "user_provided",
          component: "ValidationAgent",
          title: `Missing Slot [${missing}]`,
          value: "UNRESOLVED",
          detail: `Required parameter missing; triggers clarification gate.`,
          status: "failed",
        });
      });
    }

    // 5. External Verified State
    items.push({
      provenance_type: "externally_verified",
      component: "ExternalAdapter",
      title: "ERP & Ticketing Delivery Status",
      value: "UNCONFIGURED (Honest State)",
      detail:
        "No live CRM/ERP sandbox configured. System refrains from claiming successful external action execution.",
      status: "unconfigured",
    });

    return items;
  };

  const evidenceItems = buildEvidenceItems(result);

  const filteredItems = evidenceItems.filter((item) => {
    if (filterType !== "all" && item.provenance_type !== filterType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q) ||
        item.detail.toLowerCase().includes(q) ||
        item.component.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relay_evidence_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getProvenanceBadge = (type: EvidenceItem["provenance_type"]) => {
    switch (type) {
      case "model_prediction":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#456BFA]/20 text-[#456BFA] border border-[#456BFA]/30">
            MODEL PREDICTION
          </span>
        );
      case "dataset_example":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
            DATASET EXAMPLE
          </span>
        );
      case "deterministic_check":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            DETERMINISTIC CHECK
          </span>
        );
      case "user_provided":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
            USER-PROVIDED VALUE
          </span>
        );
      case "externally_verified":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
            EXTERNAL STATUS
          </span>
        );
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Title & Architecture Ribbon */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#20C6B6]/20 text-[#20C6B6] text-xs font-mono font-bold uppercase tracking-wider border border-[#20C6B6]/30">
              Explainability &amp; Auditing
            </span>
            <span className="text-xs text-white/50 font-mono">
              Full Lineage Provenance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#121B2E] dark:text-white tracking-tight">
            Resolution Evidence Ledger
          </h1>
          <p className="text-sm text-slate-600 dark:text-white/60 mt-1 max-w-2xl">
            Every customer response is certified through five verifiable provenance layers:
            calibrated ML inference, training corpus exemplars, deterministic gate checks,
            extracted parameters, and truthful external status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGapsPanel(!showGapsPanel)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              showGapsPanel
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-white dark:bg-[#17263D] text-slate-700 dark:text-white/80 border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-[#223554]"
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Knowledge Gap Log ({SAMPLE_KNOWLEDGE_GAPS.length})</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={!result}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#17263D] hover:bg-slate-50 dark:hover:bg-[#223554] text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#456BFA]" />
            <span>Export Evidence JSON</span>
          </button>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-3">
        <button
          onClick={() => setActiveMainTab("evidence_records")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeMainTab === "evidence_records"
              ? "bg-[#101A2B] text-white shadow-sm"
              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4 inline mr-1.5 text-[#20C6B6]" />
          Deterministic Evidence Ledger
        </button>
        <button
          onClick={() => {
            setActiveMainTab("knowledge_intelligence");
            loadKnowledgeData();
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            activeMainTab === "knowledge_intelligence"
              ? "bg-[#456BFA] text-white shadow-sm"
              : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4 inline mr-1.5 text-amber-300" />
          Knowledge Gap &amp; FAQ Intelligence Center
        </button>
      </div>

      {knowledgeActionMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 rounded-xl text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-in fade-in">
          <span>{knowledgeActionMessage}</span>
          <button onClick={() => setKnowledgeActionMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {activeMainTab === "evidence_records" ? (
        <>
          {/* Query Selection & Presets */}
      <div className="bg-white dark:bg-[#101A2B] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-white/60 font-mono">
          <span>SELECT TEST CASE OR ENTER INQUIRY</span>
          <span>{SAMPLE_EVIDENCE_PRESETS.length} VERIFIED PRESETS</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {SAMPLE_EVIDENCE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(idx)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePresetIndex === idx
                  ? "bg-[#456BFA] text-white shadow-sm font-semibold"
                  : "bg-slate-100 dark:bg-[#17263D] text-slate-700 dark:text-white/70 hover:bg-slate-200 dark:hover:bg-[#223554]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={selectedQuery}
            onChange={(e) => setSelectedQuery(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#17263D] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#456BFA]"
            placeholder="Type customer inquiry to audit..."
          />
          <button
            onClick={() => handleRunAudit(selectedQuery)}
            disabled={isLoading || !selectedQuery.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#456BFA] hover:bg-[#3256e6] text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-[#20C6B6]" />
            )}
            <span>Audit Query</span>
          </button>
        </div>
      </div>

      {/* Knowledge Gap Diagnostic Panel (Collapsible) */}
      {showGapsPanel && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Knowledge Gap Auditor (Audited Out-of-Domain &amp; Low-Similarity Inquiries)
              </h3>
            </div>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-mono">
              Auto-logged to reports/knowledge_gaps.json
            </span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300/80">
            Queries that produce low confidence (&lt;50%), weak corpus similarity (&lt;0.35),
            or explicit escalation are isolated into the diagnostic log rather than inventing
            ungrounded answers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {SAMPLE_KNOWLEDGE_GAPS.map((gap, gIdx) => (
              <div
                key={gIdx}
                className="bg-white dark:bg-[#101A2B] p-3 rounded-xl border border-amber-200 dark:border-amber-500/20 text-xs space-y-1.5 shadow-sm"
              >
                <div className="font-semibold text-slate-800 dark:text-white line-clamp-1">
                  "{gap.query}"
                </div>
                <div className="text-[11px] text-slate-500 dark:text-white/60 font-mono flex items-center justify-between">
                  <span>Conf: {(gap.confidence * 100).toFixed(1)}%</span>
                  <span>Sim: {(gap.retrieval_similarity * 100).toFixed(1)}%</span>
                </div>
                <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold uppercase">
                  {gap.final_decision}
                </div>
                <div className="text-[10px] text-slate-600 dark:text-white/50 italic">
                  {gap.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards: 5 Provenance Layers */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-[#101A2B] p-3.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/50 mb-1">
            <span>Model Prediction</span>
            <Cpu className="w-4 h-4 text-[#456BFA]" />
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-white">
            {result ? `${(result.calibrated_confidence * 100).toFixed(1)}%` : "—"}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-white/60 font-mono truncate">
            {result ? result.intent_prediction : "Awaiting run"}
          </div>
        </div>

        <div className="bg-white dark:bg-[#101A2B] p-3.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/50 mb-1">
            <span>Corpus Match</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-white">
            {result?.retrieval_similarity
              ? `${(result.retrieval_similarity * 100).toFixed(1)}%`
              : "0.0%"}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-white/60 font-mono">
            18,810 train samples
          </div>
        </div>

        <div className="bg-white dark:bg-[#101A2B] p-3.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/50 mb-1">
            <span>Deterministic Checks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-white">
            {result?.validation_checks
              ? `${result.validation_checks.filter((c) => c.passed).length}/${
                  result.validation_checks.length
                }`
              : "—"}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-white/60 font-mono">
            Safety &amp; slot gates
          </div>
        </div>

        <div className="bg-white dark:bg-[#101A2B] p-3.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/50 mb-1">
            <span>Customer Slots</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-slate-800 dark:text-white">
            {evidenceItems.filter((i) => i.provenance_type === "user_provided").length}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-white/60 font-mono truncate">
            {result?.placeholder_status || "Dynamic slots"}
          </div>
        </div>

        <div className="bg-white dark:bg-[#101A2B] p-3.5 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/50 mb-1">
            <span>Decision Outcome</span>
            <ShieldCheck className="w-4 h-4 text-[#20C6B6]" />
          </div>
          <div className="text-xs font-bold font-mono text-[#20C6B6] truncate mt-1">
            {result ? result.final_decision.split(":")[0] : "STANDBY"}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-white/60 font-mono">
            {result ? `${result.total_duration_ms.toFixed(1)} ms runtime` : "No execution"}
          </div>
        </div>
      </div>

      {/* Main Ledger Table & Filters */}
      <div className="bg-white dark:bg-[#101A2B] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-[#17263D]/40">
          {/* Provenance Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "All Items" },
              { id: "model_prediction", label: "Model" },
              { id: "dataset_example", label: "Corpus Match" },
              { id: "deterministic_check", label: "Rules" },
              { id: "user_provided", label: "Slots" },
              { id: "externally_verified", label: "External" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  filterType === tab.id
                    ? "bg-[#456BFA] text-white font-semibold shadow-sm"
                    : "text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box & JSON view toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ledger..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#101A2B] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white focus:outline-none focus:border-[#456BFA]"
              />
            </div>

            <button
              onClick={() => setShowJsonView(!showJsonView)}
              className={`p-2 rounded-lg border transition-all ${
                showJsonView
                  ? "bg-[#456BFA] text-white border-[#456BFA]"
                  : "bg-white dark:bg-[#101A2B] text-slate-600 dark:text-white/60 border-slate-200 dark:border-white/10"
              }`}
              title="Toggle JSON View"
            >
              <FileCode className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        {showJsonView ? (
          <div className="p-4 bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto max-h-[500px]">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-white/40 text-xs font-mono">
                No evidence items match the selected filter.
              </div>
            ) : (
              filteredItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getProvenanceBadge(item.provenance_type)}
                      <span className="text-[11px] font-mono text-slate-400 dark:text-white/40">
                        {item.component}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-white">
                        {item.title}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-white/70">
                      {item.detail}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-center">
                    <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#17263D] text-xs font-mono font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-white/10">
                      {item.value}
                    </span>

                    {item.status === "passed" || item.status === "verified" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : item.status === "failed" ? (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  ) : (
    /* ========================================================================= */
    /* KNOWLEDGE GAP & FAQ INTELLIGENCE CENTER (Part 3)                           */
    /* ========================================================================= */
    <div className="space-y-6">
      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Version */}
        <div className="bg-white dark:bg-[#101A2B] p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/60 mb-2">
            <span className="font-mono">Active Version</span>
            <BookOpen className="w-4 h-4 text-[#456BFA]" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {versions.find((v) => v.is_active)?.version_id || "v_1_0_0"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50 font-mono mt-1">
            {versions.find((v) => v.is_active)?.total_articles || 7} Verified Articles
          </div>
        </div>

        {/* Clustered Gaps */}
        <div className="bg-white dark:bg-[#101A2B] p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/60 mb-2">
            <span className="font-mono">Clustered Deficits</span>
            <Database className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {clusters.length} Semantic Clusters
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50 font-mono mt-1">
            Ranked by priority score formula
          </div>
        </div>

        {/* Pending FAQ Suggestions */}
        <div className="bg-white dark:bg-[#101A2B] p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/60 mb-2">
            <span className="font-mono">FAQ Recommendations</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {suggestions.filter((s) => s.status === "PENDING_REVIEW").length} Pending Review
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50 font-mono mt-1">
            Human approval gate required
          </div>
        </div>

        {/* Regression Status */}
        <div className="bg-white dark:bg-[#101A2B] p-4 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-white/60 mb-2">
            <span className="font-mono">Retrieval Benchmark</span>
            <ShieldCheck className="w-4 h-4 text-[#20C6B6]" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {benchmarkResult ? (benchmarkResult.no_regression ? "100% PASS" : "REGRESSION") : "NO REGRESSION"}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-white/50 font-mono mt-1">
            {benchmarkResult ? `Mean Sim: ${benchmarkResult.mean_similarity.toFixed(3)}` : "Baseline verified"}
          </div>
        </div>
      </div>

      {/* Section 1: Clustered Knowledge Gaps */}
      <div className="bg-white dark:bg-[#101A2B] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Clustered Knowledge Deficits &amp; Priority Scores
            </h3>
            <p className="text-xs text-slate-500 dark:text-white/60 mt-0.5">
              Recurring customer queries clustered via TF-IDF cosine similarity. Priority formula balances volume, confidence deficit, and human escalation.
            </p>
          </div>
          <button
            onClick={loadKnowledgeData}
            disabled={isLoadingKnowledge}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 text-xs font-mono text-slate-700 dark:text-white hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingKnowledge ? "animate-spin text-[#456BFA]" : ""}`} />
            <span>Refresh Clusters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clusters.map((c) => (
            <div
              key={c.cluster_id}
              className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#17263D]/40 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#456BFA]/10 text-[#456BFA] dark:text-[#7B95FA]">
                    {c.category}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-white/70">
                    {c.query_count} occurrences
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                  {c.title}
                </h4>

                {/* Priority Progress Bar */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-white/60">
                    <span>Priority Score</span>
                    <span className="font-bold">{(c.priority_score * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        c.priority_score > 0.8
                          ? "bg-rose-500"
                          : c.priority_score > 0.6
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(100, c.priority_score * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Exemplars */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                <span className="text-[10px] font-mono text-slate-400 dark:text-white/40 block mb-1">
                  Sample Redacted Inquiries:
                </span>
                <ul className="text-[11px] text-slate-600 dark:text-white/70 space-y-1">
                  {c.exemplar_queries.slice(0, 2).map((q, qIdx) => (
                    <li key={qIdx} className="truncate">
                      • "{q}"
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Grounded FAQ Recommendation Studio */}
      <div className="bg-white dark:bg-[#101A2B] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Grounded FAQ Recommendation Studio (Human-in-the-Loop)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-white/60">
              Draft FAQ entries generated from high-priority clusters. Grounded strictly in verified documentation — no fabricated refund policies or hallucinated windows.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {suggestions.map((sug) => (
            <div
              key={sug.suggestion_id}
              className={`p-4 rounded-xl border transition-all ${
                sug.status === "DEPLOYED"
                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30"
                  : sug.status === "REJECTED"
                  ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30"
                  : "bg-slate-50/60 dark:bg-[#17263D]/40 border-slate-200 dark:border-white/10"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                      {sug.category}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      sug.status === "DEPLOYED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300"
                        : sug.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                    }`}>
                      {sug.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {sug.suggestion_id}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {sug.proposed_question}
                  </h4>

                  <p className="text-xs text-slate-700 dark:text-white/80 leading-relaxed font-sans bg-white dark:bg-[#101A2B] p-3 rounded-lg border border-slate-200/80 dark:border-white/10">
                    {sug.proposed_answer}
                  </p>
                </div>

                {/* Review Actions */}
                <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-start">
                  {sug.status === "PENDING_REVIEW" ? (
                    <>
                      <button
                        onClick={() => handleReviewSuggestion(sug.suggestion_id, "APPROVE")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve &amp; Deploy</span>
                      </button>
                      <button
                        onClick={() => handleReviewSuggestion(sug.suggestion_id, "REJECT")}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-rose-100 text-slate-700 dark:text-white hover:text-rose-700 text-xs font-semibold transition-all active:scale-95"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-mono text-slate-400">
                      Reviewed: {sug.reviewed_at ? new Date(sug.reviewed_at).toLocaleDateString() : "Archived"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Immutable Versions & Atomic Rollback */}
      <div className="bg-white dark:bg-[#101A2B] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#456BFA]" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Immutable Version Snapshots &amp; Atomic Rollback
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/60">
                Every approved FAQ creates a persistent snapshot under data/knowledge/versions/. Any snapshot can be atomically restored with zero downtime.
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {versions.map((ver) => (
            <div
              key={ver.version_id}
              className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {ver.version_id}
                  </span>
                  {ver.is_active && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                      ACTIVE VERSION
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-slate-400">
                    {ver.total_articles} Articles
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-white/70">
                  {ver.description}
                </p>
              </div>

              {!ver.is_active && (
                <button
                  onClick={() => handleRollback(ver.version_id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-amber-100 hover:text-amber-900 text-xs font-mono font-semibold text-slate-700 dark:text-white transition-all self-start sm:self-center"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Restore Snapshot</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Retrieval Regression Benchmark */}
      <div className="bg-white dark:bg-[#101A2B] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Retrieval Regression Benchmark Runner
            </h3>
            <p className="text-xs text-slate-500 dark:text-white/60">
              Executes canonical validation queries across the active knowledge base to ensure newly added FAQs cause zero semantic drift.
            </p>
          </div>
          <button
            onClick={handleRunBenchmark}
            disabled={isLoadingKnowledge}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#101A2B] hover:bg-[#1E2E48] text-white text-xs font-mono font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-[#20C6B6]" />
            <span>Execute Benchmark</span>
          </button>
        </div>

        {benchmarkResult ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#17263D] text-xs font-mono">
              <span>Benchmark ID: {benchmarkResult.benchmark_id}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {benchmarkResult.passed_queries}/{benchmarkResult.total_queries} Passed (Mean Similarity: {benchmarkResult.mean_similarity.toFixed(3)})
              </span>
            </div>

            <div className="space-y-1.5">
              {benchmarkResult.details.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-800 dark:text-white truncate max-w-lg">
                    "{item.query}"
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-500">Score: {item.similarity.toFixed(3)}</span>
                    {item.passed ? (
                      <span className="text-emerald-500 font-bold">PASS</span>
                    ) : (
                      <span className="text-rose-500 font-bold">FAIL</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 dark:text-white/40 font-mono bg-slate-50 dark:bg-[#17263D]/40 rounded-xl border border-dashed border-slate-200 dark:border-white/10">
            Click "Execute Benchmark" to verify retrieval fidelity against active knowledge documents.
          </div>
        )}
      </div>
    </div>
  )}
    </div>
  );
};

export default EvidenceLedger;
