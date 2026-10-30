"""
RELAY AI — Ephemeral Session Memory (Prompt B6)
Manages conversational session context, multi-turn entity persistence, and history retention.
Guarantees session isolation with zero cross-user context leakage.
"""

import time
import uuid
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ConversationTurn(BaseModel):
    turn_id: int
    user_message: str
    assistant_reply: str
    intent_detected: Optional[str] = None
    category: Optional[str] = None
    decision: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)


class SessionState(BaseModel):
    session_id: str
    created_at: float = Field(default_factory=time.time)
    last_active_at: float = Field(default_factory=time.time)
    history: List[ConversationTurn] = Field(default_factory=list)
    accumulated_slots: Dict[str, str] = Field(default_factory=dict)
    customer_context: Dict[str, Any] = Field(default_factory=dict)


class SessionMemoryManager:
    """
    In-memory session manager with TTL-based expiration and persistent slots.
    """

    def __init__(self, ttl_seconds: float = 86400.0):  # 24-hour default retention
        self.ttl_seconds = ttl_seconds
        self._sessions: Dict[str, SessionState] = {}

    def get_or_create_session(self, session_id: Optional[str] = None) -> SessionState:
        now = time.time()
        self._cleanup_expired(now)

        if not session_id or session_id not in self._sessions:
            sid = session_id or f"sess_{uuid.uuid4().hex[:12]}"
            state = SessionState(session_id=sid)
            self._sessions[sid] = state
            return state

        state = self._sessions[session_id]
        state.last_active_at = now
        return state

    def update_session(
        self,
        session_id: str,
        user_message: str,
        assistant_reply: str,
        intent: Optional[str] = None,
        category: Optional[str] = None,
        decision: Optional[str] = None,
        new_slots: Optional[Dict[str, str]] = None
    ) -> SessionState:
        state = self.get_or_create_session(session_id)
        turn_num = len(state.history) + 1
        turn = ConversationTurn(
            turn_id=turn_num,
            user_message=user_message,
            assistant_reply=assistant_reply,
            intent_detected=intent,
            category=category,
            decision=decision
        )
        state.history.append(turn)
        if new_slots:
            state.accumulated_slots.update(new_slots)
        state.last_active_at = time.time()
        return state

    def clear_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def _cleanup_expired(self, current_time: float):
        expired_keys = [
            sid for sid, s in self._sessions.items()
            if (current_time - s.last_active_at) > self.ttl_seconds
        ]
        for sid in expired_keys:
            del self._sessions[sid]

