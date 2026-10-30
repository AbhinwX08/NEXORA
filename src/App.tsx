import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { LandingPage } from "@/components/landing/LandingPage";
import { LiveWorkspace } from "@/components/workspace/LiveWorkspace";

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<"landing" | "workspace">("landing");

  const handleNavigate = (view: "landing" | "workspace") => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex flex-col font-sans">
      {/* 1. Persistent Left Sidebar (Desktop) */}
      <Sidebar currentView={currentView} onNavigate={handleNavigate} />

      {/* 2. Main Content Frame offset by sidebar width on desktop */}
      <div className="lg:pl-72 flex flex-col min-h-screen w-full">
        {/* 3. Persistent Top Header Bar */}
        <Header currentView={currentView} onNavigate={handleNavigate} />

        {/* 4. Active Route View with Top Padding for Fixed Header */}
        <main className="w-full pt-16 flex-1 flex flex-col">
          {currentView === "landing" ? (
            <LandingPage onOpenWorkspace={() => handleNavigate("workspace")} />
          ) : (
            <LiveWorkspace onBackToLanding={() => handleNavigate("landing")} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
