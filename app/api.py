"""
RELAY AI — Production Customer Support Backend API (Account B)
Hardened Flask service exposing validated HTTP REST endpoints powered by deterministic multi-agent orchestration:
- GET /api/health: Live readiness and multi-component runtime verification checks
- GET /api/info: Verified system metadata and offline evaluation metrics
- POST /api/chat: Full multi-agent orchestration (A1 + A2 + Validation)
- POST /api/intent: Fast calibrated intent classification (A1)
- POST /api/assistant/chat: Conversational multi-turn assistant with session memory & RAG
- POST /api/voice/transcribe: Speech-to-text transcription service (half-duplex)
- POST /api/voice/speech: Text-to-speech audio synthesis service
- POST /api/feedback: Reviewed customer feedback and rating intake
- POST /api/replay: Deterministic pipeline replay & regression comparison

Complies strictly with API Contract: docs/contracts/relay-api-v1.md
"""

import os
import sys
import time
import uuid
import re
import io
import logging
from typing import Dict, Any, Optional
from flask import Flask, request, jsonify, make_response, g, Response
from pydantic import BaseModel, Field, ValidationError, field_validator

# Add project root and src to sys.path
_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)
_SRC_DIR = os.path.join(_PROJECT_ROOT, "src")
if _SRC_DIR not in sys.path:
    sys.path.insert(0, _SRC_DIR)

from app.orchestration.support_orchestrator import SupportOrchestrator
from app.agents.intent_agent import IntentAnalystAgent
from app.schemas.agent_models import OrchestratorResult
from app.services.chatbot_router import ChatbotRouter
from app.services.voice_service import VoiceService, VoiceServiceError
from app.services.feedback_service import FeedbackService
from app.services.analytics_service import (
    build_resolution_evidence_record,
    execute_decision_replay,
    KnowledgeGapDetector,
)
from app.orchestration.conflict_engine import ConflictResolutionEngine
from app.orchestration.capability_registry import CapabilityRegistry
from app.orchestration.workflow_planner import WorkflowPlanner
from app.services.knowledge_intelligence_service import get_knowledge_intelligence_service

# ---------------------------------------------------------------------------
# Structured Server Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
)
logger = logging.getLogger("relay.api")

app = Flask(__name__)

# Payload & Service Configuration from Environment
# Allow up to 15MB for audio file uploads
MAX_PAYLOAD_BYTES = int(os.environ.get("MAX_PAYLOAD_BYTES", 15 * 1024 * 1024))
app.config["MAX_CONTENT_LENGTH"] = MAX_PAYLOAD_BYTES
MAX_QUERY_LENGTH = int(os.environ.get("MAX_QUERY_LENGTH", 2000))
SERVICE_TIMEOUT_SECONDS = float(os.environ.get("SERVICE_TIMEOUT_SECONDS", 15.0))
PRELOAD_MODELS = os.environ.get("PRELOAD_MODELS", "true").lower() in ("true", "1", "yes")

# Configurable CORS allowlist (no wildcard production default)
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
env_cors = os.environ.get("CORS_ORIGINS", "")
ALLOWED_ORIGINS = [o.strip() for o in env_cors.split(",") if o.strip()] or DEFAULT_ALLOWED_ORIGINS

# ---------------------------------------------------------------------------
# Singletons & Controlled Lifecycle
# ---------------------------------------------------------------------------
_orchestrator: Optional[SupportOrchestrator] = None
_intent_agent: Optional[IntentAnalystAgent] = None
_chatbot_router: Optional[ChatbotRouter] = None
_voice_service: Optional[VoiceService] = None
_feedback_service: Optional[FeedbackService] = None
_gap_detector: Optional[KnowledgeGapDetector] = None

_models_load_failed: bool = False
_models_load_error: Optional[str] = None


def get_intent_agent() -> IntentAnalystAgent:
    """Retrieve or initialize the IntentAnalystAgent singleton safely."""
    global _intent_agent, _models_load_failed, _models_load_error
    if _intent_agent is None:
        try:
            logger.info("Initializing IntentAnalystAgent singleton...")
            _intent_agent = IntentAnalystAgent()
        except Exception as e:
            _models_load_failed = True
            _models_load_error = str(e)
            logger.error(f"Failed to load IntentAnalystAgent: {e}", exc_info=True)
            raise RuntimeError(f"Intent model initialization failed: {e}") from e
    return _intent_agent


