import React, { useState } from "react";
import {
  Menu,
  Network,
  Award,
  Terminal,
  ArrowLeft,
  LayoutDashboard,
  Database,
  CheckCircle2,
  X,
  FileCheck2,
  GitCompare,
} from "lucide-react";
import { SidebarThemeToggle } from "@/lib/theme";

export type ViewType = "landing" | "workspace" | "evidence" | "replay" | "dataset" | "evaluation";

export interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNav = (view: ViewType) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-[#101A2B] z-40 border-b border-white/10 px-3 sm:px-6 flex items-center justify-between select-none">
      {/* Left Section: Mobile toggle, Brand, Summit badges */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand mark on mobile */}
        <div
          className="lg:hidden flex items-center gap-2 cursor-pointer flex-shrink-0"
          onClick={() => onNavigate("landing")}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#456BFA] to-[#20C6B6] flex items-center justify-center text-white">
            <Network className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-white tracking-tight uppercase">
            RELAY AI
          </span>
        </div>

        {/* Summit Track Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#17263D] border border-white/10 text-white font-mono text-[11px] tracking-wider uppercase">
          <Award className="w-3.5 h-3.5 text-[#20C6B6]" />
          <span className="hidden md:inline">Jaypee Agentic AI Summit 2026</span>
          <span className="md:hidden">JAI 2026</span>
        </div>

        {/* Truthful Dataset Scope Strip */}
        <div className="hidden xl:inline-flex items-center gap-2 px-3 py-1 rounded bg-[#17263D] border border-white/5 text-white/80 font-mono text-[11px]">
          <span>18,810 Train · 4,031 Val · 27 Intents · 11 Categories</span>
        </div>
      </div>

      {/* Right Section: Workspace Quick Action + System Badge */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {currentView !== "workspace" ? (
          <button
            onClick={() => onNavigate("workspace")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg bg-[#456BFA] hover:bg-[#3256e6] text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Open Workspace</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate("landing")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-lg bg-[#17263D] hover:bg-[#223554] border border-white/10 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Landing</span>
          </button>
        )}

        {/* System Engine Indicator */}
        <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-white/10">
          <div className="flex flex-col text-right">
            <span className="text-white text-xs font-semibold leading-tight">
              Deterministic Engine
            </span>
            <span className="text-[10px] text-[#20C6B6] font-mono">
              A1 + A2 + Validation
            </span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-[#17263D] border border-white/20 flex items-center justify-center text-[#20C6B6]">
            <Network className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-[#101A2B]/95 backdrop-blur-md z-50 flex flex-col justify-between p-4 border-t border-white/10 overflow-y-auto">
          <div className="flex flex-col gap-2">
            <span className="px-3 text-[11px] font-mono uppercase tracking-wider text-white/40 block mb-1">
              Platform Views
            </span>

            <button
              onClick={() => handleMobileNav("landing")}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm ${
                currentView === "landing"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#456BFA]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#456BFA]" />
              <span>Overview &amp; Landing</span>
            </button>

            <button
              onClick={() => handleMobileNav("workspace")}
              className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm ${
                currentView === "workspace"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#20C6B6]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 text-[#20C6B6]" />
                <span>Live AI Workspace</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#20C6B6] animate-pulse"></span>
            </button>

            <button
              onClick={() => handleMobileNav("evidence")}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm ${
                currentView === "evidence"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#20C6B6]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-[#20C6B6]" />
              <span>Evidence Ledger</span>
            </button>

            <button
              onClick={() => handleMobileNav("replay")}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm ${
                currentView === "replay"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#456BFA]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <GitCompare className="w-4 h-4 text-[#456BFA]" />
              <span>Decision Replay Lab</span>
            </button>

            <button
              onClick={() => handleMobileNav("dataset")}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm ${
                currentView === "dataset"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#F4B860]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <Database className="w-4 h-4 text-[#F4B860]" />
              <span>Dataset Explorer</span>
            </button>

            <button
              onClick={() => handleMobileNav("evaluation")}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm ${
                currentView === "evaluation"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#20C6B6]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-[#20C6B6]" />
              <span>Evaluation &amp; Checkpoints</span>
            </button>
          </div>

          {/* Mobile Drawer Bottom: Same Theme Control as Sidebar */}
          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <SidebarThemeToggle />
            <div className="text-center text-[10px] text-white/40 font-mono">
              RELAY AI Platform · Version 1.0.0
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
