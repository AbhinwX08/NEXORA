import React from "react";
import {
  LayoutDashboard,
  Terminal,
  Database,
  CheckCircle2,
  GitBranch,
  Network,
} from "lucide-react";

export interface SidebarProps {
  currentView: "landing" | "workspace";
  onNavigate: (view: "landing" | "workspace") => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-72 bg-[#101A2B] z-50 hidden lg:flex flex-col justify-between border-r border-white/10 select-none">
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
            <span className="font-headline-sm text-headline-sm text-white tracking-tight uppercase font-bold">
              RELAY AI
            </span>
            <span className="font-code-inline text-[10px] text-white/50 tracking-wider">
              MULTI-AGENT INTELLIGENCE
            </span>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-4">
          <span className="px-3 text-[11px] font-code-inline uppercase tracking-wider text-white/40 block mb-2">
            Navigation
          </span>
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => onNavigate("landing")}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-left transition-colors w-full ${
                currentView === "landing"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#456BFA]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 ${currentView === "landing" ? "text-[#456BFA]" : "text-white/50"}`} />
              <span className="font-body-md text-body-md">Overview &amp; Landing</span>
            </button>

            <button
              onClick={() => onNavigate("workspace")}
              className={`flex items-center justify-between px-3 py-2.5 rounded text-left transition-colors w-full ${
                currentView === "workspace"
                  ? "bg-[#17263D] text-white font-semibold border-l-2 border-[#20C6B6]"
                  : "text-white/70 hover:bg-[#17263D] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Terminal className={`w-5 h-5 ${currentView === "workspace" ? "text-[#20C6B6]" : "text-white/50"}`} />
                <span className="font-body-md text-body-md">Live AI Workspace</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#20C6B6] animate-pulse"></span>
            </button>

            <a
              href="#problem-solution"
              onClick={(e) => {
                if (currentView !== "landing") {
                  e.preventDefault();
                  onNavigate("landing");
                  setTimeout(() => {
                    document.getElementById("problem-solution")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-white/70 hover:bg-[#17263D] hover:text-white transition-colors"
            >
              <Database className="w-5 h-5 text-white/50" />
              <span className="font-body-md text-body-md">Dataset Explorer</span>
            </a>

            <a
              href="#system-differentiators"
              onClick={(e) => {
                if (currentView !== "landing") {
                  e.preventDefault();
                  onNavigate("landing");
                  setTimeout(() => {
                    document.getElementById("system-differentiators")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-white/70 hover:bg-[#17263D] hover:text-white transition-colors"
            >
              <CheckCircle2 className="w-5 h-5 text-white/50" />
              <span className="font-body-md text-body-md">Evaluation &amp; Checkpoint</span>
            </a>

            <a
              href="#agent-architecture"
              onClick={(e) => {
                if (currentView !== "landing") {
                  e.preventDefault();
                  onNavigate("landing");
                  setTimeout(() => {
                    document.getElementById("agent-architecture")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-white/70 hover:bg-[#17263D] hover:text-white transition-colors"
            >
              <GitBranch className="w-5 h-5 text-white/50" />
              <span className="font-body-md text-body-md">Architecture &amp; Pipeline</span>
            </a>
          </nav>
        </div>
      </div>

      {/* Telemetry Status Strip in Sidebar */}
      <div className="p-4 border-t border-white/10 bg-[#101A2B] flex flex-col gap-3">
        <div className="flex items-center justify-between text-white/60 font-caption text-caption">
          <span>Active Telemetry</span>
          <span className="flex items-center gap-1.5 text-[#20C6B6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#20C6B6] animate-pulse"></span>
            Online
          </span>
        </div>
        <div className="flex items-center justify-between text-white/50 font-code-inline text-code-inline">
          <span>Latency: 42ms</span>
          <span>F1: 99.42%</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
