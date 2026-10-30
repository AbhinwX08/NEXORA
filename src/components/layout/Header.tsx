import React, { useState } from "react";
import {
  Menu,
  Network,
  Award,
  Terminal,
  ArrowLeft,
  LayoutDashboard,
} from "lucide-react";

export interface HeaderProps {
  currentView: "landing" | "workspace";
  onNavigate: (view: "landing" | "workspace") => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-[#101A2B] z-40 border-b border-white/10 px-4 sm:px-6 flex items-center justify-between select-none">
      {/* Left items: Mobile toggle + Summit badges */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-white/80 hover:text-white"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Brand mark on mobile */}
        <div 
          className="lg:hidden flex items-center gap-2 cursor-pointer mr-2"
          onClick={() => onNavigate("landing")}
        >
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#456BFA] to-[#20C6B6] flex items-center justify-center text-white">
            <Network className="w-4 h-4" />
          </div>
          <span className="font-headline-sm text-sm font-bold text-white tracking-tight uppercase">
            RELAY AI
          </span>
        </div>

        {/* Jaypee Summit Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#17263D] border border-white/10 text-white font-badge-label text-badge-label tracking-wider uppercase">
          <Award className="w-3.5 h-3.5 text-[#20C6B6]" />
          <span className="hidden sm:inline">Jaypee Agentic AI Summit 2026</span>
          <span className="sm:hidden">JAI 2026</span>
        </div>

        {/* Demo Mode Badge */}
        <div className="hidden md:inline-flex items-center gap-2 px-3 py-1 rounded bg-secondary-container/10 border border-secondary-container/30 text-white font-code-inline text-code-inline">
          <span className="w-2 h-2 rounded-full bg-[#4167f6]"></span>
          <span>DEMO MODE (Bitext NLP 26.8k)</span>
        </div>

        {/* Dataset Reference Stats */}
        <div className="hidden 2xl:inline-flex items-center gap-2 px-3 py-1 rounded bg-[#17263D] border border-white/5 text-white/80 font-code-stream text-code-stream">
          <span>26,872 Records · 27 Intents · 10 Categories</span>
        </div>
      </div>

      {/* Right items: View Switcher Button + Architect Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {currentView === "landing" ? (
          <button
            onClick={() => onNavigate("workspace")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#456BFA] hover:bg-[#3256e6] text-white font-body-bold text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95"
          >
            <Terminal className="w-4 h-4" />
            <span>Open Workspace</span>
          </button>
        ) : (
          <button
            onClick={() => onNavigate("landing")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#17263D] hover:bg-[#223554] border border-white/10 text-white font-body-bold text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Landing Page</span>
          </button>
        )}

        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-white/10">
          <div className="hidden sm:flex flex-col text-right">
            <span className="font-body-bold text-body-bold text-white leading-tight text-xs sm:text-sm">
              Dr. A. Verma
            </span>
            <span className="font-caption text-caption text-white/60 text-[11px]">
              AI Architect
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#17263D] to-[#456BFA] border border-white/20 flex items-center justify-center font-bold text-white text-xs">
            AV
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 right-0 bg-[#101A2B] border-b border-white/10 p-4 flex flex-col gap-2 shadow-2xl z-50">
          <button
            onClick={() => {
              onNavigate("landing");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 p-2 rounded text-white/80 hover:bg-[#17263D] text-left"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview &amp; Landing</span>
          </button>
          <button
            onClick={() => {
              onNavigate("workspace");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 p-2 rounded text-white/80 hover:bg-[#17263D] text-left"
          >
            <Terminal className="w-4 h-4" />
            <span>Live AI Workspace</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