def get_orchestrator() -> SupportOrchestrator:
    """Retrieve or initialize the SupportOrchestrator singleton safely."""
    global _orchestrator, _models_load_failed, _models_load_error
    if _orchestrator is None:
        try:
            logger.info("Initializing SupportOrchestrator singleton...")
            _orchestrator = SupportOrchestrator()
        except Exception as e:
            _models_load_failed = True
            _models_load_error = str(e)
            logger.error(f"Failed to load SupportOrchestrator: {e}", exc_info=True)
            raise RuntimeError(f"Orchestrator initialization failed: {e}") from e
    return _orchestrator


def get_chatbot_router() -> ChatbotRouter:
    global _chatbot_router
    if _chatbot_router is None:
        _chatbot_router = ChatbotRouter(orchestrator=get_orchestrator())
    return _chatbot_router


def get_voice_service() -> VoiceService:
    global _voice_service
    if _voice_service is None:
        _voice_service = VoiceService()
    return _voice_service


def get_feedback_service() -> FeedbackService:
    global _feedback_service
    if _feedback_service is None:
        _feedback_service = FeedbackService()
    return _feedback_service


def get_gap_detector() -> KnowledgeGapDetector:
    global _gap_detector
    if _gap_detector is None:
        _gap_detector = KnowledgeGapDetector()
    return _gap_detector


_conflict_engine: Optional[ConflictResolutionEngine] = None
_capability_registry: Optional[CapabilityRegistry] = None
_workflow_planner: Optional[WorkflowPlanner] = None
_knowledge_service = None


def get_conflict_engine() -> ConflictResolutionEngine:
    global _conflict_engine
    if _conflict_engine is None:
        _conflict_engine = ConflictResolutionEngine()
    return _conflict_engine


def get_capability_registry() -> CapabilityRegistry:
    global _capability_registry
    if _capability_registry is None:
        _capability_registry = CapabilityRegistry()
    return _capability_registry


def get_workflow_planner() -> WorkflowPlanner:
    global _workflow_planner
    if _workflow_planner is None:
        _workflow_planner = WorkflowPlanner(registry=get_capability_registry())
    return _workflow_planner


def get_knowledge_service():
    global _knowledge_service
    if _knowledge_service is None:
        _knowledge_service = get_knowledge_intelligence_service()
    return _knowledge_service


def preload_system_models():
    """Controlled pre-initialization of ML models at server launch."""
    if PRELOAD_MODELS:
        try:
            get_orchestrator()
            logger.info("All RELAY AI models successfully initialized and ready.")
        except Exception as e:
            logger.warning(f"Startup model preloading encountered an issue: {e}. Degrading gracefully.")


# ---------------------------------------------------------------------------
# Standardized Error Helper
# ---------------------------------------------------------------------------

def error_response(message: str, error_code: str, status_code: int = 400, request_id: Optional[str] = None):
    """Generates standardized error envelopes adhering to docs/contracts/relay-api-v1.md."""
    req_id = request_id or getattr(g, "request_id", f"req_{uuid.uuid4().hex[:8]}")
    payload = {
        "status": "error",
        "error": message,
        "error_code": error_code,
        "request_id": req_id,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    resp = jsonify(payload)
    resp.headers["X-Request-ID"] = req_id
    return resp, status_code


# ---------------------------------------------------------------------------
# Request Validation Schemas
# ---------------------------------------------------------------------------

_SLOT_KEY_REGEX = re.compile(r"^[a-zA-Z0-9_\-\s]{1,64}$")


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=MAX_QUERY_LENGTH, description="Customer inquiry string")
    customer_slots: Optional[Dict[str, str]] = Field(default=None, description="Optional customer or business parameters")

    @field_validator("query")
    @classmethod
    def query_must_not_be_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Query string cannot be empty or whitespace-only.")
        return stripped

    @field_validator("customer_slots")
    @classmethod
    def validate_customer_slots(cls, v: Optional[Dict[str, str]]) -> Optional[Dict[str, str]]:
        if v is None:
            return v
        if not isinstance(v, dict):
            raise ValueError("customer_slots must be a key-value dictionary.")
        cleaned = {}
        for key, val in v.items():
            if not isinstance(key, str) or not _SLOT_KEY_REGEX.match(key):
                raise ValueError(f"Invalid slot key '{key}'. Keys must be alphanumeric/underscores/spaces up to 64 characters.")
            if not isinstance(val, str) or len(val) > 200:
                raise ValueError(f"Invalid slot value for '{key}'. Values must be strings up to 200 characters.")
            cleaned[key] = val
        return cleaned


class IntentRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=MAX_QUERY_LENGTH, description="Customer inquiry string")

    @field_validator("query")
    @classmethod
    def query_must_not_be_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Query string cannot be empty or whitespace-only.")
        return stripped


class AssistantChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=MAX_QUERY_LENGTH)
    customer_context: Optional[Dict[str, Any]] = None

    @field_validator("message")
    @classmethod
    def message_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message cannot be empty or whitespace-only.")
        return stripped


class SpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    voice: str = Field(default="en-US-neutral")
    format: str = Field(default="wav")

    @field_validator("text")
    @classmethod
    def text_not_blank(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Text cannot be empty.")
        return stripped


class FeedbackRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=MAX_QUERY_LENGTH)
    intent: str
    final_decision: str
    rating: int = Field(..., ge=1, le=5)
    helpful: bool
    comment: Optional[str] = None
    request_id: Optional[str] = None


class ReplayRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=MAX_QUERY_LENGTH)
    modified_query: Optional[str] = None
    customer_slots: Optional[Dict[str, str]] = None


class WorkflowPlanRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=MAX_QUERY_LENGTH)
    customer_slots: Optional[Dict[str, str]] = None
    preferred_mode: Optional[str] = None


class FAQReviewRequest(BaseModel):
    action: str = Field(..., description="'APPROVE' or 'REJECT'")
    reviewer: Optional[str] = "Human Reviewer"
    rejection_reason: Optional[str] = None


# ---------------------------------------------------------------------------
# Request Tracing & Correlation Middleware
# ---------------------------------------------------------------------------

_VALID_REQ_ID_RE = re.compile(r"^[a-zA-Z0-9_\-]{4,64}$")


@app.before_request
def assign_request_id_and_handle_options():
    """Extract or generate an X-Request-ID and handle OPTIONS preflight cleanly."""
    incoming_id = request.headers.get("X-Request-ID", "").strip()
    if incoming_id and _VALID_REQ_ID_RE.match(incoming_id):
        g.request_id = incoming_id
    else:
        g.request_id = f"req_{uuid.uuid4().hex[:8]}"

    if request.method == "OPTIONS":
        resp = make_response("", 204)
        origin = request.headers.get("Origin")
        if origin and (origin in ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS):
            resp.headers["Access-Control-Allow-Origin"] = origin
            resp.headers["Access-Control-Allow-Credentials"] = "true"
            resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, X-Request-ID"
        resp.headers["X-Request-ID"] = g.request_id
        return resp


