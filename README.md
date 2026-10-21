# Neon-Pulse · Pixel Clicker AI Platform

> Intelligence built into every click. An AI-native clicker game platform with agentic AI, hybrid RAG, computer vision, signed scores and live leaderboards.

**Live site:** https://nikhil-creat.github.io/neon-pulse/ · **Author:** [Nikhil Chary Sriramoju](https://github.com/Nikhil-creat) · MIT licensed

## Features
- **Agents (LangGraph):** Gameplay Director adapts difficulty, Anti-Cheat Guardrail assigns a 0–100 trust score, Profiler assigns playstyle personas, Commentator narrates.
- **Click-Bot Prime:** streaming chatbot (Groq, Gemini fallback) with tool calling (stats, daily reward, challenges, knowledge search).
- **Hybrid RAG:** BM25 + BGE vectors (Qdrant) fused with RRF, HyDE query expansion and cross-encoder re-ranking.
- **Computer vision:** PyTorch CNN turns webcam gestures into clicks; OpenCV presence check.
- **Integrity:** HMAC-SHA256 signed scores, server-side maximum-score check, trust threshold of 40.
- **Live play:** Redis leaderboards (All time, Today, Week, Friends), WebSocket feed, daily rewards, streaks, friends, ghost replay, achievements, unlockable themes.
- **Avatar Lab:** in-browser photo to pixel / neon / synthwave avatar (private, no upload).
- **Ops:** JWT auth with refresh cookie, rate limiting, Prometheus `/metrics`, JSON logs, health checks, non-root Docker images, Alembic migrations, CI.

## Architecture
```
Browser (GitHub Pages) --HTTPS/WSS/SSE--> Caddy --> backend_api :8000 --> Postgres (users) · Redis (boards, stats, pub/sub)
                                                      |-- ai_engine :8001 --> Qdrant · Groq / Gemini
                                                      '-- vision_service :8002  (PyTorch CNN, OpenCV)
```
| Folder | Purpose |
|---|---|
| `docs/` | Static site served by GitHub Pages (HTML, CSS, vanilla JS) |
| `backend_api/` | FastAPI: auth, scores, leaderboards, rewards, friends, ghosts, proxies |
| `ai_engine/` | Agents, hybrid RAG, chat over SSE |
| `vision_service/` | Gesture CNN + presence check (`train.py`) |
| `frontend/` | nginx image for `docs/` |

Tech: Python 3.12, FastAPI, LangGraph, PostgreSQL 16, Redis 7, Qdrant, PyTorch, OpenCV, Docker Compose, Caddy, GitHub Actions.

## Quick start (full stack)
```bash
cp .env.example .env     # set JWT_SECRET, SIGN_SECRET, POSTGRES_PASSWORD, GROQ_API_KEY and/or GEMINI_API_KEY
docker compose up --build
```
Site http://localhost:8080 · API docs http://localhost:8000/docs · metrics http://localhost:8000/metrics
First start downloads the embedding model (~130 MB). Both Groq and Gemini offer free API keys.

## Deploy the site on GitHub Pages
1. Push this repo to GitHub (`Nikhil-creat/neon-pulse`).
2. **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/docs` → Save.**
3. Wait about a minute: https://nikhil-creat.github.io/neon-pulse/

GitHub Pages hosts only the static site (offline mode: local game, built-in Q&A, Avatar Lab). To enable accounts, leaderboards and the AI, run the backend and paste its HTTPS URL into the site's **Account** box:
- Quick: `docker compose up -d` then `cloudflared tunnel --url http://localhost:8000`
- Permanent: a VPS with a domain, `DOMAIN=api.yourdomain.com` in `.env`, then `make prod` (Caddy issues the TLS certificate).
- Always add `https://nikhil-creat.github.io` to `CORS_ORIGINS` in `.env`.

## Gesture mode
Add 100+ photos per class in `vision_service/dataset/{idle,tap,fist}/`, run `python train.py` in `vision_service/`, rebuild. Without weights the endpoint predicts but never clicks.

## Development
```bash
make test      # pytest: signatures, JWT, passwords, agents
make migrate   # Alembic (set AUTO_CREATE_TABLES=0 in production)
```
See `ARCHITECTURE.md`, `SECURITY.md`, `CONTRIBUTING.md`.

## Roadmap
Next.js frontend, diffusion/StyleGAN avatars, Redis Cluster mode, tournaments.

## License
MIT © 2026 Nikhil Chary Sriramoju
