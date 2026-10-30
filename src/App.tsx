import React, { useState } from "react";
import { ThemeProvider } from "@/lib/theme";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header, ViewType } from "@/components/layout/Header";
import { LandingPage } from "@/components/landing/LandingPage";
import { LiveWorkspace } from "@/components/workspace/LiveWorkspace";
import { EvidenceLedger } from "@/components/evidence/EvidenceLedger";
import { DecisionReplayLab } from "@/components/replay/DecisionReplayLab";
import { DatasetExplorer } from "@/components/dataset/DatasetExplorer";
import { EvaluationDashboard } from "@/components/evaluation/EvaluationDashboard";
import { FloatingAssistant } from "@/components/assistant/FloatingAssistant";

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>("landing");

  const handleNavigate = (view: ViewType) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-[#F5F7FB] dark:bg-[#0B1320] text-slate-900 dark:text-white flex flex-col font-sans transition-colors duration-200">
        {/* 1. Persistent Left Sidebar (Desktop) */}
        <Sidebar currentView={currentView} onNavigate={handleNavigate} />

        {/* 2. Main Content Frame offset by sidebar width on desktop */}
        <div className="lg:pl-72 flex flex-col min-h-screen w-full">
          {/* 3. Persistent Top Header Bar */}
          <Header currentView={currentView} onNavigate={handleNavigate} />

          {/* 4. Active Route View with Top Padding for Fixed Header */}
          <main className="w-full pt-16 flex-1 flex flex-col">
            {currentView === "landing" && (
              <LandingPage
                onOpenWorkspace={() => handleNavigate("workspace")}
                onOpenDataset={() => handleNavigate("dataset")}
                onOpenEvaluation={() => handleNavigate("evaluation")}
                onOpenEvidence={() => handleNavigate("evidence")}
                onOpenReplay={() => handleNavigate("replay")}
              />
            )}

            {currentView === "workspace" && (
              <LiveWorkspace onBackToLanding={() => handleNavigate("landing")} />
            )}

            {currentView === "evidence" && <EvidenceLedger />}

            {currentView === "replay" && <DecisionReplayLab />}

            {currentView === "dataset" && <DatasetExplorer />}

            {currentView === "evaluation" && <EvaluationDashboard />}
          </main>
        </div>

        {/* 5. Persistent Floating Dual-Mode Chatbot & Half-Duplex Voice Assistant */}
        <FloatingAssistant />
      </div>
    </ThemeProvider>
  );
};

export default App;
