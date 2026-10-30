import { describe, it, expect } from "vitest";
import { DATASET_METRICS, OFFLINE_EVALUATION_METRICS } from "../data/datasetMetadata";
import { SAMPLE_PRESETS } from "../data/presets";

describe("Dataset Metadata & Presets Integrity", () => {
  it("verifies accurate dataset record counts and partitions", () => {
    expect(DATASET_METRICS.trainingRecords).toBe(18810);
    expect(DATASET_METRICS.validationRecords).toBe(4031);
    expect(DATASET_METRICS.totalRecords).toBe(22841);
    expect(DATASET_METRICS.trainingRecords + DATASET_METRICS.validationRecords).toBe(22841);
    expect(DATASET_METRICS.uniqueIntents).toBe(27);
    expect(DATASET_METRICS.uniqueCategories).toBe(11);
    expect(DATASET_METRICS.uniqueFlagsCombinations).toBe(349);
  });

  it("ensures categories list matches the 11 verified categories", () => {
    const expected = [
      "ACCOUNT", "CANCEL", "CONTACT", "DELIVERY", "FEEDBACK",
      "INVOICE", "ORDER", "PAYMENT", "REFUND", "SHIPPING", "SUBSCRIPTION"
    ];
    expect(DATASET_METRICS.categories).toEqual(expected);
  });

  it("preserves flags disclaimer without inventing 5-flag definitions", () => {
    const flagsCol = DATASET_METRICS.datasetColumns.find((c) => c.name === "flags");
    expect(flagsCol).toBeDefined();
    expect(flagsCol?.description).toContain("349 combinations");
    expect(flagsCol?.description).toContain("No official codebook provided");
  });

  it("validates offline evaluation metrics source integrity", () => {
    expect(OFFLINE_EVALUATION_METRICS.intentClassification.accuracy).toBe(1.0);
    expect(OFFLINE_EVALUATION_METRICS.intentClassification.macroF1).toBe(1.0);
    expect(OFFLINE_EVALUATION_METRICS.intentClassification.expectedCalibrationErrorECE).toBe(0.0119);
    expect(OFFLINE_EVALUATION_METRICS.responseRetrieval.recallAt1).toBe(1.0);
    expect(OFFLINE_EVALUATION_METRICS.responseRetrieval.meanCosineSimilarity).toBeCloseTo(0.8467, 3);
    expect(OFFLINE_EVALUATION_METRICS.disclaimer).toContain("offline benchmark evaluations");
  });

  it("verifies sample presets count is 5 or fewer and does not contain fabricated outputs", () => {
    expect(SAMPLE_PRESETS.length).toBeLessThanOrEqual(5);
    for (const preset of SAMPLE_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.label).toBeTruthy();
      expect(preset.query).toBeTruthy();
      expect(preset.expectedFlow).toBeTruthy();
      // Ensure no fabricated simulated results are present in preset objects
      expect((preset as any).verified).toBeUndefined();
      expect((preset as any).draft).toBeUndefined();
      expect((preset as any).doc).toBeUndefined();
      expect((preset as any).conf).toBeUndefined();
    }
  });
});

