import React from "react";
import {
  Network,
  FileEdit,
  ArrowRightLeft,
  ShieldCheck,
  CheckCircle,
  Check,
  Info,
} from "lucide-react";

export const WorkspacePreviewCard: React.FC = () => {
  return (
    <div className="w-full bg-[#101A2B] text-white p-3 sm:p-5 md:p-6 select-none font-sans rounded-2xl border border-white/10 shadow-2xl">
      {/* Illustrative Notice Banner */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 text-[11px] font-mono">
        <span className="flex items-center gap-1.5 text-[#20C6B6]">
          <Info className="w-3.5 h-3.5" />
          <span>ILLUSTRATIVE PIPELINE PREVIEW · SAMPLE DATA</span>
        </span>
        <span className="text-white/40 hidden sm:inline">
          Grounding Corpus: 18,810 Instruction Pairs
        </span>
      </div>

      {/* Top Bar of Workspace Preview */}
      <div className="flex flex-wrap items-center justify-between pb-4 mb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#456BFA] flex items-center justify-center text-white shadow-md">
            <Network className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                Live AI Autonomous Workspace
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#20C6B6]/20 text-[#20C6B6] text-[10px] font-mono font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#20C6B6]"></span>
                ORCHESTRATOR PREVIEW
              </span>
            </div>
            <p className="text-[11px] text-white/50">
              Deterministic Multi-Agent Coordination · Calibrated Intent &amp; Retrieval Handoffs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded bg-[#17263D] border border-white/10 text-white/70">
            A1: Platt Calibrated
          </span>
          <span className="px-2.5 py-1 rounded bg-[#17263D] border border-white/10 text-[#20C6B6] font-semibold">
            Validation: 7 Safety Gates
          </span>
        </div>
      </div>

      {/* 3-Column Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-left">
        {/* COLUMN 1: Customer Query Input (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="bg-[#17263D] border border-white/10 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-white/50 flex items-center gap-1.5">
                <FileEdit className="w-3.5 h-3.5 text-[#456BFA]" />
                1. Customer Query Input
              </span>
              <span className="text-[10px] font-mono text-[#20C6B6] bg-[#20C6B6]/10 px-1.5 py-0.5 rounded">
                Ingested
              </span>
            </div>

            <div className="bg-[#101A2B] border border-white/10 rounded-lg p-3 text-xs sm:text-sm text-white/90 font-mono leading-relaxed">
              "I want to cancel my order #98214"
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50 font-mono">
              <span>Length: 33/2000 chars</span>
              <span className="text-white/70">Entity: #98214 Extracted</span>
            </div>
          </div>

          {/* Preset Info */}
          <div className="bg-[#17263D]/60 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-white/40">
              Sample Benchmark Inquiry:
            </span>
            <div className="flex items-center justify-between text-xs bg-[#101A2B]/80 px-2.5 py-1.5 rounded border border-white/10">
              <span className="text-white font-medium">Standard Cancellation Flow</span>
              <span className="text-[10px] font-mono text-[#456BFA]">ORDER Category</span>
            </div>
          </div>
        </div>

        {/* COLUMN 2: Multi-Agent Processing & Handoff (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Agent 1: Intent Analyst */}
          <div className="bg-[#17263D] border border-white/10 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#456BFA]/20 text-[#456BFA] flex items-center justify-center font-bold text-[11px]">
                  A1
                </div>
                <span className="text-xs font-bold text-white tracking-tight">
                  Intent Analyst
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#20C6B6] font-semibold">
                82.6% Calibrated Conf
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono mb-2">
              <div className="bg-[#101A2B] p-2 rounded border border-white/5">
                <span className="text-white/40 block text-[9px]">CATEGORY</span>
                <span className="text-[#20C6B6] font-semibold">ORDER</span>
              </div>
              <div className="bg-[#101A2B] p-2 rounded border border-white/5">
                <span className="text-white/40 block text-[9px]">INTENT</span>
                <span className="text-white font-semibold">cancel_order</span>
              </div>
            </div>

            <p className="text-[11px] text-white/60 leading-relaxed font-sans bg-[#101A2B]/50 p-2 rounded border border-white/5">
              High confidence with clean margin separation over alternative change_order intent.
            </p>
          </div>

          {/* Agent Handoff Relay Connector */}
          <div className="bg-gradient-to-r from-[#456BFA]/20 via-[#20C6B6]/20 to-[#456BFA]/20 border border-[#456BFA]/30 rounded-xl p-2 flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-[10px] text-[#20C6B6]">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Handoff: Intent + Slots Dispatched</span>
            </div>
            <span className="text-[9px] font-mono text-white/40">Typed Contract</span>
          </div>

          {/* Agent 2: Response Specialist */}
          <div className="bg-[#17263D] border border-white/10 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#20C6B6]/20 text-[#20C6B6] flex items-center justify-center font-bold text-[11px]">
                  A2
                </div>
                <span className="text-xs font-bold text-white tracking-tight">
                  Response Specialist
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#20C6B6] bg-[#101A2B] px-2 py-0.5 rounded border border-white/5">
                Sim: 0.6849
              </span>
            </div>

            <p className="text-[11px] text-white/70 italic font-sans leading-relaxed border-l-2 border-[#20C6B6] pl-2.5 my-1">
              "Matched training instruction: 'cancel purchase with order number'. Slot {'{{Order Number}}'} bound to 98214."
            </p>
          </div>
        </div>

        {/* COLUMN 3: Response Validation & Final Resolution Panel (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Response Validation Status */}
          <div className="bg-[#17263D] border border-white/10 rounded-xl p-3 sm:p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-white/50 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#20C6B6]" />
                Validation Agent Gate
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#20C6B6] font-semibold bg-[#20C6B6]/10 px-2 py-0.5 rounded">
                <Check className="w-3 h-3" />
                7 Checks Verified
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono text-white/70">
              <div className="flex items-center justify-between bg-[#101A2B] px-2 py-1 rounded">
                <span>Domain Boundary:</span>
                <span className="text-[#20C6B6] font-semibold">PASS (In-Domain)</span>
              </div>
              <div className="flex items-center justify-between bg-[#101A2B] px-2 py-1 rounded">
                <span>Placeholder Hygiene:</span>
                <span className="text-[#20C6B6] font-semibold">PASS (No Leaked Braces)</span>
              </div>
            </div>
          </div>

          {/* Final Resolution Panel */}
          <div className="bg-[#17263D] border border-[#20C6B6]/30 rounded-xl p-3 sm:p-4 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#20C6B6]" />
                Final Decision: PROCEED_AUTOMATED
              </span>
              <span className="text-[10px] font-mono text-[#20C6B6] bg-[#20C6B6]/20 px-2 py-0.5 rounded-full font-bold">
                APPROVED
              </span>
            </div>

            <div className="bg-[#101A2B] border border-white/10 rounded-lg p-2.5 text-xs text-white/90 font-mono leading-relaxed mb-3">
              "I understand you would like to cancel order #98214. Please log in to your account portal, navigate to Order Details, select order #98214, and follow the cancellation prompts."
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-[10px] font-mono text-white/40">
              <span>Delivery Status: Ready for Client Presentation</span>
              <span className="bg-white/5 px-2 py-0.5 rounded text-white/60">
                Webhook Standby
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePreviewCard;
