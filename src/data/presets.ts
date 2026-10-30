/**
 * RELAY AI — Sample Query Presets
 * Five clearly labelled representative customer inquiries designed to test
 * different deterministic multi-agent branches in the real backend pipeline.
 *
 * NOTE: Selecting a preset ONLY populates the query console input;
 * it never simulates or fabricates artificial AI output.
 */

export interface PresetItem {
  id: string;
  label: string;
  badge: string;
  query: string;
  expectedFlow: string;
  defaultSlots?: Record<string, string>;
}

export const SAMPLE_PRESETS: PresetItem[] = [
  {
    id: "cancel-with-slot",
    label: "01. Order Cancellation (With Slot)",
    badge: "Automated Resolution",
    query: "I want to cancel my order #98214",
    expectedFlow: "A1 detects cancel_order intent; A2 extracts order #98214 and resolves response; Validation approves automated response.",
    defaultSlots: { "Order Number": "98214" },
  },
  {
    id: "cancel-missing-slot",
    label: "02. Order Cancellation (Missing Slot)",
    badge: "Slot Clarification",
    query: "I would like to cancel my order please",
    expectedFlow: "A1 detects cancel_order intent; A2 flags missing Order Number; Validation enforces polite parameter clarification.",
  },
  {
    id: "invoice-inquiry",
    label: "03. Invoice Retrieval",
    badge: "Document Retrieval",
    query: "Where can I find and download a copy of invoice INV-9042?",
    expectedFlow: "A1 predicts get_invoice intent; A2 matches invoice portal instructions; Validation verifies parameter completeness.",
    defaultSlots: { "Invoice Number": "INV-9042" },
  },
  {
    id: "human-escalation",
    label: "04. Human Agent Escalation",
    badge: "Policy Escalation",
    query: "Can you please connect me directly with a live human representative?",
    expectedFlow: "Validation Gate 2 detects human escalation keyword; bypasses automated response; flags escalation requested.",
  },
  {
    id: "out-of-domain",
    label: "05. Out-of-Domain Rejection",
    badge: "Domain Guardrail",
    query: "What is the recipe for baking artisanal sourdough bread?",
    expectedFlow: "Validation Gate 3 catches low domain confidence & similarity; triggers polite out-of-domain rejection.",
  },
];
