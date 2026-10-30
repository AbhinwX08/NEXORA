"""
RELAY AI — Text Preprocessor
Reusable text normalization and preprocessing pipeline for multiclass intent classification.
Preserves negation, entity placeholders, numbers, currency symbols, and meaningful punctuation
while standardizing unicode, whitespace, and casing.
"""

import unicodedata
import re
from typing import List, Union
from sklearn.base import BaseEstimator, TransformerMixin


class TextPreprocessor(BaseEstimator, TransformerMixin):
    """
    Standardizes input texts for NLP feature extraction.
    Inherits from BaseEstimator and TransformerMixin for seamless integration
    into scikit-learn Pipelines.
    """

    def __init__(
        self,
        normalize_unicode: bool = True,
        unicode_form: str = "NFKC",
        lowercase: bool = True,
        expand_contractions: bool = True,
        preserve_negations: bool = True,
        preserve_entities: bool = True,
        standardize_whitespace: bool = True,
    ):
        self.normalize_unicode = normalize_unicode
        self.unicode_form = unicode_form
        self.lowercase = lowercase
        self.expand_contractions = expand_contractions
        self.preserve_negations = preserve_negations
        self.preserve_entities = preserve_entities
        self.standardize_whitespace = standardize_whitespace

        # Negation-preserving contractions dictionary
        self._contractions = {
            r"\bcan't\b": "cannot",
            r"\bcant\b": "cannot",
            r"\bwon't\b": "will not",
            r"\bwont\b": "will not",
            r"\bdon't\b": "do not",
            r"\bdont\b": "do not",
            r"\bdidn't\b": "did not",
            r"\bdidnt\b": "did not",
            r"\bi'm\b": "i am",
            r"\bi've\b": "i have",
            r"\bi'd\b": "i would",
            r"\bi'll\b": "i will",
            r"\bit's\b": "it is",
            r"\bain't\b": "is not",
            r"\baren't\b": "are not",
            r"\bweren't\b": "were not",
            r"\bhasn't\b": "has not",
            r"\bhaven't\b": "have not",
            r"\bhadn't\b": "had not",
            r"\bshouldn't\b": "should not",
            r"\bcouldn't\b": "could not",
            r"\bwouldn't\b": "would not",
            r"\bdoesn't\b": "does not",
            r"\bdoesnt\b": "does not",
            r"\bisn't\b": "is not",
            r"\bisnt\b": "is not",
        }

    def fit(self, X, y=None):
        return self

    def transform(self, X: Union[List[str], "pd.Series"]) -> List[str]:
        return [self.preprocess(text) for text in X]

    def preprocess(self, text: str) -> str:
        if not isinstance(text, str):
            return ""

        # 1. Unicode Normalization
        if self.normalize_unicode:
            text = unicodedata.normalize(self.unicode_form, text)

        # 2. Lowercase
        if self.lowercase:
            text = text.lower()

        # 3. Contraction Expansion (preserving negation words)
        if self.expand_contractions:
            for pattern, replacement in self._contractions.items():
                text = re.sub(pattern, replacement, text)

        # 4. Standardize Whitespace
        if self.standardize_whitespace:
            text = re.sub(r"\s+", " ", text).strip()

        return text

    def get_config(self) -> dict:
        return {
            "normalize_unicode": self.normalize_unicode,
            "unicode_form": self.unicode_form,
            "lowercase": self.lowercase,
            "expand_contractions": self.expand_contractions,
            "preserve_negations": self.preserve_negations,
            "preserve_entities": self.preserve_entities,
            "standardize_whitespace": self.standardize_whitespace,
        }
