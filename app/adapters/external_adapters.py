"""
RELAY AI — External System Sandbox Adapters (Prompt B9)
Defines clean interfaces for external business system integrations:
- OrderAdapter: Order status and verification
- PaymentAdapter: Payment method lookup
- TrackingAdapter: Courier tracking location
- TicketingAdapter: Human agent ticket submission

Safety Rules:
- All state-changing operations (cancellations, refunds) require idempotency keys and customer confirmation.
- The LLM can NEVER authorize transactions or modify external state.
- Clearly marked as Sandbox/Demo implementations until live credentials are provided.
"""

import time
import uuid
from typing import Dict, Any, Optional


class AdapterSafetyError(Exception):
    pass


class OrderAdapter:
    """Sandbox Order Management System Adapter."""

    def __init__(self, is_sandbox: bool = True):
        self.is_sandbox = is_sandbox

    def lookup_order(self, order_id: str) -> Dict[str, Any]:
        """Read-only order status inquiry."""
        clean_id = order_id.strip()
        return {
            "order_id": clean_id,
            "status": "PROCESSING",
            "items_count": 2,
            "total_amount": "49.99",
            "created_at": "2026-10-28T14:30:00Z",
            "cancellable": True,
            "is_sandbox": self.is_sandbox
        }

    def request_cancellation(self, order_id: str, confirmation_token: str, idempotency_key: str) -> Dict[str, Any]:
        """State-changing cancellation requiring explicit authorization and idempotency."""
        if not confirmation_token or not idempotency_key:
            raise AdapterSafetyError("Cancellation requires customer confirmation token and idempotency key.")
        return {
            "status": "CANCELLATION_REQUESTED",
            "order_id": order_id,
            "cancellation_id": f"cncl_{uuid.uuid4().hex[:8]}",
            "idempotency_key": idempotency_key,
            "is_sandbox": self.is_sandbox
        }


class TrackingAdapter:
    """Sandbox Delivery & Logistics Tracking Adapter."""

    def __init__(self, is_sandbox: bool = True):
        self.is_sandbox = is_sandbox

    def lookup_tracking(self, tracking_number: str) -> Dict[str, Any]:
        return {
            "tracking_number": tracking_number,
            "carrier": "Standard Express Logistics",
            "status": "IN_TRANSIT",
            "estimated_delivery": "Within 2 business days",
            "last_checkpoint": "Regional Distribution Hub",
            "is_sandbox": self.is_sandbox
        }


class PaymentAdapter:
    """Sandbox Payment Gateway Adapter."""

    def __init__(self, is_sandbox: bool = True):
        self.is_sandbox = is_sandbox

    def lookup_payment_methods(self, account_id: str) -> Dict[str, Any]:
        return {
            "account_id": account_id,
            "methods": [
                {"type": "Credit Card", "last4": "4242", "default": True},
                {"type": "PayPal", "email": "customer@example.com", "default": False}
            ],
            "is_sandbox": self.is_sandbox
        }


class TicketingAdapter:
    """Sandbox Human Agent Ticketing System Adapter."""

    def __init__(self, is_sandbox: bool = True):
        self.is_sandbox = is_sandbox

    def create_support_ticket(self, customer_query: str, intent: str, urgency: str = "normal") -> Dict[str, Any]:
        ticket_id = f"TICK-{uuid.uuid4().hex[:6].upper()}"
        return {
            "ticket_id": ticket_id,
            "status": "QUEUED",
            "intent": intent,
            "urgency": urgency,
            "assigned_queue": "General Support Tier 1",
            "is_sandbox": self.is_sandbox,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

