import React from "react";
import {
  LayoutDashboard,
  Terminal,
  Database,
  CheckCircle2,
  Network,
  ShieldCheck,
  GitCompare,
  FileCheck2,
} from "lucide-react";
import { ViewType } from "./Header";
import { SidebarThemeToggle } from "@/lib/theme";

export interface SidebarProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-[#101A2B] z-50 hidden lg:flex flex-col justify-between border-r border-white/10 select-none text-left">
      <div className="flex flex-col">
        {/* Brand Header */}
        <div
          className="h-16 px-6 flex items-center gap-3 border-b border-white/10 bg-[#101A2B] cursor-pointer"
          onClick={() => onNavigate("landing")}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#456BFA] to-[#20C6B6] flex items-center justify-center text-white shadow-[0_0_15px_rgba(69,107,250,0.4)]">
            <Network className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-white tracking-tight uppercase font-bold text-sm">
              RELAY AI
            </span>
            <span className="text-[10px] text-white/50 tracking-wider font-mono">
              MULTI-AGENT INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-4">
          <span className="px-3 text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-2">
            Platform Views
          </span>
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => onNavigate("landing")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all w-full text-xs sm:text-sm ${
                currentView === "landing"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#456BFA]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${currentView === "landing" ? "text-[#456BFA]" : "text-white/50"}`} />
              <span>Overview &amp; Landing</span>
            </button>

            <button
              onClick={() => onNavigate("workspace")}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all w-full text-xs sm:text-sm ${
                currentView === "workspace"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#20C6B6]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Terminal className={`w-4 h-4 ${currentView === "workspace" ? "text-[#20C6B6]" : "text-white/50"}`} />
                <span>Live AI Workspace</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#20C6B6] animate-pulse"></span>
            </button>

            <button
              onClick={() => onNavigate("evidence")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all w-full text-xs sm:text-sm ${
                currentView === "evidence"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#20C6B6]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <FileCheck2 className={`w-4 h-4 ${currentView === "evidence" ? "text-[#20C6B6]" : "text-white/50"}`} />
              <span>Evidence Ledger</span>
            </button>

            <button
              onClick={() => onNavigate("replay")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all w-full text-xs sm:text-sm ${
                currentView === "replay"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#456BFA]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <GitCompare className={`w-4 h-4 ${currentView === "replay" ? "text-[#456BFA]" : "text-white/50"}`} />
              <span>Decision Replay Lab</span>
            </button>

            <button
              onClick={() => onNavigate("dataset")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all w-full text-xs sm:text-sm ${
                currentView === "dataset"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#F4B860]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <Database className={`w-4 h-4 ${currentView === "dataset" ? "text-[#F4B860]" : "text-white/50"}`} />
              <span>Dataset Explorer</span>
            </button>

            <button
              onClick={() => onNavigate("evaluation")}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all w-full text-xs sm:text-sm ${
                currentView === "evaluation"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#20C6B6]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${currentView === "evaluation" ? "text-[#20C6B6]" : "text-white/50"}`} />
              <span>Evaluation &amp; Checkpoints</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Footer Strip: Telemetry + Sole Theme Control */}
      <div className="p-4 border-t border-white/10 bg-[#101A2B] flex flex-col gap-3">
        {/* Genuine Telemetry Indicator */}
        <div className="flex flex-col gap-1.5 text-[11px] font-mono text-white/50 bg-[#17263D]/60 p-2.5 rounded-lg border border-white/5">
          <div className="flex items-center justify-between text-white/70 font-semibold mb-0.5">
            <span className="flex items-center gap-1.5 text-white/80">
              <ShieldCheck className="w-3.5 h-3.5 text-[#20C6B6]" />
              Corpus Grounding
            </span>
            <span className="text-[#20C6B6]">Verified</span>
          </div>
          <div className="flex justify-between">
            <span>Training Corpus:</span>
            <span className="text-white/80 font-bold">18,810</span>
          </div>
          <div className="flex justify-between">
            <span>Validation Set:</span>
            <span className="text-white/80 font-bold">4,031</span>
          </div>
          <div className="flex justify-between">
            <span>Actionable Intents:</span>
            <span className="text-[#20C6B6] font-bold">27</span>
          </div>
        </div>

        {/* Sole Theme Toggle at Bottom of Sidebar */}
        <SidebarThemeToggle />
      </div>
    </aside>
  );
};

export default Sidebar;
