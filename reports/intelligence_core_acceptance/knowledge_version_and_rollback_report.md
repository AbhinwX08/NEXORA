# RELAY AI — Knowledge Base Versioning & Atomic Rollback Report (Part 3)

## 1. Immutable Versioning Architecture

To protect production customer support against accidental corruption or unwanted policy changes, RELAY AI maintains persistent, immutable version snapshots under `data/knowledge/versions/`:

```
data/knowledge/
├── product_guide.json            # Active knowledge base file
└── versions/
    ├── versions_manifest.json    # Snapshot lineage & active pointer
    ├── v_1_0_0.json              # Baseline snapshot (7 verified articles)
    └── v_1_1_0.json              # Approved update snapshot
```

---

## 2. Atomic Rollback Mechanism

When an operator issues a rollback request via `POST /api/knowledge/versions/<id>/rollback`:
1. The snapshot file `data/knowledge/versions/{target_version_id}.json` is read and validated.
2. `data/knowledge/product_guide.json` is atomically overwritten.
3. The in-memory TF-IDF vectorizer and cosine similarity matrix are rebuilt synchronously via `ProductGuideService.reload()`.
4. `versions_manifest.json` updates `is_active` to point to the restored version.
5. Zero downtime or server restarts are required.

---

## 3. Verification Test Results

- **Test**: `test_faq_review_workflow_and_rollback` in `tests/test_intelligence_core.py`.
- **Result**:
  - Baseline `v_1_0_0` verified (7 articles).
  - Draft FAQ approved -> Version `v_1_1_0` created (8 articles).
  - Rollback to `v_1_0_0` invoked -> Confirmed restored to 7 articles, `active_version: "v_1_0_0"`, zero errors.

