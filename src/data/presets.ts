export interface PresetItem {
  id: string;
  name: string;
  badge: string;
  query: string;
  cat: string;
  intent: string;
  conf: string;
  bar: string;
  rationale: string;
  entities: string[];
  relay: string;
  doc: string;
  guidance: string;
  draft: string;
  verified: string;
  defaultTab: "verified" | "clarify" | "escalate";
}

export const PRESET_CONFIGS: Record<string, PresetItem> = {
  refund: {
    id: "refund",
    name: "01. Standard Refund Request",
    badge: "Deterministic Flow",
    query: "How can I request a refund for my purchase?",
    cat: "[REFUND]",
    intent: "refund_request",
    conf: "98.4%",
    bar: "98.4%",
    rationale: "Detected explicit semantic markers for refund initiation ('request a refund', 'purchase') matching Bitext class cluster 4.",
    entities: ["• Polite Inquiry Marker", "• Standard English Syntax", "• Financial Transaction Entity"],
    relay: '{intent: "refund_request", category: "refund", conf: 0.984, entities: ["purchase"]}',
    doc: "Bitext KB #REF-204",
    guidance: "“Standard 30-day refund window policy for digital and physical orders. Requires authenticated account order ID and verified invoice proof.”",
    draft: 'To request a refund for your purchase, please navigate to Account > Orders, select the item, and initiate the request. Eligible funds will process in 3–5 business days.',
    verified: "“To request a refund for your purchase, please navigate to Account > Orders, select your purchase, and click 'Request Refund'. If eligible under our 30-day return policy, funds will be returned to your original payment method within 3–5 business days.”",
    defaultTab: "verified",
  },
  order: {
    id: "order",
    name: "02. Shipment Tracking Delay",
    badge: "Logistics Query",
    query: "My order #8921 is delayed by 4 days, where is the courier?",
    cat: "[ORDER_TRACKING]",
    intent: "track_order",
    conf: "94.2%",
    bar: "94.2%",
    rationale: "Matched shipping logistics parameters with explicit identifier token #8921.",
    entities: ["• Order ID: #8921", "• Transit Latency: 4 days", "• Entity: Courier Query"],
    relay: '{intent: "track_order", order_id: 8921, days_delayed: 4, conf: 0.942}',
    doc: "Logistics Hub #LOG-102",
    guidance: "“Shipments delayed > 3 days qualify for priority dispatch re-routing and immediate carrier ping.”",
    draft: "Your package with tracking identifier #8921 is currently in transit with our regional carrier and has arrived at Hub Station 04.",
    verified: "“Your order #8921 is currently in transit. We have contacted the carrier to expedite delivery, and your updated tracking link is active in your dashboard.”",
    defaultTab: "verified",
  },
  billing: {
    id: "billing",
    name: "03. Double Charge Dispute",
    badge: "High Urgency",
    query: "I was charged twice on invoice INV-9042 and need my money reversed immediately!",
    cat: "[BILLING_DISPUTE]",
    intent: "dispute_charge",
    conf: "97.1%",
    bar: "97.1%",
    rationale: "High urgency sentiment detected with duplicate transaction flag on reference invoice INV-9042.",
    entities: ["• High Urgency Marker", "• Invoice: INV-9042", "• Duplicate Transaction"],
    relay: '{intent: "dispute_charge", invoice: "INV-9042", severity: "high", conf: 0.971}',
    doc: "Billing Protocol #BIL-401",
    guidance: "“Double charge reports requires automated ledger check followed by direct credit reversal confirmation.”",
    draft: "We located invoice INV-9042 and identified the duplicate charge authorization. Initiating rollback sequence.",
    verified: "“We verified the duplicate charge on invoice INV-9042. A reversal of the secondary transaction has been submitted and will post to your account within 24-48 hours.”",
    defaultTab: "escalate",
  },
  escalation: {
    id: "escalation",
    name: "04. Human Supervisor Handover",
    badge: "Direct Handover",
    query: "Can you transfer me directly to a human supervisor? This is unacceptable.",
    cat: "[ESCALATION]",
    intent: "human_transfer",
    conf: "99.8%",
    bar: "99.8%",
    rationale: "Explicit agent bypass request detected with negative sentiment markers. Immediate human handover mandated.",
    entities: ["• Sentiment: Frustrated", "• Direct Human Route Trigger", "• Bypass Autonomous"],
    relay: '{intent: "human_transfer", priority: "critical", trigger: "direct_user_request"}',
    doc: "Support Escalation Matrix #ESC-001",
    guidance: "“Direct supervisor requests must route to Tier-2 queue with full conversation trace.”",
    draft: "Routing ticket to active Tier-2 Supervisor console. Retaining all message context.",
    verified: "“Transferring you immediately to a Senior Resolution Specialist. Your conversation context has been shared to prevent repetition.”",
    defaultTab: "escalate",
  },
  ambiguous: {
    id: "ambiguous",
    name: "05. Ambiguous Specification",
    badge: "Uncertainty Trigger",
    query: "What are your software specs?",
    cat: "[GENERAL_INQUIRY]",
    intent: "clarify_specs",
    conf: "82.5%",
    bar: "82.5%",
    rationale: "Query lacks specificity regarding product edition (Cloud SaaS vs. Local On-Premises node). Clarification required.",
    entities: ["• Ambiguous Scope", "• Product Edition Unspecified", "• Technical Inquiry"],
    relay: '{intent: "clarify_specs", slot_status: "incomplete", conf: 0.825}',
    doc: "Product Catalog #SYS-090",
    guidance: "“When deployment type is omitted, request user confirmation between Cloud and On-Prem architectures.”",
    draft: "Could you specify whether you are interested in our Cloud SaaS requirements or On-Premises Enterprise mesh hardware specs?",
    verified: "“To provide the exact technical specifications, could you let us know if you require Cloud Mesh or On-Premise requirements?”",
    defaultTab: "clarify",
  },
};
