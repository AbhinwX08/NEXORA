"""
RELAY AI — Response Retrieval Service (Phase 5 / Prompt B4)
Indexes training customer support instructions and responses.
Supports:
- Word-level TF-IDF
- Character-level TF-IDF (char_wb n-grams)
- Combined FeatureUnion TF-IDF
- Hybrid Reciprocal Rank Fusion (RRF) between lexical word & char models
- Contextual intent-restricted candidate filtering
- Exact source tracking (source_id: train_<index>)

Strictly trained on train.csv only (never indexes validation.csv).
"""

import os
import re
from typing import List, Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion
from sklearn.preprocessing import normalize
import joblib

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def normalize_query_preserving_entities(query: str) -> str:
    """
    Normalizes text while preserving entity tokens:
    - Order/invoice identifiers (#12345, INV-1002, TRK-98214)
    - Currency and amounts ($50.00, 20 USD)
    - Email addresses
    """
    if not query:
        return ""
    q = query.strip()
    # Normalize excessive whitespace but preserve casing for identifier regexes
    q = re.sub(r'\s+', ' ', q)
    return q


class RetrievalService:
    """
    Knowledge index and similarity retrieval engine for customer support responses.
    Strictly trained on train.csv only (never includes validation.csv).
    """

    def __init__(
        self,
        train_path: Optional[str] = None,
        word_ngram: tuple = (1, 2),
        char_ngram: tuple = (3, 5),
        word_weight: float = 1.0,
        char_weight: float = 1.5,
    ):
        self.word_ngram = word_ngram
        self.char_ngram = char_ngram
        self.word_weight = word_weight
        self.char_weight = char_weight

        self.word_vectorizer = TfidfVectorizer(
            ngram_range=self.word_ngram,
            sublinear_tf=True,
            norm="l2"
        )
        self.char_vectorizer = TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=self.char_ngram,
            sublinear_tf=True,
            norm="l2"
        )
        self.combined_vectorizer = FeatureUnion(
            [
                ("word", self.word_vectorizer),
                ("char", self.char_vectorizer)
            ],
            transformer_weights={"word": self.word_weight, "char": self.char_weight}
        )

        self.df: Optional[pd.DataFrame] = None
        self.X_word = None
        self.X_char = None
        self.X_combined = None
        self.intent_to_indices: Dict[str, np.ndarray] = {}
        self.intents: List[str] = []

        if train_path and os.path.exists(train_path):
            self.fit_from_csv(train_path)

    def fit_from_csv(self, train_path: str):
        """Builds the retrieval index from train.csv."""
        print(f"[RetrievalService] Indexing training knowledge base from: {train_path}...")
        self.df = pd.read_csv(train_path)
        required_cols = {"instruction", "intent", "category", "response"}
        if not required_cols.issubset(self.df.columns):
            raise ValueError(f"train.csv must contain columns: {required_cols}")

        instructions = self.df["instruction"].astype(str)

        print(f"[RetrievalService] Fitting Word TF-IDF {self.word_ngram}...")
        self.X_word = self.word_vectorizer.fit_transform(instructions)
        self.X_word = normalize(self.X_word, norm="l2", axis=1)

        print(f"[RetrievalService] Fitting Character TF-IDF {self.char_ngram}...")
        self.X_char = self.char_vectorizer.fit_transform(instructions)
        self.X_char = normalize(self.X_char, norm="l2", axis=1)

        print(f"[RetrievalService] Fitting Combined TF-IDF FeatureUnion...")
        self.X_combined = self.combined_vectorizer.fit_transform(instructions)
        self.X_combined = normalize(self.X_combined, norm="l2", axis=1)

        # Build intent partition index for fast intent-restricted lookup
        self.intents = sorted(self.df["intent"].unique())
        for intent in self.intents:
            idxs = np.where(self.df["intent"].values == intent)[0]
            self.intent_to_indices[intent] = idxs

        print(f"[RetrievalService] Index successfully built: {len(self.df):,} rows across {len(self.intents)} intents.")

    def retrieve(
        self,
        query: str,
        predicted_intent: Optional[str] = None,
        method: str = "combined",
        top_k: int = 5,
        intent_restricted: bool = True,
        confidence: float = 1.0,
        min_confidence: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top_k most similar training examples using cosine similarity or Reciprocal Rank Fusion.
        Methods:
        - 'combined': FeatureUnion (Word + Char TF-IDF) cosine similarity (default)
        - 'hybrid': Reciprocal Rank Fusion (RRF) fusing Word TF-IDF and Char TF-IDF rankings
        - 'word': Word n-gram TF-IDF cosine similarity
        - 'char': Character n-gram TF-IDF cosine similarity
        """
        if self.df is None:
            raise RuntimeError("Retrieval index has not been initialized.")

        method = method.lower()
        if method not in ("combined", "hybrid", "char", "word"):
            raise ValueError(f"Unknown retrieval method '{method}'. Must be 'combined', 'hybrid', 'char', or 'word'.")

        norm_query = normalize_query_preserving_entities(query)

        # Determine search subset (intent-restricted vs global)
        use_intent_filter = (
            intent_restricted
            and predicted_intent
            and predicted_intent in self.intent_to_indices
            and confidence >= min_confidence
        )

        if use_intent_filter:
            target_indices = self.intent_to_indices[predicted_intent]
        else:
            target_indices = np.arange(len(self.df))

        if len(target_indices) == 0:
            return []

        # Vectorize and score
        if method == "hybrid":
            # Reciprocal Rank Fusion between Word and Char rankings
            q_word = normalize(self.word_vectorizer.transform([norm_query]), norm="l2", axis=1)
            q_char = normalize(self.char_vectorizer.transform([norm_query]), norm="l2", axis=1)

            scores_word = (self.X_word[target_indices] * q_word.T).toarray().ravel()
            scores_char = (self.X_char[target_indices] * q_char.T).toarray().ravel()

            ranks_word = np.argsort(scores_word)[::-1]
            ranks_char = np.argsort(scores_char)[::-1]

            rrf_scores = np.zeros(len(target_indices))
            k_rrf = 60.0
            for rank_pos, idx in enumerate(ranks_word):
                rrf_scores[idx] += 1.0 / (k_rrf + rank_pos + 1)
            for rank_pos, idx in enumerate(ranks_char):
                rrf_scores[idx] += 1.0 / (k_rrf + rank_pos + 1)

            # Combined cosine for reporting
            q_comb = normalize(self.combined_vectorizer.transform([norm_query]), norm="l2", axis=1)
            comb_sim = (self.X_combined[target_indices] * q_comb.T).toarray().ravel()

            top_local_idx = np.argsort(rrf_scores)[::-1][:min(top_k, len(target_indices))]
            sim_scores_for_reporting = comb_sim

        else:
            if method == "word":
                q_vec = self.word_vectorizer.transform([norm_query])
                X_sub = self.X_word[target_indices]
            elif method == "char":
                q_vec = self.char_vectorizer.transform([norm_query])
                X_sub = self.X_char[target_indices]
            else:  # combined
                q_vec = self.combined_vectorizer.transform([norm_query])
                X_sub = self.X_combined[target_indices]

            q_vec = normalize(q_vec, norm="l2", axis=1)
            sim_scores = (X_sub * q_vec.T).toarray().ravel()
            top_local_idx = np.argsort(sim_scores)[::-1][:min(top_k, len(target_indices))]
            sim_scores_for_reporting = sim_scores

        candidates = []
        for rank, local_idx in enumerate(top_local_idx, start=1):
            global_idx = int(target_indices[local_idx])
            sim = float(sim_scores_for_reporting[local_idx])
            row = self.df.iloc[global_idx]
            candidates.append({
                "rank": rank,
                "similarity_score": round(sim, 4),
                "instruction": str(row["instruction"]),
                "response": str(row["response"]),
                "intent": str(row["intent"]),
                "category": str(row["category"]),
                "retrieval_method": method,
                "intent_restricted": bool(use_intent_filter),
                "train_index": global_idx,
                "source_id": f"train_{global_idx}",
                "source_split": "train"
            })

        return candidates

    def save(self, filepath: str):
        """Saves the fitted retrieval service to disk."""
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        joblib.dump(self, filepath)
        print(f"[RetrievalService] Saved index to: {filepath}")

    @staticmethod
    def load(filepath: str) -> "RetrievalService":
        """Loads a persisted retrieval service from disk."""
        return joblib.load(filepath)
