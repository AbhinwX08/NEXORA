import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { Header } from "../components/layout/Header";
import { Sidebar } from "../components/layout/Sidebar";
import { WorkspacePreviewCard } from "../components/landing/WorkspacePreviewCard";
import { LiveWorkspace } from "../components/workspace/LiveWorkspace";
import { DatasetExplorer } from "../components/dataset/DatasetExplorer";
import { EvaluationDashboard } from "../components/evaluation/EvaluationDashboard";
import { EvidenceLedger } from "../components/evidence/EvidenceLedger";
import { DecisionReplayLab } from "../components/replay/DecisionReplayLab";
import { FloatingAssistant } from "../components/assistant/FloatingAssistant";

describe("Component Rendering & Truthfulness", () => {
  it("renders Header with truthful dataset figures and without fabricated profile", () => {
    const html = renderToString(<Header currentView="landing" onNavigate={() => {}} />);
    expect(html).toContain("18,810 Train");
    expect(html).toContain("4,031 Val");
    expect(html).toContain("27 Intents");
    expect(html).toContain("11 Categories");
    expect(html).not.toContain("Dr. A. Verma");
    expect(html).not.toContain("26,872");
    expect(html).not.toContain("10 Categories");
  });

  it("renders Sidebar with all 6 view navigation buttons and truthful partition data", () => {
    const html = renderToString(<Sidebar currentView="workspace" onNavigate={() => {}} />);
    expect(html).toContain("Overview &amp; Landing");
    expect(html).toContain("Live AI Workspace");
    expect(html).toContain("Evidence Ledger");
    expect(html).toContain("Decision Replay Lab");
    expect(html).toContain("Dataset Explorer");
    expect(html).toContain("Evaluation &amp; Checkpoint");
    expect(html).toContain("18,810");
    expect(html).toContain("4,031");
    // Ensure fake telemetry is absent
    expect(html).not.toContain("Latency: 42ms");
    expect(html).not.toContain("F1: 99.42%");
  });

  it("renders WorkspacePreviewCard with explicit illustrative demonstration disclaimer", () => {
    const html = renderToString(<WorkspacePreviewCard />);
    expect(html).toContain("ILLUSTRATIVE PIPELINE PREVIEW");
    expect(html).toContain("18,810 Instruction Pairs");
    expect(html).toContain("Webhook Standby");
    // Ensure fake identifiers and claims are absent
    expect(html).not.toContain("KB #REF-204");
    expect(html).not.toContain("0.00% (Grounded)");
    expect(html).not.toContain("100% Certified");
  });

  it("renders LiveWorkspace with query console and honest webhook element", () => {
    const html = renderToString(<LiveWorkspace onBackToLanding={() => {}} />);
    expect(html).toContain("Customer Query Console");
    expect(html).toContain("Sample Test Presets");
    expect(html).toContain("Webhook Not Configured");
    expect(html).toContain("A1 — Intent Analyst");
    expect(html).toContain("A2 — Response Specialist");
    expect(html).toContain("Validation Agent Gate");
    // Ensure fake simulation triggers are absent
    expect(html).not.toContain("Simulate Trace");
    expect(html).not.toContain("Dispatch to Customer Webhook");
  });

  it("renders DatasetExplorer with complete column definitions and category statistics", () => {
    const html = renderToString(<DatasetExplorer />);
    expect(html).toContain("18,810");
    expect(html).toContain("4,031");
    expect(html).toContain("22,841");
    expect(html).toContain("flags");
    expect(html).toContain("instruction");
    expect(html).toContain("category");
    expect(html).toContain("intent");
    expect(html).toContain("response");
    expect(html).toContain("349 distinct");
  });

  it("renders EvaluationDashboard with verified offline benchmark metrics", () => {
    const html = renderToString(<EvaluationDashboard />);
    expect(html).toContain("Validation Accuracy");
    expect(html).toContain("100.0%");
    expect(html).toContain("1.19%");
    expect(html).toContain("Platt Calibration");
    expect(html).toContain("4,031 Held-Out Validation Samples");
  });

  it("renders EvidenceLedger with 5 provenance layers and knowledge gap link", () => {
    const html = renderToString(<EvidenceLedger />);
    expect(html).toContain("Resolution Evidence Ledger");
    expect(html).toContain("Model Prediction");
    expect(html).toContain("Corpus Match");
    expect(html).toContain("Deterministic Checks");
    expect(html).toContain("Customer Slots");
    expect(html).toContain("Knowledge Gap Log");
  });

  it("renders DecisionReplayLab with counterfactual sensitivity suites and variant cards", () => {
    const html = renderToString(<DecisionReplayLab />);
    expect(html).toContain("Decision Replay Lab");
    expect(html).toContain("PRE-BUILT SENSITIVITY &amp; REGRESSION SUITES");
    expect(html).toContain("Variant A (Base Query)");
    expect(html).toContain("Variant B (Perturbation / Counterfactual)");
    expect(html).toContain("Execute Comparative Replay");
  });

  it("renders FloatingAssistant with launch button", () => {
    const html = renderToString(<FloatingAssistant />);
    expect(html).toContain("RELAY Assistant");
  });
});
