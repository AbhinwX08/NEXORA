"""
RELAY AI — Product Guide Knowledge Service (Prompt B5 / Collection B)
Manages the separate, curated RELAY AI product documentation corpus.
Answers questions about the RELAY AI platform, architecture, APIs, and policies
without confusing them with customer support order/refund templates.
"""

import os
import json
from typing import List, Dict, Any, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class ProductGuideService:
    """
    Search and retrieval service for the RELAY AI Product Guide (Collection B).
    """

    def __init__(self, json_path: Optional[str] = None):
        self.json_path = json_path or os.path.join(_PROJECT_ROOT, "data/knowledge/product_guide.json")
        self.documents: List[Dict[str, Any]] = []
        self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, norm="l2")
        self.X = None
        self._load_and_index()

    def _load_and_index(self):
        if not os.path.exists(self.json_path):
            return
        with open(self.json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.documents = data.get("documents", [])

        if self.documents:
            texts = [f"{d['title']}. {d['content']}" for d in self.documents]
            self.vectorizer = TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True, norm="l2")
            self.X = self.vectorizer.fit_transform(texts)
            self.X = normalize(self.X, norm="l2", axis=1)

    def reload(self):
        """Reloads and re-indexes the product guide corpus from disk."""
        self._load_and_index()

    def retrieve(self, query: str, top_k: int = 2, min_similarity: float = 0.15) -> List[Dict[str, Any]]:
        """
        Retrieves relevant product guide articles.
        Returns empty list if similarity is below cutoff (abstention).
        """
        if not self.documents or self.X is None or not query.strip():
            return []

        q_vec = normalize(self.vectorizer.transform([query.strip()]), norm="l2", axis=1)
        sim_scores = (self.X * q_vec.T).toarray().ravel()

        top_indices = sim_scores.argsort()[::-1][:top_k]
        results = []
        for rank, idx in enumerate(top_indices, start=1):
            score = float(sim_scores[idx])
            if score >= min_similarity:
                doc = dict(self.documents[idx])
                doc["similarity"] = round(score, 4)
                doc["rank"] = rank
                doc["source_collection"] = "RELAY_AI_PRODUCT_GUIDE"
                results.append(doc)
        return results

    def get_response(self, query: str) -> Optional[Dict[str, Any]]:
        """Convenience method returning highest-ranked article response or None."""
        docs = self.retrieve(query, top_k=1, min_similarity=0.15)
        if docs:
            top_doc = docs[0]
            return {
                "title": top_doc["title"],
                "category": top_doc["category"],
                "similarity": top_doc["similarity"],
                "answer": top_doc["content"]
            }
        return None


_product_guide_singleton: Optional[ProductGuideService] = None


def get_product_guide_service() -> ProductGuideService:
    global _product_guide_singleton
    if _product_guide_singleton is None:
        _product_guide_singleton = ProductGuideService()
    return _product_guide_singleton