@app.after_request
def apply_headers(response):
    """Apply CORS headers and propagate X-Request-ID."""
    req_id = getattr(g, "request_id", "req_unknown")
    response.headers["X-Request-ID"] = req_id

    origin = request.headers.get("Origin")
    if origin and (origin in ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, X-Request-ID"
    return response


# ---------------------------------------------------------------------------
# Global Error Handlers
# ---------------------------------------------------------------------------

@app.errorhandler(400)
def bad_request_error(e):
    return error_response(
        message=f"Bad Request: {getattr(e, 'description', 'Malformed request payload.')}",
        error_code="BAD_REQUEST",
        status_code=400
    )


@app.errorhandler(404)
def not_found_error(e):
    return error_response(
        message="Endpoint not found.",
        error_code="NOT_FOUND",
        status_code=404
    )


@app.errorhandler(405)
def method_not_allowed_error(e):
    return error_response(
        message="Method Not Allowed for this endpoint.",
        error_code="METHOD_NOT_ALLOWED",
        status_code=405
    )


@app.errorhandler(413)
def payload_too_large_error(e):
    return error_response(
        message=f"Request body too large. Maximum allowed size is {MAX_PAYLOAD_BYTES} bytes.",
        error_code="PAYLOAD_TOO_LARGE",
        status_code=413
    )


@app.errorhandler(500)
def internal_server_error(e):
    req_id = getattr(g, "request_id", "req_unknown")
    logger.error(f"[Req {req_id}] Unhandled server exception: {e}", exc_info=True)
    return error_response(
        message="Internal server error occurred.",
        error_code="INTERNAL_ERROR",
        status_code=500,
        request_id=req_id
    )


# ---------------------------------------------------------------------------
# Core Preserved Endpoints
# ---------------------------------------------------------------------------

@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Genuine Readiness & Health Check.
    Distinguishes process alive, API ready, intent model loaded,
    calibration loaded, retriever loaded, optional LLM and optional database.
    """
    models_dir = os.path.join(_PROJECT_ROOT, "artifacts/models")
    intent_file_exists = os.path.exists(os.path.join(models_dir, "intent_classifier.joblib"))
    retriever_file_exists = os.path.exists(os.path.join(models_dir, "response_retriever.joblib"))
    config_file_exists = os.path.exists(os.path.join(models_dir, "calibration_config.json"))

    intent_model_loaded = False
    retriever_loaded = False
    calibration_loaded = config_file_exists

    try:
        agent = get_intent_agent()
        intent_model_loaded = agent.classifier is not None and len(agent.classes) > 0
    except Exception as e:
        logger.warning(f"Intent agent readiness check failed: {e}")

    try:
        orch = get_orchestrator()
        retriever_loaded = (
            orch.response_agent is not None
            and orch.response_agent.retriever is not None
        )
    except Exception as e:
        logger.warning(f"Orchestrator readiness check failed: {e}")

    api_ready = intent_model_loaded and retriever_loaded and calibration_loaded
    overall_status = "healthy" if api_ready else "degraded"
    status_code = 200 if api_ready else 503

    optional_llm = os.environ.get("OPTIONAL_LLM_ENABLED", "false").lower()
    optional_db = os.environ.get("OPTIONAL_DB_ENABLED", "false").lower()

    return jsonify({
        "status": overall_status,
        "service": "RELAY AI Multi-Agent Customer Support Engine",
        "version": "1.0.0",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "components": {
            "api_server": "running",
            "process_alive": True,
            "api_ready": api_ready,
            "intent_engine_runtime": "ready" if intent_model_loaded else "uninitialized",
            "retrieval_engine_runtime": "ready" if retriever_loaded else "uninitialized",
            "intent_model_loaded": intent_model_loaded,
            "calibration_loaded": calibration_loaded,
            "retriever_loaded": retriever_loaded,
            "intent_classifier_file": "available" if intent_file_exists else "missing",
            "response_retriever_file": "available" if retriever_file_exists else "missing",
            "calibration_config": "available" if config_file_exists else "missing",
            "optional_llm": "configured" if optional_llm in ("true", "1") else "not_configured",
            "optional_database": "configured" if optional_db in ("true", "1") else "not_configured"
        }
    }), status_code


@app.route("/api/info", methods=["GET"])
def system_info():
    """Returns authentic static metadata, dataset scope, and offline validation benchmarks."""
    return jsonify({
        "system": "RELAY AI",
        "tagline": "From customer query to verified resolution",
        "version": "1.0.0",
        "architecture": {
            "type": "Deterministic Multi-Agent Coordination with Classical NLP & Calibration",
            "agents": [
                {
                    "name": "A1_IntentAnalyst",
                    "role": "Calibrated Multiclass Intent Prediction & Uncertainty Margin Analysis",
                    "method": "Logistic Regression / SVM with Sigmoid Probability Calibration"
                },
                {
                    "name": "A2_ResponseSpecialist",
                    "role": "Contextual Instruction Retrieval & Dynamic Slot Parameterization",
                    "method": "Dual TF-IDF Vector Space Matching (Instruction + Response Index)"
                },
                {
                    "name": "ValidationAgent",
                    "role": "7-Point Quality, Safety, and Anti-Fabrication Verification Gate",
                    "method": "Deterministic Boundary & Completeness Rules"
                },
                {
                    "name": "SupportOrchestrator",
                    "role": "End-to-End Workflow Coordinator & State Management",
                    "method": "Typed Pydantic Contracts with Audit Execution Traces"
                }
            ]
        },
        "dataset_metadata": {
            "source": "Customer Support Instruction-Response Corpus",
            "training_records": 18810,
            "validation_records": 4031,
            "total_records": 22841,
            "unique_intents": 27,
            "unique_categories": 11,
            "categories": [
                "ACCOUNT", "CANCEL", "CONTACT", "DELIVERY", "FEEDBACK",
                "INVOICE", "ORDER", "PAYMENT", "REFUND", "SHIPPING", "SUBSCRIPTION"
            ],
            "dataset_columns": ["flags", "instruction", "category", "intent", "response"],
            "flags_note": "349 distinct instruction flag combinations present; no official codebook provided."
        },
        "offline_validation_benchmarks": {
            "evaluation_context": "Evaluated offline on 4,031 held-out validation samples (data/raw/validation.csv)",
            "intent_classification": {
                "validation_samples": 4031,
                "accuracy": 1.0,
                "macro_f1": 1.0,
                "weighted_f1": 1.0,
                "top_3_accuracy": 1.0,
                "expected_calibration_error_ece": 0.0119,
                "brier_score": 0.00054
            },
            "response_retrieval": {
                "recall_at_1": 1.0,
                "recall_at_3": 1.0,
                "recall_at_5": 1.0,
                "mean_reciprocal_rank_mrr": 1.0,
                "mean_cosine_similarity": 0.8467
            },
            "disclaimer": "These metrics represent offline test-set evaluation results and are not live runtime operational guarantees."
        }
    }), 200


@app.route("/api/chat", methods=["POST"])
def chat_endpoint():
    """Primary Customer Support Interaction Endpoint (A1 + A2 + Validation)."""
    req_id = getattr(g, "request_id", f"req_{uuid.uuid4().hex[:8]}")

    if not request.is_json:
        return error_response("Request content type must be application/json.", "BAD_REQUEST", 400, req_id)

    try:
        raw_data = request.get_json(silent=False)
        if raw_data is None:
            return error_response("Invalid or empty JSON body.", "BAD_REQUEST", 400, req_id)
    except Exception:
        return error_response("Malformed JSON in request body.", "BAD_REQUEST", 400, req_id)

    try:
        payload = ChatRequest(**raw_data)
    except ValidationError as ve:
        first_err = ve.errors()[0]
        field = ".".join(str(loc) for loc in first_err.get("loc", []))
        msg = first_err.get("msg", "Invalid value")
        return error_response(f"Validation error on '{field}': {msg}", "VALIDATION_ERROR", 400, req_id)

    query = payload.query
    logger.info(f"[{req_id}] Processing chat query: '{query[:60]}...'")

    try:
        orch = get_orchestrator()
    except Exception as e:
        logger.error(f"[{req_id}] SupportOrchestrator unavailable: {e}", exc_info=True)
        return error_response(
            message="Support orchestration engine is currently unavailable.",
            error_code="MODEL_UNAVAILABLE",
            status_code=503,
            request_id=req_id
        )

    try:
        result: OrchestratorResult = orch.process_query(
            query=query,
            customer_slots=payload.customer_slots,
            trace_id=req_id
        )
        # Log to knowledge gap detector if weak evidence
        get_gap_detector().record_if_gap(query, result)

        return jsonify(result.model_dump()), 200

    except Exception as e:
        logger.error(f"[{req_id}] Orchestration error during processing: {e}", exc_info=True)
        return error_response(
            message="Internal server error occurred during support orchestration.",
            error_code="INTERNAL_ERROR",
            status_code=500,
            request_id=req_id
        )


@app.route("/api/intent", methods=["POST"])
def intent_endpoint():
    """Fast Intent Classification Endpoint (A1 only)."""
    req_id = getattr(g, "request_id", f"req_{uuid.uuid4().hex[:8]}")

    if not request.is_json:
        return error_response("Request content type must be application/json.", "BAD_REQUEST", 400, req_id)

    try:
        raw_data = request.get_json(silent=False)
        if raw_data is None:
            return error_response("Invalid or empty JSON body.", "BAD_REQUEST", 400, req_id)
    except Exception:
        return error_response("Malformed JSON in request body.", "BAD_REQUEST", 400, req_id)

    try:
        payload = IntentRequest(**raw_data)
    except ValidationError as ve:
        first_err = ve.errors()[0]
        field = ".".join(str(loc) for loc in first_err.get("loc", []))
        msg = first_err.get("msg", "Invalid value")
        return error_response(f"Validation error on '{field}': {msg}", "VALIDATION_ERROR", 400, req_id)

    query = payload.query
    logger.info(f"[{req_id}] Processing intent query: '{query[:60]}...'")

    try:
        agent = get_intent_agent()
    except Exception as e:
        logger.error(f"[{req_id}] IntentAnalystAgent unavailable: {e}", exc_info=True)
        return error_response(
            message="Intent classification engine is currently unavailable.",
            error_code="MODEL_UNAVAILABLE",
            status_code=503,
            request_id=req_id
        )

    try:
        handoff, trace = agent.process(query)

        if handoff is None:
            return error_response(
                message=f"Intent classifier failed to evaluate query: {trace.decision_reason}",
                error_code="INTERNAL_ERROR",
                status_code=500,
                request_id=req_id
            )

        return jsonify({
            "query": handoff.original_query,
            "top_intent": handoff.top_intent,
            "category": handoff.category,
            "confidence": handoff.calibrated_confidence,
            "margin": handoff.margin,
            "uncertainty_verdict": handoff.uncertainty_verdict,
            "alternatives": [alt.model_dump() for alt in handoff.alternative_intents],
            "duration_ms": trace.duration_ms
        }), 200

    except Exception as e:
        logger.error(f"[{req_id}] Intent classification error: {e}", exc_info=True)
        return error_response(
            message="Internal server error occurred during intent classification.",
            error_code="INTERNAL_ERROR",
            status_code=500,
            request_id=req_id
        )


# ---------------------------------------------------------------------------
# Extended Account B Endpoints (Conversational, Voice, Feedback, Replay)
# ---------------------------------------------------------------------------

@app.route("/api/assistant/chat", methods=["POST"])
def assistant_chat_endpoint():
    """Multi-turn conversational support assistant with session memory & RAG."""
    req_id = getattr(g, "request_id", f"req_{uuid.uuid4().hex[:8]}")

    if not request.is_json:
        return error_response("Request content type must be application/json.", "BAD_REQUEST", 400, req_id)

    try:
        raw_data = request.get_json(silent=False)
        payload = AssistantChatRequest(**raw_data)
    except ValidationError as ve:
        first_err = ve.errors()[0]
        field = ".".join(str(loc) for loc in first_err.get("loc", []))
        return error_response(f"Validation error on '{field}': {first_err.get('msg')}", "VALIDATION_ERROR", 400, req_id)
    except Exception:
        return error_response("Malformed JSON body.", "BAD_REQUEST", 400, req_id)

    try:
        router = get_chatbot_router()
        res = router.handle_turn(
            session_id=payload.session_id,
            message=payload.message,
            customer_context=payload.customer_context
        )
        return jsonify(res), 200
    except Exception as e:
        logger.error(f"[{req_id}] Assistant chat error: {e}", exc_info=True)
        return error_response("Internal error during conversational assistant execution.", "INTERNAL_ERROR", 500, req_id)


@app.route("/api/voice/transcribe", methods=["POST"])
def voice_transcribe_endpoint():
    """Speech-to-text service converting customer audio upload to text query."""
    req_id = getattr(g, "request_id", f"req_{uuid.uuid4().hex[:8]}")

    audio_bytes = None
    filename = "audio.wav"
    mime_type = "audio/wav"

    if "audio" in request.files:
        file = request.files["audio"]
        filename = file.filename or "audio.wav"
        mime_type = file.mimetype or "audio/wav"
        audio_bytes = file.read()
    elif request.data:
        audio_bytes = request.data
        mime_type = request.content_type or "audio/wav"

    if not audio_bytes:
        return error_response("Missing audio payload in 'audio' form-data or request body.", "BAD_REQUEST", 400, req_id)

    try:
        voice_svc = get_voice_service()
        res = voice_svc.transcribe_audio(audio_bytes, filename, mime_type)
        return jsonify(res), 200
    except VoiceServiceError as vse:
        return error_response(vse.message, vse.error_code, vse.status_code, req_id)
    except Exception as e:
        logger.error(f"[{req_id}] Voice transcription error: {e}", exc_info=True)
        return error_response("Voice transcription service encountered an unexpected error.", "INTERNAL_ERROR", 500, req_id)


@app.route("/api/voice/speech", methods=["POST"])
def voice_speech_endpoint():
    """Text-to-speech audio synthesis service."""
    req_id = getattr(g, "request_id", f"req_{uuid.uuid4().hex[:8]}")

    if not request.is_json:
        return error_response("Request content type must be application/json.", "BAD_REQUEST", 400, req_id)

    try:
        payload = SpeechRequest(**request.get_json())
    except ValidationError as ve:
        first_err = ve.errors()[0]
        field = ".".join(str(loc) for loc in first_err.get("loc", []))
        return error_response(f"Validation error on '{field}': {first_err.get('msg')}", "VALIDATION_ERROR", 400, req_id)
    except Exception:
        return error_response("Malformed JSON body.", "BAD_REQUEST", 400, req_id)

    try:
        voice_svc = get_voice_service()
        audio_bytes, mime = voice_svc.synthesize_speech(payload.text, voice=payload.voice, audio_format=payload.format)
        resp = Response(audio_bytes, mimetype=mime)
        resp.headers["Content-Disposition"] = f'inline; filename="speech.{payload.format}"'
        resp.headers["X-Request-ID"] = req_id
        return resp
    except VoiceServiceError as vse:
        return error_response(vse.message, vse.error_code, vse.status_code, req_id)
    except Exception as e:
        logger.error(f"[{req_id}] Speech synthesis error: {e}", exc_info=True)
        return error_response("Speech synthesis service encountered an unexpected error.", "INTERNAL_ERROR", 500, req_id)


@app.route("/api/feedback", methods=["POST"])
def feedback_endpoint():
    """Customer satisfaction and resolution rating intake."""
    req_id = getattr(g, "request_id", f"req_{uuid.uuid4().hex[:8]}")

    if not request.is_json:
        return error_response("Request content type must be application/json.", "BAD_REQUEST", 400, req_id)

    try:
        payload = FeedbackRequest(**request.get_json())
    except ValidationError as ve:
        first_err = ve.errors()[0]
        field = ".".join(str(loc) for loc in first_err.get("loc", []))
        return error_response(f"Validation error on '{field}': {first_err.get('msg')}", "VALIDATION_ERROR", 400, req_id)
    except Exception:
        return error_response("Malformed JSON body.", "BAD_REQUEST", 400, req_id)

    try:
        fb_svc = get_feedback_service()
        res = fb_svc.record_feedback(
            query=payload.query,
            intent=payload.intent,
            final_decision=payload.final_decision,
            rating=payload.rating,
            helpful=payload.helpful,
            comment=payload.comment,
            request_id=payload.request_id or req_id
        )
        return jsonify(res), 200
    except ValueError as ve:
        return error_response(str(ve), "BAD_REQUEST", 400, req_id)
    except Exception as e:
        logger.error(f"[{req_id}] Feedback recording error: {e}", exc_info=True)
        return error_response("Feedback service encountered an unexpected error.", "INTERNAL_ERROR", 500, req_id)


@app.route("/api/replay", methods=["POST"])
def replay_endpoint():
    """Pipeline Replay & Diagnostic Audit between query variants."""
    req_id = getattr(g, "request_id", f"req_{uuid.uuid4().hex[:8]}")

    if not request.is_json:
        return error_response("Request content type must be application/json.", "BAD_REQUEST", 400, req_id)

    try:
        payload = ReplayRequest(**request.get_json())
    except ValidationError as ve:
        first_err = ve.errors()[0]
        field = ".".join(str(loc) for loc in first_err.get("loc", []))
        return error_response(f"Validation error on '{field}': {first_err.get('msg')}", "VALIDATION_ERROR", 400, req_id)
    except Exception:
        return error_response("Malformed JSON body.", "BAD_REQUEST", 400, req_id)

    try:
        orch = get_orchestrator()
        variant_b = payload.modified_query or payload.query
        res = execute_decision_replay(
            orchestrator=orch,
            query_a=payload.query,
            query_b=variant_b,
            slots_a=payload.customer_slots,
            slots_b=payload.customer_slots
        )
        return jsonify(res), 200
    except Exception as e:
        logger.error(f"[{req_id}] Decision replay error: {e}", exc_info=True)
        return error_response("Decision replay execution failed.", "INTERNAL_ERROR", 500, req_id)


# ---------------------------------------------------------------------------
# Intelligence Core Endpoints (Parts 1, 2, 3)
# ---------------------------------------------------------------------------

@app.route("/api/conflicts", methods=["GET"])
def get_conflicts_endpoint():
    """List recent agent disagreements and evidence-based resolutions."""
    limit = int(request.args.get("limit", 50))
    conflicts = get_conflict_engine().get_recent_conflicts(limit=limit)
    return jsonify({"conflicts": conflicts, "total": len(conflicts)}), 200


@app.route("/api/conflicts/<conflict_id>", methods=["GET"])
def get_conflict_detail_endpoint(conflict_id: str):
    """Retrieve single conflict record."""
    conf = get_conflict_engine().get_conflict_by_id(conflict_id)
    if not conf:
        req_id = getattr(g, "request_id", f"req_{uuid.uuid4().hex[:8]}")
        return error_response(f"Conflict record '{conflict_id}' not found.", "NOT_FOUND", 404, req_id)
    return jsonify(conf), 200


@app.route("/api/workflows/capabilities", methods=["GET"])
def get_capabilities_endpoint():
    """Catalog of all atomic capabilities and mandatory safety requirements."""
    caps = [c.model_dump() for c in get_capability_registry().list_capabilities()]
    mandatory = get_capability_registry().get_mandatory_capabilities()
    return jsonify({"capabilities": caps, "mandatory_capabilities": mandatory}), 200


@app.route("/api/workflows/plan", methods=["POST"])
def plan_workflow_endpoint():
    """Generate dynamic agent team formation plan for a query."""
    req_id = getattr(g, "request_id", f"req_{uuid.uuid4().hex[:8]}")
    if not request.is_json:
        return error_response("Request content type must be application/json.", "BAD_REQUEST", 400, req_id)
    try:
        payload = WorkflowPlanRequest(**request.get_json())
    except ValidationError as ve:
        return error_response(str(ve), "VALIDATION_ERROR", 400, req_id)
    plan = get_workflow_planner().plan_workflow(
        query=payload.query,
        session_slots=payload.customer_slots,
        preferred_mode=payload.preferred_mode
    )
    return jsonify(plan.model_dump()), 200


@app.route("/api/knowledge-gaps", methods=["GET"])
def get_knowledge_gaps_endpoint():
    """List recent knowledge gap events with PII redacted."""
    limit = int(request.args.get("limit", 100))
    gaps = get_knowledge_service().get_gap_events(limit=limit)
    return jsonify({"gaps": gaps, "total": len(gaps)}), 200


@app.route("/api/knowledge-gaps/clusters", methods=["GET"])
def get_knowledge_clusters_endpoint():
    """List clustered unaddressed queries with priority scoring."""
    clusters = get_knowledge_service().get_clusters()
    return jsonify({"clusters": clusters, "total": len(clusters)}), 200


@app.route("/api/knowledge-suggestions", methods=["GET"])
def get_knowledge_suggestions_endpoint():
    """List proposed grounded FAQ recommendations."""
    suggestions = get_knowledge_service().get_recommendations()
    return jsonify({"suggestions": suggestions, "total": len(suggestions)}), 200


@app.route("/api/knowledge-suggestions/<suggestion_id>/review", methods=["POST"])
def review_knowledge_suggestion_endpoint(suggestion_id: str):
    """Approve or reject a proposed FAQ recommendation."""
    req_id = getattr(g, "request_id", f"req_{uuid.uuid4().hex[:8]}")
    if not request.is_json:
        return error_response("Request content type must be application/json.", "BAD_REQUEST", 400, req_id)
    try:
        payload = FAQReviewRequest(**request.get_json())
        res = get_knowledge_service().review_suggestion(
            suggestion_id=suggestion_id,
            action=payload.action,
            reviewer=payload.reviewer or "Supervisor",
            rejection_reason=payload.rejection_reason
        )
        return jsonify(res), 200
    except ValueError as ve:
        return error_response(str(ve), "BAD_REQUEST", 400, req_id)
    except Exception as e:
        logger.error(f"[{req_id}] Suggestion review error: {e}", exc_info=True)
        return error_response(f"Review action failed: {e}", "INTERNAL_ERROR", 500, req_id)


@app.route("/api/knowledge/versions", methods=["GET"])
def get_knowledge_versions_endpoint():
    """List immutable knowledge base version snapshots."""
    versions = get_knowledge_service().get_versions()
    return jsonify({"versions": versions, "total": len(versions)}), 200


@app.route("/api/knowledge/versions/<version_id>/rollback", methods=["POST"])
def rollback_knowledge_version_endpoint(version_id: str):
    """Atomically rollback knowledge base to target snapshot."""
    req_id = getattr(g, "request_id", f"req_{uuid.uuid4().hex[:8]}")
    try:
        res = get_knowledge_service().rollback_to_version(version_id)
        return jsonify(res), 200
    except FileNotFoundError as fe:
        return error_response(str(fe), "NOT_FOUND", 404, req_id)
    except Exception as e:
        logger.error(f"[{req_id}] Rollback error: {e}", exc_info=True)
        return error_response(f"Rollback failed: {e}", "INTERNAL_ERROR", 500, req_id)


@app.route("/api/knowledge/benchmark", methods=["GET", "POST"])
def run_knowledge_benchmark_endpoint():
    """Execute retrieval regression benchmark against active knowledge base."""
    res = get_knowledge_service().run_retrieval_benchmark()
    return jsonify(res.model_dump()), 200


# Preload models if configured
preload_system_models()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print("\n" + "=" * 65)
    print(f"Starting RELAY AI Production Backend API on {host}:{port}")
    print(f"Health check:     http://localhost:{port}/api/health")
    print(f"System info:      http://localhost:{port}/api/info")
    print(f"Chat API:         http://localhost:{port}/api/chat")
    print(f"Intent API:       http://localhost:{port}/api/intent")
    print(f"Assistant Chat:   http://localhost:{port}/api/assistant/chat")
    print(f"Voice Transcribe: http://localhost:{port}/api/voice/transcribe")
    print(f"Voice Speech:     http://localhost:{port}/api/voice/speech")
    print(f"Feedback API:     http://localhost:{port}/api/feedback")
    print(f"Replay API:       http://localhost:{port}/api/replay")
    print("=" * 65 + "\n")
    app.run(host=host, port=port, debug=False)
