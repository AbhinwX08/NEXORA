import React, { useState, useEffect } from "react";
import {
  GitCompare,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  FileCode,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { executeReplay } from "@/lib/api";
import { ReplayResponse } from "@/types/api";

const REPLAY_SCENARIOS = [
  {
    name: "Typo & Paraphrase Robustness",
    description: "Evaluates model resilience against informal abbreviations and heavy typos.",
    queryA: "I would like to cancel my order please",
    queryB: "pls cncl my ordr asapp",
    expectedOutcome: "Intent and decision should remain stable despite spelling noise.",
  },
  {
    name: "Human Escalation Gate Activation",
    description: "Evaluates how explicit escalation intent modifies the canonical decision.",
    queryA: "Where is my package tracking info?",
    queryB: "Where is my package? I want to speak to a real human agent right now!",
    expectedOutcome: "Variant B activates the human escalation policy gate.",
  },
  {
    name: "Slot Completeness Sensitivity",
    description: "Tests slot completeness gate with and without order identifier.",
    queryA: "I want to cancel my order",
    queryB: "I want to cancel order #98214",
    expectedOutcome: "Variant A requests clarification; Variant B resolves with slot bound.",
  },
  {
    name: "Out-of-Domain Boundary Test",
    description: "Compares supported customer support query vs irrelevant domain query.",
    queryA: "How do I track my delivery status?",
    queryB: "Can you give me a recipe for chocolate cake?",
    expectedOutcome: "Variant B triggers low-confidence / low-similarity rejection.",
  },
  {
    name: "Ambiguous Intent Disambiguation",
    description: "Checks discrimination between account changes and billing refund requests.",
    queryA: "I want to change my account details",
    queryB: "Can I get a refund on my account billing invoice?",
    expectedOutcome: "Model distinguishes account maintenance from refund requests.",
  },
];

export const DecisionReplayLab: React.FC = () => {
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState(0);
  const [queryA, setQueryA] = useState(REPLAY_SCENARIOS[0].queryA);
  const [queryB, setQueryB] = useState(REPLAY_SCENARIOS[0].queryB);
  const [isLoading, setIsLoading] = useState(false);
  const [replayResult, setReplayResult] = useState<ReplayResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);

  useEffect(() => {
    handleRunReplay(REPLAY_SCENARIOS[0].queryA, REPLAY_SCENARIOS[0].queryB);
  }, []);

  const handleSelectScenario = (idx: number) => {
    setSelectedScenarioIdx(idx);
    const scenario = REPLAY_SCENARIOS[idx];
    setQueryA(scenario.queryA);
    setQueryB(scenario.queryB);
    handleRunReplay(scenario.queryA, scenario.queryB);
  };

  const handleRunReplay = async (a: string, b: string) => {
    if (!a.trim() || !b.trim()) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await executeReplay({
        query: a.trim(),
        modified_query: b.trim(),
      });
      setReplayResult(res);
    } catch (err: any) {
      console.error("Replay error:", err);
      setErrorMessage(err.message || "Failed to execute decision replay.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderDeltaPill = (val: number, isPercent = true, suffix = "") => {
    const formatted = isPercent
      ? `${(val * 100).toFixed(1)}%`
      : `${val.toFixed(1)}${suffix}`;
    if (val > 0.001) {
      return (
        <span className="inline-flex items-center gap-0.5 text-emerald-400 font-mono font-bold text-xs">
          <TrendingUp className="w-3 h-3" />
          +{formatted}
        </span>
      );
    } else if (val < -0.001) {
      return (
        <span className="inline-flex items-center gap-0.5 text-rose-400 font-mono font-bold text-xs">
          <TrendingDown className="w-3 h-3" />
          {formatted}
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-0.5 text-slate-400 font-mono text-xs">
          <Minus className="w-3 h-3" />
          0.0%
        </span>
      );
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#456BFA]/20 text-[#456BFA] text-xs font-mono font-bold uppercase tracking-wider border border-[#456BFA]/30">
              Counterfactual Audit
            </span>
            <span className="text-xs text-white/50 font-mono">
              Live Comparative Inference
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#121B2E] dark:text-white tracking-tight">
            Decision Replay Lab
          </h1>
          <p className="text-sm text-slate-600 dark:text-white/60 mt-1 max-w-2xl">
            Execute side-by-side comparative testing across query perturbations, misspellings,
            and adversarial escalations to measure decision boundaries with delta analytics.
          </p>
        </div>

        <button
          onClick={() => setShowJsonModal(!showJsonModal)}
          disabled={!replayResult}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#17263D] hover:bg-slate-50 dark:hover:bg-[#223554] text-slate-700 dark:text-white border border-slate-200 dark:border-white/10 text-xs font-semibold shadow-sm transition-all disabled:opacity-50 self-start md:self-auto"
        >
          <FileCode className="w-4 h-4 text-[#456BFA]" />
          <span>Compare Raw JSON</span>
        </button>
      </div>

      {/* Pre-built Scenarios Carousel */}
      <div className="bg-white dark:bg-[#101A2B] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-white/60 font-mono">
          <span>PRE-BUILT SENSITIVITY &amp; REGRESSION SUITES</span>
          <span>{REPLAY_SCENARIOS.length} SCENARIOS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {REPLAY_SCENARIOS.map((scenario, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectScenario(idx)}
              className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between gap-1.5 ${
                selectedScenarioIdx === idx
                  ? "bg-[#456BFA]/10 border-[#456BFA] shadow-sm"
                  : "bg-slate-50 dark:bg-[#17263D] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20"
              }`}
            >
              <div className="font-semibold text-xs text-slate-800 dark:text-white line-clamp-1">
                {scenario.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-white/50 line-clamp-2 leading-snug">
                {scenario.description}
              </div>
            </button>
          ))}
        </div>

        {/* Expected Outcome callout */}
        <div className="px-3 py-2 bg-slate-50 dark:bg-[#17263D]/60 rounded-lg border border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-white/70 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#20C6B6] flex-shrink-0" />
          <span>
            <strong>Hypothesis:</strong>{" "}
            {REPLAY_SCENARIOS[selectedScenarioIdx]?.expectedOutcome}
          </span>
        </div>
      </div>

      {/* Side-by-Side Query Editors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Variant A (Base) */}
        <div className="bg-white dark:bg-[#101A2B] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-[#456BFA]/20 text-[#456BFA] text-xs font-mono font-bold uppercase">
              Variant A (Base Query)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Reference</span>
          </div>

          <textarea
            rows={3}
            value={queryA}
            onChange={(e) => setQueryA(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#17263D] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#456BFA] resize-none"
            placeholder="Enter baseline customer inquiry..."
          />
        </div>

        {/* Variant B (Perturbed) */}
        <div className="bg-white dark:bg-[#101A2B] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-[#20C6B6]/20 text-[#20C6B6] text-xs font-mono font-bold uppercase">
              Variant B (Perturbation / Counterfactual)
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Perturbation</span>
          </div>

          <textarea
            rows={3}
            value={queryB}
            onChange={(e) => setQueryB(e.target.value)}
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#17263D] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#20C6B6] resize-none"
            placeholder="Enter perturbed or adversarial query..."
          />
        </div>
      </div>

      {/* Action Button & Errors */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => handleRunReplay(queryA, queryB)}
          disabled={isLoading || !queryA.trim() || !queryB.trim()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#456BFA] to-[#20C6B6] hover:opacity-95 text-white font-bold text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <GitCompare className="w-4 h-4" />
          )}
          <span>Execute Comparative Replay</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-500/30 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Delta Metrics Banner */}
      {replayResult && (
        <div className="bg-white dark:bg-[#101A2B] rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#20C6B6]" />
              <h2 className="text-base font-bold text-slate-800 dark:text-white">
                Replay Sensitivity Verdict
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {replayResult.comparison.intent_match ? (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                  INTENT MATCH: STABLE
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
                  INTENT DIVERGED
                </span>
              )}

              {replayResult.comparison.decision_identical ? (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                  DECISION: IDENTICAL
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-mono font-bold">
                  DECISION: ALTERED
                </span>
              )}
            </div>
          </div>

          {/* Delta metrics grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-[#17263D] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
              <div className="text-[11px] text-slate-500 dark:text-white/50 font-mono">
                Confidence Delta (Δ)
              </div>
              <div className="text-sm font-bold">
                {renderDeltaPill(replayResult.comparison.confidence_delta)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {(replayResult.variant_a.confidence * 100).toFixed(1)}% →{" "}
                {(replayResult.variant_b.confidence * 100).toFixed(1)}%
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#17263D] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
              <div className="text-[11px] text-slate-500 dark:text-white/50 font-mono">
                Prediction Margin (Δ)
              </div>
              <div className="text-sm font-bold">
                {renderDeltaPill(replayResult.comparison.margin_delta)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {(replayResult.variant_a.margin * 100).toFixed(1)}% →{" "}
                {(replayResult.variant_b.margin * 100).toFixed(1)}%
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#17263D] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
              <div className="text-[11px] text-slate-500 dark:text-white/50 font-mono">
                Retrieval Similarity (Δ)
              </div>
              <div className="text-sm font-bold">
                {renderDeltaPill(replayResult.comparison.similarity_delta)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {((replayResult.variant_a.similarity || 0) * 100).toFixed(1)}% →{" "}
                {((replayResult.variant_b.similarity || 0) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#17263D] rounded-xl border border-slate-100 dark:border-white/5 space-y-1">
              <div className="text-[11px] text-slate-500 dark:text-white/50 font-mono">
                Latency Delta (Δ)
              </div>
              <div className="text-sm font-bold">
                {renderDeltaPill(replayResult.comparison.latency_delta_ms, false, "ms")}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {replayResult.variant_a.duration_ms.toFixed(1)}ms →{" "}
                {replayResult.variant_b.duration_ms.toFixed(1)}ms
              </div>
            </div>
          </div>

          {/* Side-by-side Result Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Card A */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#17263D]/40 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                <span className="text-xs font-bold font-mono text-[#456BFA]">
                  OUTPUT: VARIANT A
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {replayResult.variant_a.duration_ms.toFixed(1)} ms
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-white/50">Predicted Intent:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">
                    {replayResult.variant_a.intent}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-white/50">Category:</span>
                  <span className="font-mono text-slate-700 dark:text-white/80">
                    {replayResult.variant_a.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-white/50">Confidence:</span>
                  <span className="font-mono text-[#456BFA] font-bold">
                    {(replayResult.variant_a.confidence * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-white/50">Final Decision:</span>
                  <span className="font-mono font-bold text-emerald-400 uppercase">
                    {replayResult.variant_a.final_decision}
                  </span>
                </div>
              </div>
            </div>

            {/* Card B */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#17263D]/40 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2">
                <span className="text-xs font-bold font-mono text-[#20C6B6]">
                  OUTPUT: VARIANT B
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {replayResult.variant_b.duration_ms.toFixed(1)} ms
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-white/50">Predicted Intent:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">
                    {replayResult.variant_b.intent}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-white/50">Category:</span>
                  <span className="font-mono text-slate-700 dark:text-white/80">
                    {replayResult.variant_b.category}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-white/50">Confidence:</span>
                  <span className="font-mono text-[#20C6B6] font-bold">
                    {(replayResult.variant_b.confidence * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-white/50">Final Decision:</span>
                  <span className="font-mono font-bold text-purple-400 uppercase">
                    {replayResult.variant_b.final_decision}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raw JSON Modal */}
      {showJsonModal && replayResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#101A2B] rounded-2xl border border-white/10 w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono">
                Comparative Replay Raw JSON Payload
              </h3>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-white/50 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-xs text-slate-300 bg-[#17263D]/60 flex-1">
              <pre>{JSON.stringify(replayResult, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecisionReplayLab;
