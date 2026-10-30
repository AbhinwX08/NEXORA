"""
RELAY AI — Baseline Intent Classification Models
Trains and compares 5 candidate baseline models using Stratified Cross-Validation on train.csv
and evaluates against the validation dataset (both all 4,031 rows and 3,572 unseen rows).

Outputs:
- reports/baseline_comparison.csv
- reports/baseline_evaluation.json
- artifacts/models/baseline_intent_model.joblib
"""

import os
import sys
import json
import time
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List

from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import ComplementNB
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    classification_report,
    confusion_matrix
)

# Import local preprocessor
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from nlp.preprocessor import TextPreprocessor


def compute_top_k_accuracy(model: Pipeline, X, y, k: int = 3) -> float:
    """
    Computes top-k accuracy using decision_function or predict_proba.
    """
    clf = model.named_steps["clf"]
    X_trans = X
    for name, step in model.steps[:-1]:
        X_trans = step.transform(X_trans)

    classes = clf.classes_
    if hasattr(clf, "decision_function"):
        scores = clf.decision_function(X_trans)
    elif hasattr(clf, "predict_proba"):
        scores = clf.predict_proba(X_trans)
    else:
        return float("nan")

    top_k_indices = np.argsort(scores, axis=1)[:, -k:]
    y_arr = np.array(y)
    correct = 0
    for i, true_label in enumerate(y_arr):
        pred_labels = classes[top_k_indices[i]]
        if true_label in pred_labels:
            correct += 1
    return correct / len(y_arr)


