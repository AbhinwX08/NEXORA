import React, { useState } from "react";
import {
  Database,
  Layers,
  CheckCircle2,
  FileText,
  Search,
  ShieldAlert,
} from "lucide-react";
import { DATASET_METRICS } from "@/data/datasetMetadata";

export const DatasetExplorer: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const allIntents = DATASET_METRICS.categoryStats.flatMap((c) =>
    c.intents.map((i) => ({ intent: i, category: c.category }))
  );

  const filteredIntents = allIntents.filter((item) => {
    const matchesCat = selectedCategory === "ALL" || item.category === selectedCategory;
    const matchesQuery = searchQuery === "" ||
      item.intent.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="flex flex-col w-full bg-[#F5F7FB] min-h-screen text-left">
      {/* 1. Header Bar */}
      <div className="bg-white border-b border-[#E3E8F0] px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#101A2B] text-[#20C6B6] flex items-center justify-center shadow-md">
                <Database className="w-5 h-5 text-[#20C6B6]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#101A2B] tracking-tight">
                  Dataset Explorer
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  Corpus Schema, Split Distribution, and Verified Ground Truth Records
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-mono bg-[#F5F7FB] border border-[#E3E8F0] px-3.5 py-2 rounded-xl text-[#101A2B]">
            <span className="w-2 h-2 rounded-full bg-[#20C6B6]"></span>
            <span>Split: 18,810 Train / 4,031 Val</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 w-full">
        {/* 2. Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-4 sm:p-5 shadow-sm">
            <span className="text-xs uppercase font-mono tracking-wider text-[#64748B] block mb-1">
              Training Records
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#101A2B]">
              {DATASET_METRICS.trainingRecords.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#64748B] block mt-1">
              82.35% corpus partition
            </span>
          </div>

          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-4 sm:p-5 shadow-sm">
            <span className="text-xs uppercase font-mono tracking-wider text-[#64748B] block mb-1">
              Validation Records
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#456BFA]">
              {DATASET_METRICS.validationRecords.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#64748B] block mt-1">
              17.65% held-out test split
            </span>
          </div>

          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-4 sm:p-5 shadow-sm">
            <span className="text-xs uppercase font-mono tracking-wider text-[#64748B] block mb-1">
              Total Records
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#101A2B]">
              {DATASET_METRICS.totalRecords.toLocaleString()}
            </span>
            <span className="text-[11px] text-[#64748B] block mt-1">
              Supplied CSV records
            </span>
          </div>

          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-4 sm:p-5 shadow-sm">
            <span className="text-xs uppercase font-mono tracking-wider text-[#64748B] block mb-1">
              Supported Intents
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#20C6B6]">
              {DATASET_METRICS.uniqueIntents}
            </span>
            <span className="text-[11px] text-[#64748B] block mt-1">
              Multiclass classification targets
            </span>
          </div>

          <div className="bg-white border border-[#E3E8F0] rounded-2xl p-4 sm:p-5 shadow-sm col-span-2 lg:col-span-1">
            <span className="text-xs uppercase font-mono tracking-wider text-[#64748B] block mb-1">
              Categories
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-[#101A2B]">
              {DATASET_METRICS.uniqueCategories}
            </span>
            <span className="text-[11px] text-[#64748B] block mt-1">
              High-level domain clusters
            </span>
          </div>
        </div>

        {/* 3. Important Grounding Limitation Notice */}
        <div className="bg-[#FFF8E6] border border-[#F4B860]/40 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#78350F] leading-relaxed">
            <strong className="font-semibold text-[#92400E]">Data Source Boundary & Integrity Note:</strong> The supplied dataset
            consists strictly of customer service instruction-response pairs for NLP classification and template retrieval. It does <em>not</em> include
            live customer accounts, payment ledgers, real shipping carrier APIs, or live refund transactions. The flags field contains 349 distinct
            character combinations without an official codebook; RELAY AI does not fabricate artificial definitions for individual flag characters.
          </div>
        </div>

        {/* 4. Column Schema Specification */}
        <div className="bg-white border border-[#E3E8F0] rounded-2xl p-5 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-[#101A2B] mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#456BFA]" />
            Dataset Schema & Column Definitions
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F8FAFC] border-y border-[#E3E8F0] text-[#64748B] font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Column Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Role & Description</th>
                  <th className="py-3 px-4">Example Pattern</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8F0]">
                {DATASET_METRICS.datasetColumns.map((col) => (
                  <tr key={col.name} className="hover:bg-[#F8FAFC]/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#101A2B]">
                      {col.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#64748B] text-xs">
                      {col.type}
                    </td>
                    <td className="py-3.5 px-4 text-[#334155] leading-relaxed">
                      {col.description}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-[#64748B]">
                      {col.name === "flags" && "B, ILPW, CDE"}
                      {col.name === "instruction" && "I want to cancel my order #98214"}
                      {col.name === "category" && "ORDER, REFUND, INVOICE"}
                      {col.name === "intent" && "cancel_order, get_refund"}
                      {col.name === "response" && "To cancel your order {{Order Number}}..."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Category Breakdown & Intent Catalogue */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Category Distribution Table (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-[#E3E8F0] rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-base sm:text-lg font-bold text-[#101A2B] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#20C6B6]" />
                Category Distribution ({DATASET_METRICS.uniqueCategories})
              </h2>
              <span className="text-xs text-[#64748B] font-mono">
                11 Verified Categories
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#F8FAFC] border-y border-[#E3E8F0] text-[#64748B] font-mono uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Train</th>
                    <th className="py-2.5 px-3 text-right">Val</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-right">% of Corpus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E8F0]">
                  {DATASET_METRICS.categoryStats.map((c) => {
                    const pct = ((c.totalCount / DATASET_METRICS.totalRecords) * 100).toFixed(1);
                    const isSelected = selectedCategory === c.category;
                    return (
                      <tr
                        key={c.category}
                        onClick={() => setSelectedCategory(isSelected ? "ALL" : c.category)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? "bg-[#456BFA]/10 font-semibold" : "hover:bg-[#F8FAFC]"
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-[#101A2B] flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-[#456BFA]" : "bg-[#94A3B8]"}`}></span>
                          {c.category}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#475569]">
                          {c.trainCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-[#475569]">
                          {c.valCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#101A2B]">
                          {c.totalCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-xs text-[#64748B]">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-[#64748B] mt-3">
              Tip: Click any row to filter the intent catalogue on the right.
            </p>
          </div>

          {/* Intent Catalogue (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-[#E3E8F0] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E8F0]">
              <h2 className="text-base font-bold text-[#101A2B] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#456BFA]" />
                Intent Catalogue ({filteredIntents.length})
              </h2>
              {selectedCategory !== "ALL" && (
                <button
                  onClick={() => setSelectedCategory("ALL")}
                  className="text-xs text-[#456BFA] hover:underline font-mono"
                >
                  Clear filter ({selectedCategory})
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search intents or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E3E8F0] bg-[#F8FAFC] focus:outline-none focus:border-[#456BFA]"
              />
            </div>

            {/* Intent Badges List */}
            <div className="flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-1">
              {filteredIntents.map((item) => (
                <div
                  key={item.intent}
                  className="p-2.5 rounded-xl border border-[#E3E8F0] bg-[#F8FAFC] flex items-center justify-between hover:border-[#456BFA]/40 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-[#101A2B]">
                      {item.intent}
                    </span>
                    <span className="text-[10px] font-mono text-[#64748B]">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#E3E8F0] text-[#475569]">
                    A1 Target
                  </span>
                </div>
              ))}

              {filteredIntents.length === 0 && (
                <div className="p-6 text-center text-xs text-[#94A3B8]">
                  No intents match the active search or category filter.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetExplorer;
