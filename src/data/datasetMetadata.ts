/**
 * RELAY AI — Verified Dataset & Evaluation Metadata
 * Single source of truth for corpus metrics and offline validation benchmarks.
 * Derived from data/raw/train.csv, data/raw/validation.csv, and reports/*.json
 */

export interface CategoryStat {
  category: string;
  trainCount: number;
  valCount: number;
  totalCount: number;
  intents: string[];
  description: string;
}

export const DATASET_METRICS = {
  trainingRecords: 18810,
  validationRecords: 4031,
  totalRecords: 22841,
  uniqueIntents: 27,
  uniqueCategories: 11,
  uniqueFlagsCombinations: 349,
  datasetColumns: [
    {
      name: "flags",
      type: "string",
      description: "Linguistic and stylistic instruction tags (349 combinations, e.g. 'B', 'ILPW', 'CDE'). No official codebook provided; characters are not interpreted as discrete independent flags.",
    },
    {
      name: "instruction",
      type: "string",
      description: "Natural language customer query or support request utterance.",
    },
    {
      name: "category",
      type: "string",
      description: "One of 11 operational business categories.",
    },
    {
      name: "intent",
      type: "string",
      description: "Specific actionable task intent among 27 distinct classes.",
    },
    {
      name: "response",
      type: "string",
      description: "Support response template, including procedural guidance and dynamic {{Slot}} variables.",
    },
  ],
  categories: [
    "ACCOUNT",
    "CANCEL",
    "CONTACT",
    "DELIVERY",
    "FEEDBACK",
    "INVOICE",
    "ORDER",
    "PAYMENT",
    "REFUND",
    "SHIPPING",
    "SUBSCRIPTION",
  ],
  categoryStats: [
    {
      category: "ACCOUNT",
      trainCount: 4189,
      valCount: 899,
      totalCount: 5088,
      intents: ["create_account", "delete_account", "edit_account", "recover_password", "registration_problems", "switch_account"],
      description: "User profile management, credentials, security, and registration.",
    },
    {
      category: "ORDER",
      trainCount: 2793,
      valCount: 597,
      totalCount: 3390,
      intents: ["cancel_order", "change_order", "place_order", "track_order"],
      description: "Purchase placement, modifications, logistics tracking, and order cancellations.",
    },
    {
      category: "REFUND",
      trainCount: 2095,
      valCount: 447,
      totalCount: 2542,
      intents: ["check_refund_policy", "get_refund", "track_refund"],
      description: "Return authorizations, policy guidelines, and reimbursement tracking.",
    },
    {
      category: "CONTACT",
      trainCount: 1399,
      valCount: 300,
      totalCount: 1699,
      intents: ["contact_customer_service", "contact_human_agent"],
      description: "Assistance channels, support hours, and human agent escalation.",
    },
    {
      category: "INVOICE",
      trainCount: 1399,
      valCount: 300,
      totalCount: 1699,
      intents: ["check_invoice", "get_invoice"],
      description: "Billing documentation, receipts, line items, and invoice retrieval.",
    },
    {
      category: "FEEDBACK",
      trainCount: 1398,
      valCount: 300,
      totalCount: 1698,
      intents: ["complaint", "review"],
      description: "Customer sentiment, formal reclamations, and product feedback.",
    },
    {
      category: "PAYMENT",
      trainCount: 1398,
      valCount: 300,
      totalCount: 1698,
      intents: ["check_payment_methods", "payment_issue"],
      description: "Payment methods, transaction errors, and checkout issues.",
    },
    {
      category: "DELIVERY",
      trainCount: 1396,
      valCount: 299,
      totalCount: 1695,
      intents: ["delivery_options", "delivery_period"],
      description: "Courier options, delivery timeframes, and transit schedules.",
    },
    {
      category: "SHIPPING",
      trainCount: 1379,
      valCount: 296,
      totalCount: 1675,
      intents: ["change_shipping_address", "set_up_shipping_address"],
      description: "Recipient addresses, postal setup, and transit destinations.",
    },
    {
      category: "SUBSCRIPTION",
      trainCount: 699,
      valCount: 150,
      totalCount: 849,
      intents: ["newsletter_subscription"],
      description: "Marketing communications and recurring subscription preferences.",
    },
    {
      category: "CANCEL",
      trainCount: 665,
      valCount: 143,
      totalCount: 808,
      intents: ["check_cancellation_fee"],
      description: "Cancellation penalty rules, service terms, and fee assessments.",
    },
  ] as CategoryStat[],
};

export const OFFLINE_EVALUATION_METRICS = {
  context: "Offline evaluation on 4,031 held-out validation samples (data/raw/validation.csv)",
  reportSources: [
    "reports/final_metrics.json",
    "reports/optimized_model_metrics.json",
    "reports/a2_retrieval_metrics.json",
    "reports/selective_prediction_metrics.json",
  ],
  intentClassification: {
    datasetSplit: "Validation Set (4,031 samples)",
    accuracy: 1.0,
    macroF1: 1.0,
    weightedF1: 1.0,
    top3Accuracy: 1.0,
    expectedCalibrationErrorECE: 0.0119,
    maximumCalibrationErrorMCE: 0.3612,
    brierScore: 0.00054,
    meanCalibratedConfidence: 0.9881,
    benchmarkLatencyPerQueryMs: 0.372,
  },
  responseRetrieval: {
    datasetSplit: "Train Index (18,810 samples) tested against validation set",
    recallAt1: 1.0,
    recallAt3: 1.0,
    recallAt5: 1.0,
    meanReciprocalRankMRR: 1.0,
    meanCosineSimilarity: 0.8467,
    indexingMethod: "Dual TF-IDF vector space with category-constrained cosine similarity",
  },
  disclaimer:
    "All figures above represent offline benchmark evaluations conducted against the fixed validation split. They do not represent live operational success rates or zero-hallucination guarantees in open-ended production environments.",
};

