"""
RELAY AI — Feedback Intake Service (Prompt B6)
Records customer satisfaction, intent corrections, and retrieval ratings
into a reviewed feedback queue. Never auto-retrains without administrative review.
"""

import os
import json
import time
import uuid
from typing import Dict, Any, Optional

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class FeedbackService:
    """
    Manages customer feedback recording into an auditable review queue.
    """

    def __init__(self, queue_file: Optional[str] = None):
        self.queue_file = queue_file or os.path.join(_PROJECT_ROOT, "data/feedback/review_queue.jsonl")
        os.makedirs(os.path.dirname(self.queue_file), exist_ok=True)

    def record_feedback(
        self,
        query: str,
        intent: str,
        final_decision: str,
        rating: int,
        helpful: bool,
        comment: Optional[str] = None,
        request_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Appends a validated feedback record to the review queue.
        """
        if not (1 <= rating <= 5):
            raise ValueError(f"Rating must be between 1 and 5 (received {rating}).")

        fb_id = f"fb_{uuid.uuid4().hex[:8]}"
        record = {
            "feedback_id": fb_id,
            "request_id": request_id or "unknown",
            "query": query.strip(),
            "intent": intent,
            "final_decision": final_decision,
            "rating": rating,
            "helpful": bool(helpful),
            "comment": (comment or "").strip()[:500],
            "reviewed": False,
            "recorded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

        with open(self.queue_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")

        return {
            "status": "success",
            "feedback_id": fb_id,
            "message": "Feedback successfully recorded.",
            "recorded_at": record["recorded_at"]
        }

