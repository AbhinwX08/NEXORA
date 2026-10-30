import React from "react";
import {
  Sparkles,
  ArrowRight,
  ArrowDown,
  X,
  AlertTriangle,
  CheckCircle,
  Brain,
  BookOpen,
  ShieldCheck,
  Rocket,
  Database,
  FileCheck2,
  GitCompare,
} from "lucide-react";
import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { WorkspacePreviewCard } from "@/components/landing/WorkspacePreviewCard";
import { DATASET_METRICS } from "@/data/datasetMetadata";

export interface LandingPageProps {
  onOpenWorkspace: () => void;
  onOpenDataset?: () => void;
  onOpenEvaluation?: () => void;
  onOpenEvidence?: () => void;
  onOpenReplay?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenWorkspace,
  onOpenDataset,
  onOpenEvaluation,
  onOpenEvidence,
  onOpenReplay,
}) => {
  return (
    <div className="flex flex-col w-full bg-[#F5F7FB] text-on-surface">
      {/* 1. Summit Presentation Header Banner */}
      <section className="relative w-full bg-[#101A2B] text-white px-4 sm:px-6 lg:px-12 py-3 overflow-hidden shadow-sm select-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left relative z-10 max-w-[1600px] mx-auto">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#456BFA]/20 text-[#20C6B6]">
              <Sparkles className="w-3.5 h-3.5 text-[#20C6B6]" />
            </span>
            <span className="font-mono text-xs tracking-wider uppercase text-[#B8C4FF]">
              Jaypee Agentic AI International Summit 2026 · Multi-Agent NLP Showcase
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-[#69F9E7] font-mono text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#45DCCB] animate-pulse"></span>
              Architecture: Coordinated Deterministic Agents
            </span>
            <span className="hidden lg:inline text-white/40 font-mono text-xs">
              Corpus: 22,841 Records
            </span>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#456BFA]/10 via-transparent to-[#20C6B6]/15 pointer-events-none"></div>
      </section>

      {/* 2. Hero Section Enhanced with HeroHighlight */}
      <HeroHighlight containerClassName="py-10 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Editorial & Framing */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2.5 self-start px-3.5 py-1.5 rounded-full bg-white shadow-sm border border-[#E3E8F0]">
              <span className="w-2 h-2 rounded-full bg-[#456BFA] shadow-[0_0_8px_#456bfa] animate-pulse"></span>
              <span className="font-mono text-xs uppercase text-[#1E4CDD] tracking-widest font-semibold">
                From customer query to verified resolution
              </span>
            </div>

            {/* Main Headline with Highlight */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#101A2B] tracking-tight leading-tight">
              Every customer query deserves a{" "}
              <Highlight className="text-[#101A2B]">clear next step.</Highlight>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-[#64748B] max-w-2xl leading-relaxed">
              An explainable, coordinated multi-agent NLP platform that moves beyond shallow intent
              classification into deep contextual retrieval, calibrated uncertainty analysis, and deterministic validation.
            </p>

            {/* CTA Action Group */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onOpenWorkspace}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#456BFA] text-white font-semibold text-sm shadow-md hover:bg-[#3256e6] transition-all group active:scale-95"
              >
                <span>Launch Live AI Workspace</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              {onOpenDataset && (
                <button
                  onClick={onOpenDataset}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-[#E3E8F0] text-[#172033] font-semibold text-sm hover:bg-[#F8FAFC] transition-all shadow-sm"
                >
                  <Database className="w-4 h-4 text-[#64748B]" />
                  <span>Explore Dataset</span>
                </button>
              )}

              {onOpenEvaluation && (
                <button
                  onClick={onOpenEvaluation}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-[#E3E8F0] text-[#172033] font-semibold text-sm hover:bg-[#F8FAFC] transition-all shadow-sm"
                >
                  <CheckCircle className="w-4 h-4 text-[#20C6B6]" />
                  <span>View Benchmarks</span>
                </button>
              )}

              {onOpenEvidence && (
                <button
                  onClick={onOpenEvidence}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-[#E3E8F0] text-[#172033] font-semibold text-sm hover:bg-[#F8FAFC] transition-all shadow-sm"
                >
                  <FileCheck2 className="w-4 h-4 text-[#20C6B6]" />
                  <span>Evidence Ledger</span>
                </button>
              )}

              {onOpenReplay && (
                <button
                  onClick={onOpenReplay}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-[#E3E8F0] text-[#172033] font-semibold text-sm hover:bg-[#F8FAFC] transition-all shadow-sm"
                >
                  <GitCompare className="w-4 h-4 text-[#456BFA]" />
                  <span>Replay Lab</span>
                </button>
              )}
            </div>

            {/* Truthful Reference Dataset Strip */}
            <div className="pt-6 border-t border-[#E3E8F0] grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-xl lg:text-2xl font-bold text-[#101A2B] font-mono block">
                  {DATASET_METRICS.trainingRecords.toLocaleString()}
                </span>
                <span className="text-xs text-[#64748B] block mt-0.5">
                  Training Records
                </span>
              </div>
              <div>
                <span className="text-xl lg:text-2xl font-bold text-[#456BFA] font-mono block">
                  {DATASET_METRICS.validationRecords.toLocaleString()}
                </span>
                <span className="text-xs text-[#64748B] block mt-0.5">
                  Validation Records
                </span>
              </div>
              <div>
                <span className="text-xl lg:text-2xl font-bold text-[#20C6B6] font-mono block">
                  {DATASET_METRICS.uniqueIntents}
                </span>
                <span className="text-xs text-[#64748B] block mt-0.5">
                  Actionable Intents
                </span>
              </div>
              <div>
                <span className="text-xl lg:text-2xl font-bold text-[#101A2B] font-mono block">
                  {DATASET_METRICS.uniqueCategories}
                </span>
                <span className="text-xs text-[#64748B] block mt-0.5">
                  Domain Categories
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural Flow Visual */}
          <div className="lg:col-span-5 w-full">
            <div className="bg-[#101A2B] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden text-white text-left">
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2 font-mono text-xs text-[#20C6B6]">
                  <span className="w-2 h-2 rounded-full bg-[#20C6B6] animate-pulse"></span>
                  <span>MULTI-AGENT PIPELINE ARCHITECTURE</span>
                </div>
                <span className="font-mono text-[11px] text-white/40">Deterministic Engine</span>
              </div>

              {/* Node Sequence Visual */}
              <div className="space-y-3 font-mono text-xs">
                {/* Node 1: Customer Query */}
                <div className="bg-[#17263D] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-[#456BFA]/20 text-[#456BFA] flex items-center justify-center font-bold text-[11px]">
                      Q
                    </span>
                    <div>
                      <span className="font-semibold text-white block">Customer Query</span>
                      <span className="text-[10px] text-white/50">"I want to cancel my order #98214"</span>
                    </div>
                  </div>
                  <span className="text-[#20C6B6] text-[11px]">Ingested</span>
                </div>

                <div className="flex justify-center -my-1 text-[#456BFA]">
                  <ArrowDown className="w-4 h-4" />
                </div>

                {/* Node 2: A1 Intent Analyst */}
                <div className="bg-[#17263D] border border-[#456BFA]/40 rounded-xl p-3 flex items-center justify-between shadow-[0_0_15px_rgba(69,107,250,0.15)]">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-[#456BFA] text-white flex items-center justify-center font-bold text-[11px]">
                      A1
                    </span>
                    <div>
                      <span className="font-semibold text-white block">A1 — Intent Analyst</span>
                      <span className="text-[10px] text-white/50">Intent: cancel_order · ORDER</span>
                    </div>
                  </div>
                  <span className="text-[#20C6B6] text-[11px] font-bold">Calibrated Conf</span>
                </div>

                <div className="flex justify-center -my-1 text-[#20C6B6]">
                  <ArrowDown className="w-4 h-4" />
                </div>

                {/* Node 3: A2 Response Specialist */}
                <div className="bg-[#17263D] border border-[#20C6B6]/40 rounded-xl p-3 flex items-center justify-between shadow-[0_0_15px_rgba(32,198,182,0.15)]">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-[#20C6B6] text-[#101A2B] flex items-center justify-center font-bold text-[11px]">
                      A2
                    </span>
                    <div>
                      <span className="font-semibold text-white block">A2 — Response Specialist</span>
                      <span className="text-[10px] text-white/50">Contextual Retrieval &amp; Dynamic Slot Binding</span>
                    </div>
                  </div>
                  <span className="text-[#20C6B6] text-[11px]">Grounded</span>
                </div>

                <div className="flex justify-center -my-1 text-[#20C6B6]">
                  <ArrowDown className="w-4 h-4" />
                </div>

                {/* Node 4: Validation Agent */}
                <div className="bg-[#17263D] border border-white/10 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                      VG
                    </span>
                    <div>
                      <span className="font-semibold text-white block">Validation Agent Gate</span>
                      <span className="text-[10px] text-white/50">7-Point Safety &amp; Anti-Fabrication Audit</span>
                    </div>
                  </div>
                  <span className="text-emerald-400 text-[11px] font-bold">Approved</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </HeroHighlight>

      {/* 3. ContainerScroll Showcase: "See Intelligence in Action" */}
      <section className="w-full">
        <ContainerScroll
          titleComponent={
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#101A2B] text-[#20C6B6] font-mono text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#20C6B6] animate-pulse"></span>
                <span>Spatial Multi-Agent Perspective</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#101A2B] tracking-tight">
                See Intelligence in Action
              </h2>
              <p className="text-lg md:text-xl text-[#456BFA] font-medium">
                One query. Two agents. One verified resolution.
              </p>
              <p className="max-w-2xl mx-auto text-sm text-[#64748B]">
                Ingesting customer inquiries, formulating calibrated classifications, and verifying knowledge retrieval through dual-agent consensus.
              </p>
            </div>
          }
        >
          <WorkspacePreviewCard />
        </ContainerScroll>
      </section>

      {/* 4. Problem & Solution Comparison */}
      <section id="problem-solution" className="py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-white border-y border-[#E3E8F0]">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs uppercase font-mono tracking-widest text-[#456BFA] font-bold">
              Architectural Shift
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#101A2B] tracking-tight mt-2">
              Why Unchecked Conversational AI Fails Enterprise Support
            </h2>
            <p className="text-base text-[#64748B] mt-4 leading-relaxed">
              Single-prompt chatbots conflate classification with generation, leading to hallucinations,
              fabrication of non-existent account facts, and unverified promises. RELAY AI decouples responsibilities into dedicated agent tiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* The Old Way */}
            <div className="p-8 rounded-2xl bg-[#F5F7FB] border border-red-200/60 shadow-sm text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 font-mono text-xs font-bold mb-6">
                <X className="w-4 h-4" />
                <span>Conventional Monolithic Chatbots</span>
              </div>
              <ul className="space-y-4 text-sm text-[#64748B]">
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span><strong>Monolithic Confusion:</strong> The model attempts to understand intent, extract parameters, and draft policies in a single uncalibrated step.</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span><strong>Fabricated Policies:</strong> Bot promises delivery timelines, refund confirmations, or account changes without verifying grounded source instructions.</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span><strong>Unchecked Overconfidence:</strong> Low-confidence or out-of-domain queries are answered blindly rather than triggering clarification or human escalation.</span>
                </li>
              </ul>
            </div>

            {/* The RELAY AI Way */}
            <div className="p-8 rounded-2xl bg-[#101A2B] text-white border border-[#20C6B6]/30 shadow-xl text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#20C6B6]/20 text-[#20C6B6] font-mono text-xs font-bold mb-6">
                <CheckCircle className="w-4 h-4 text-[#20C6B6]" />
                <span>RELAY AI Coordinated Consensus</span>
              </div>
              <ul className="space-y-4 text-sm text-white/80">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#20C6B6] shrink-0 mt-0.5" />
                  <span><strong>Decoupled Agent Specialization:</strong> Agent 1 analyzes calibrated intent &amp; margin; Agent 2 grounds response generation in validated instruction pairs.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#20C6B6] shrink-0 mt-0.5" />
                  <span><strong>Structured Handoff Contracts:</strong> Data passes between agents using immutable Pydantic schemas, guaranteeing full auditability.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#20C6B6] shrink-0 mt-0.5" />
                  <span><strong>Deterministic Safety Gates:</strong> Automatically routes between Automated Response, Slot Clarification, Ambiguity Clarification, or Escalation.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. System Differentiators */}
      <section id="system-differentiators" className="py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-[#F5F7FB]">
        <div className="max-w-[1600px] mx-auto text-left">
          <div className="max-w-2xl mb-12">
            <span className="text-xs uppercase font-mono tracking-widest text-[#456BFA] font-bold">
              Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#101A2B] tracking-tight mt-2">
              Engineered for Auditability, Speed and Precision
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento 1 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E3E8F0] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#456BFA]/10 text-[#456BFA] flex items-center justify-center mb-5">
                <Brain className="w-6 h-6 text-[#456BFA]" />
              </div>
              <h3 className="text-lg font-bold text-[#101A2B] mb-2">
                A1 — Intent Analyst
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Evaluates query syntax against 27 distinct support intents with Platt sigmoid probability calibration and top-2 margin analysis.
              </p>
            </div>

            {/* Bento 2 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E3E8F0] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#20C6B6]/10 text-[#20C6B6] flex items-center justify-center mb-5">
                <BookOpen className="w-6 h-6 text-[#20C6B6]" />
              </div>
              <h3 className="text-lg font-bold text-[#101A2B] mb-2">
                A2 — Response Specialist
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Retrieves verified instruction responses from the 18,810 training set index via dual TF-IDF vector matching and parameterizes customer slots.
              </p>
            </div>

            {/* Bento 3 */}
            <div className="p-6 rounded-2xl bg-white border border-[#E3E8F0] shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#101A2B] text-white flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6 text-[#20C6B6]" />
              </div>
              <h3 className="text-lg font-bold text-[#101A2B] mb-2">
                Validation Agent Gate
              </h3>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Enforces 7 verification checks before output delivery: component availability, escalation policy, domain boundary, confidence cutoff, and placeholder hygiene.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Four-Stage Procedural Pipeline */}
      <section id="agent-architecture" className="py-16 md:py-24 px-4 sm:px-6 lg:px-12 bg-white border-t border-[#E3E8F0] text-left">
        <div className="max-w-[1600px] mx-auto">
          <div className="max-w-2xl mb-12">
            <span className="text-xs uppercase font-mono tracking-widest text-[#456BFA] font-bold">
              System Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#101A2B] tracking-tight mt-2">
              Four-Stage Autonomous Resolution Flow
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-xl border border-[#E3E8F0] bg-[#F5F7FB]">
              <span className="font-mono text-xs font-bold text-[#456BFA] block mb-2">01 // INGESTION</span>
              <h4 className="text-base font-bold text-[#101A2B] mb-1">Entity &amp; Slot Extraction</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Extracts order numbers, invoice codes, refund amounts, tracking numbers, and account types from raw customer query strings.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#E3E8F0] bg-[#F5F7FB]">
              <span className="font-mono text-xs font-bold text-[#456BFA] block mb-2">02 // CLASSIFICATION</span>
              <h4 className="text-base font-bold text-[#101A2B] mb-1">A1 Calibrated Intent</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Maps query against 27 domain intents and calculates calibrated confidence (0.0119 ECE) and top-2 margin.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#E3E8F0] bg-[#F5F7FB]">
              <span className="font-mono text-xs font-bold text-[#20C6B6] block mb-2">03 // RETRIEVAL</span>
              <h4 className="text-base font-bold text-[#101A2B] mb-1">A2 Grounded Retrieval</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Retrieves matching instruction responses via dual TF-IDF index (1.0 Recall@1) and binds extracted customer parameters.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-[#E3E8F0] bg-[#F5F7FB]">
              <span className="font-mono text-xs font-bold text-[#20C6B6] block mb-2">04 // VALIDATION</span>
              <h4 className="text-base font-bold text-[#101A2B] mb-1">Validation &amp; Action Routing</h4>
              <p className="text-xs text-[#64748B] leading-relaxed">
                Enforces 7 safety gates to approve automated delivery, request missing parameter clarification, or recommend escalation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Bottom Presentation CTA Strip */}
      <section className="bg-[#101A2B] text-white py-16 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Experience Coordinated Multi-Agent Customer Support
          </h2>
          <p className="text-white/70 text-base">
            Test the live workspace with real customer queries, inspect genuine execution traces, and verify deterministic validation gates.
          </p>
          <div>
            <button
              onClick={onOpenWorkspace}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-[#456BFA] hover:bg-[#3256e6] text-white font-bold text-base transition-all shadow-xl active:scale-95"
            >
              <span>Launch Live AI Autonomous Workspace</span>
              <Rocket className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
