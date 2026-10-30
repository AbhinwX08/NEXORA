"""
RELAY AI — Response Retrieval Service
Indexes training customer support instructions and responses.
Supports Word-level, Character-level, and Combined TF-IDF cosine similarity search.
Enables Global and Intent-Restricted retrieval modes.
"""

import os
import re
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import FeatureUnion
from sklearn.preprocessing import normalize
import joblib


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
        """
        Builds the retrieval index from train.csv.
        """
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
        Retrieves top_k most similar training examples using cosine similarity.
        """
        if self.df is None:
            raise RuntimeError("Retrieval index has not been initialized.")

        method = method.lower()
        if method not in ("combined", "char", "word"):
            raise ValueError(f"Unknown retrieval method '{method}'. Must be 'combined', 'char', or 'word'.")

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

        # Vectorize query
        if method == "word":
            q_vec = self.word_vectorizer.transform([query])
            X_sub = self.X_word[target_indices]
        elif method == "char":
            q_vec = self.char_vectorizer.transform([query])
            X_sub = self.X_char[target_indices]
        else:  # combined
            q_vec = self.combined_vectorizer.transform([query])
            X_sub = self.X_combined[target_indices]

        q_vec = normalize(q_vec, norm="l2", axis=1)

        # Compute cosine similarity (dot product between unit-normalized sparse vectors)
        sim_scores = (X_sub * q_vec.T).toarray().ravel()

        # Get top-k indices within subset
        k = min(top_k, len(target_indices))
        if k == 0:
            return []

        top_local_idx = np.argsort(sim_scores)[::-1][:k]

        candidates = []
        for rank, local_idx in enumerate(top_local_idx, start=1):
            global_idx = target_indices[local_idx]
            sim = float(sim_scores[local_idx])
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
                "train_index": int(global_idx)
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
