# RELAY AI — Production Deployment Readiness Audit

**Audited Date:** October 31, 2026  
**Audited Artifacts:** `requirements.txt`, `package.json`, `.env.example`, `Dockerfile`, `docker-compose.yml`

---

## 1. Startup & Deployment Configuration

### A. Python Backend Runtime
- **Requirements File:** [`requirements.txt`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/requirements.txt) pinned with explicit versions:
  - `Flask==3.0.3`
  - `gunicorn==22.0.0`
  - `pydantic==2.8.2`
  - `scikit-learn==1.5.1`
  - `joblib==1.4.2`
  - `numpy==2.0.1`
  - `flask-cors==4.0.1`
- **Development Startup:**
  ```bash
  python3 app/api.py
  ```
- **Production WSGI Startup:**
  ```bash
  gunicorn -w 4 -b 0.0.0.0:8000 "app.api:create_app()"
  ```

### B. React Frontend Runtime
- **Package Manager:** `npm` with lockfile [`package-lock.json`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/package-lock.json)
- **Development Startup:**
  ```bash
  npm run dev
  ```
- **Production Build & Preview:**
  ```bash
  npm run build
  npm run preview -- --port 3000
  ```

### C. Containerization
- **Dockerfile:** Multi-stage production container running Gunicorn on port 8000 and serving precompiled Vite assets.
- **Docker Compose:** [`docker-compose.yml`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/docker-compose.yml) orchestrating frontend and backend services with health check probes.

---

## 2. Environment Variables & Secret Separation

All configuration keys are documented in [`.env.example`](file:///Users/abhinavupadhyay/relay-ai/relay-ai/.env.example):
```env
# Server Binding
PORT=8000
HOST=0.0.0.0

# Security & CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Logging
LOG_LEVEL=INFO

# Optional External Generative LLM Adapter (Defaults to offline deterministic MockLLMProvider)
LLM_PROVIDER=mock
# OPENAI_API_KEY=your_key_here
```

Zero production secrets or keys are hardcoded in the codebase.

