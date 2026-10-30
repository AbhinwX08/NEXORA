# RELAY AI — Retrieval Regression Benchmark Report (Part 3)

## 1. Regression Benchmark Methodology

Every modification to the knowledge base (adding an approved FAQ or rolling back) carries the risk of vector space drift, where newly added tokens degrade similarity scores for established queries.

The `run_retrieval_benchmark()` method executes a regression test suite across the active knowledge base, evaluating:
- **Individual Similarity**: Must exceed minimum cutoff ($s \ge 0.18$).
- **Mean Similarity**: Must meet or exceed baseline fidelity ($\overline{s} \ge 0.25$).
- **Passed Query Ratio**: Must achieve 100% (6/6).

---

## 2. Benchmark Execution Results

Tested against active knowledge base via `GET /api/knowledge/benchmark`:

| Benchmark Query | Expected Grounding Document | Observed Similarity | Status |
|---|---|---|---|
| *"How does Platt sigmoid calibration work in RELAY AI?"* | Probability Calibration & Uncertainty Metrics | 0.274 | **PASS** |
| *"What are the four coordinated stages of the multi-agent pipeline?"* | Multi-Agent Pipeline Architecture | 0.313 | **PASS** |
| *"What are the supported customer categories in RELAY AI?"* | Safety Policies & Anti-Fabrication Guardrails | 0.202 | **PASS** |
| *"What are the anti-fabrication safety policies?"* | Safety Policies & Anti-Fabrication Guardrails | 0.292 | **PASS** |
| *"What REST API endpoints are available?"* | RELAY AI REST API Endpoints | 0.374 | **PASS** |
| *"How is voice turn-taking handled?"* | Voice Support & Turn-Taking Contract | 0.357 | **PASS** |

### Benchmark Summary Metrics
- **Total Test Inquiries**: 6
- **Passed Inquiries**: 6 (100.0%)
- **Mean Cosine Similarity**: **0.302** (Exceeds 0.25 target)
- **Minimum Similarity**: **0.202** (Exceeds 0.18 cutoff)
- **Zero-Regression Guarantee (`no_regression`)**: **TRUE**