def train_and_evaluate_baselines(
    train_path: str = "data/raw/train.csv",
    val_path: str = "data/raw/validation.csv",
    reports_dir: str = "reports",
    models_dir: str = "artifacts/models"
):
    print("=" * 70)
    print("RELAY AI — Phase 1: Baseline Models Training & Evaluation")
    print("=" * 70)

    # 1. Load Data
    train_df = pd.read_csv(train_path)
    val_df = pd.read_csv(val_path)

    X_train = train_df["instruction"]
    y_train = train_df["intent"]

    X_val_all = val_df["instruction"]
    y_val_all = val_df["intent"]

    # Identify exact overlapping instructions
    train_instr_set = set(X_train)
    unseen_mask = ~val_df["instruction"].isin(train_instr_set)
    X_val_unseen = val_df.loc[unseen_mask, "instruction"]
    y_val_unseen = val_df.loc[unseen_mask, "intent"]

    print(f"Training samples: {len(X_train):,}")
    print(f"Validation total: {len(X_val_all):,} rows")
    print(f"Validation unseen instructions: {len(X_val_unseen):,} rows")

    # 2. Define 5 Candidate Baseline Pipelines
    # All pipelines encapsulate TextPreprocessor, Vectorizer, and Classifier
    candidates = {
        "A_Word_LogReg": Pipeline([
            ("preprocessor", TextPreprocessor()),
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
            ("clf", LogisticRegression(max_iter=1000, random_state=42))
        ]),
        "B_Word_LinearSVC": Pipeline([
            ("preprocessor", TextPreprocessor()),
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
            ("clf", LinearSVC(random_state=42, dual="auto"))
        ]),
        "C_Char_LinearSVC": Pipeline([
            ("preprocessor", TextPreprocessor()),
            ("tfidf", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5))),
            ("clf", LinearSVC(random_state=42, dual="auto"))
        ]),
        "D_WordChar_LinearSVC": Pipeline([
            ("preprocessor", TextPreprocessor()),
            ("union", FeatureUnion([
                ("word", TfidfVectorizer(ngram_range=(1, 2))),
                ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5)))
            ])),
            ("clf", LinearSVC(random_state=42, dual="auto"))
        ]),
        "E_ComplementNB": Pipeline([
            ("preprocessor", TextPreprocessor()),
            ("tfidf", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)),
            ("clf", ComplementNB())
        ])
    }

    # 3. Stratified 5-Fold Cross Validation on Train Data Only
    print("\nRunning 5-fold Stratified Cross-Validation on train.csv...")
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    scoring = {
        "acc": "accuracy",
        "macro_f1": "f1_macro",
        "weighted_f1": "f1_weighted",
        "macro_precision": "precision_macro",
        "macro_recall": "recall_macro"
    }

    cv_results = {}
    for name, pipe in candidates.items():
        t0 = time.time()
        scores = cross_validate(pipe, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)
        dur = time.time() - t0
        cv_results[name] = {
            "cv_accuracy_mean": float(np.mean(scores["test_acc"])),
            "cv_accuracy_std": float(np.std(scores["test_acc"])),
            "cv_macro_f1_mean": float(np.mean(scores["test_macro_f1"])),
            "cv_macro_f1_std": float(np.std(scores["test_macro_f1"])),
            "cv_weighted_f1_mean": float(np.mean(scores["test_weighted_f1"])),
            "cv_macro_precision_mean": float(np.mean(scores["test_macro_precision"])),
            "cv_macro_recall_mean": float(np.mean(scores["test_macro_recall"])),
            "cv_fit_time_mean": float(np.mean(scores["fit_time"])),
            "total_cv_time_sec": float(dur)
        }
        print(f" -> {name:20s} | CV Acc: {cv_results[name]['cv_accuracy_mean']*100:.2f}% | Macro-F1: {cv_results[name]['cv_macro_f1_mean']*100:.2f}% ({dur:.1f}s)")

    # 4. Train on Full train.csv and Evaluate on Validation Sets
    print("\nTraining models on full train.csv and evaluating on validation sets...")
    comparison_rows = []
    full_eval_dict = {
        "metadata": {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "train_samples": len(X_train),
            "val_all_samples": len(X_val_all),
            "val_unseen_samples": len(X_val_unseen),
            "num_classes": len(sorted(y_train.unique())),
            "classes": sorted(y_train.unique()),
            "preprocessing_config": TextPreprocessor().get_config()
        },
        "cv_results": cv_results,
        "models": {}
    }

    best_model_name = None
    best_cv_f1 = -1.0
    trained_models = {}

    for name, pipe in candidates.items():
        t0 = time.time()
        pipe.fit(X_train, y_train)
        fit_dur = time.time() - t0
        trained_models[name] = pipe

        # Predictions on All Validation (4,031)
        t_infer0 = time.time()
        preds_all = pipe.predict(X_val_all)
        infer_dur = time.time() - t_infer0

        acc_all = accuracy_score(y_val_all, preds_all)
        f1_macro_all = f1_score(y_val_all, preds_all, average="macro")
        f1_weighted_all = f1_score(y_val_all, preds_all, average="weighted")
        prec_macro_all = precision_score(y_val_all, preds_all, average="macro", zero_division=0)
        rec_macro_all = recall_score(y_val_all, preds_all, average="macro", zero_division=0)
        top3_acc_all = compute_top_k_accuracy(pipe, X_val_all, y_val_all, k=3)

        # Predictions on Unseen Validation (3,572)
        preds_unseen = pipe.predict(X_val_unseen)
        acc_unseen = accuracy_score(y_val_unseen, preds_unseen)
        f1_macro_unseen = f1_score(y_val_unseen, preds_unseen, average="macro")
        f1_weighted_unseen = f1_score(y_val_unseen, preds_unseen, average="weighted")
        prec_macro_unseen = precision_score(y_val_unseen, preds_unseen, average="macro", zero_division=0)
        rec_macro_unseen = recall_score(y_val_unseen, preds_unseen, average="macro", zero_division=0)
        top3_acc_unseen = compute_top_k_accuracy(pipe, X_val_unseen, y_val_unseen, k=3)

        # Detailed classification report
        cls_rep = classification_report(y_val_all, preds_all, output_dict=True, zero_division=0)
        cm = confusion_matrix(y_val_all, preds_all, labels=full_eval_dict["metadata"]["classes"]).tolist()

        full_eval_dict["models"][name] = {
            "cv_metrics": cv_results[name],
            "validation_all": {
                "accuracy": float(acc_all),
                "macro_f1": float(f1_macro_all),
                "weighted_f1": float(f1_weighted_all),
                "macro_precision": float(prec_macro_all),
                "macro_recall": float(rec_macro_all),
                "top3_accuracy": float(top3_acc_all),
                "inference_time_sec": float(infer_dur)
            },
            "validation_unseen": {
                "accuracy": float(acc_unseen),
                "macro_f1": float(f1_macro_unseen),
                "weighted_f1": float(f1_weighted_unseen),
                "macro_precision": float(prec_macro_unseen),
                "macro_recall": float(rec_macro_unseen),
                "top3_accuracy": float(top3_acc_unseen)
            },
            "classification_report": cls_rep,
            "confusion_matrix": cm
        }

        comparison_rows.append({
            "model_id": name,
            "cv_accuracy": cv_results[name]["cv_accuracy_mean"],
            "cv_macro_f1": cv_results[name]["cv_macro_f1_mean"],
            "val_all_accuracy": acc_all,
            "val_all_macro_f1": f1_macro_all,
            "val_all_weighted_f1": f1_weighted_all,
            "val_all_precision": prec_macro_all,
            "val_all_recall": rec_macro_all,
            "val_all_top3_acc": top3_acc_all,
            "val_unseen_accuracy": acc_unseen,
            "val_unseen_macro_f1": f1_macro_unseen,
            "val_unseen_weighted_f1": f1_weighted_unseen,
            "val_unseen_top3_acc": top3_acc_unseen,
            "training_time_sec": fit_dur
        })

        if cv_results[name]["cv_macro_f1_mean"] > best_cv_f1:
            best_cv_f1 = cv_results[name]["cv_macro_f1_mean"]
            best_model_name = name

    # 5. Export Baseline Comparison Table
    os.makedirs(reports_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    comparison_df = pd.DataFrame(comparison_rows)
    comparison_df = comparison_df.sort_values(by="cv_macro_f1", ascending=False)
    comp_csv_path = os.path.join(reports_dir, "baseline_comparison.csv")
    comparison_df.to_csv(comp_csv_path, index=False)
    print(f"\nSaved baseline comparison table to: {comp_csv_path}")

    # 6. Export Baseline Evaluation JSON
    eval_json_path = os.path.join(reports_dir, "baseline_evaluation.json")
    with open(eval_json_path, "w", encoding="utf-8") as f:
        json.dump(full_eval_dict, f, indent=2)
    print(f"Saved baseline evaluation JSON to: {eval_json_path}")

    # 7. Save Best Baseline Model
    best_pipe = trained_models[best_model_name]
    baseline_joblib_path = os.path.join(models_dir, "baseline_intent_model.joblib")
    joblib.dump(best_pipe, baseline_joblib_path)
    print(f"Saved best baseline model ({best_model_name}) to: {baseline_joblib_path}")

    print("\n=== BASELINE SUMMARY RESULTS ===")
    print(comparison_df[[
        "model_id", "cv_accuracy", "cv_macro_f1",
        "val_all_accuracy", "val_all_macro_f1",
        "val_unseen_accuracy", "val_unseen_macro_f1"
    ]].to_string(index=False))

    return comparison_df, best_model_name


if __name__ == "__main__":
    train_and_evaluate_baselines(
        train_path="/Users/abhinavupadhyay/.gemini/antigravity/scratch/relay-ai/data/raw/train.csv",
        val_path="/Users/abhinavupadhyay/.gemini/antigravity/scratch/relay-ai/data/raw/validation.csv",
        reports_dir="/Users/abhinavupadhyay/.gemini/antigravity/scratch/relay-ai/reports",
        models_dir="/Users/abhinavupadhyay/.gemini/antigravity/scratch/relay-ai/artifacts/models"
    )
