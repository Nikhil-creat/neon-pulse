# Neon-Pulse · Pixel Clicker AI Platform  (v6)

> Intelligence built into every click. An AI-native clicker platform with agentic AI, hybrid RAG, computer vision, signed scores, live leaderboards and peer-to-peer duels.

**Live site:** https://nikhil-creat.github.io/neon-pulse/ · **Author:** [Nikhil Chary Sriramoju](https://github.com/Nikhil-creat) · MIT

## New in v6
- **Graphics:** live WebGL plasma backdrop, perspective neon arena grid with cursor trails and screen shake, 3D spotlight cards, scroll progress bar, tech marquee, film grain, red / cyan / amber palette and two new themes (Aurora Ice, Ghost Gold). One command turns effects off (also respects reduced-motion).
- **Weekly Cup:** 8-player knockout vs bots on seeded 15-second Rush rounds, coins, trophies. **Rank tiers** Bronze to Mythic. Local **ghost replay**.
- **Generative synthwave music** that speeds up with your combo; **Telugu / Hindi / English** voice and AI replies.
- **Professional tooling:** Prometheus + Grafana dashboard (`make obs`), k6 load test (`make load`), Playwright e2e in CI (`make e2e`).

## Highlights
- **Works with no backend:** local profiles, boards, friends, rewards, achievements, five game modes, power-up rings, seeded Daily Challenge, analytics, backup/restore, P2P WebRTC duels.
- **AI in the browser:** Click-Bot agent with Groq function calling or Gemini (your free key), optional **on-device model** (WebGPU, no key), AI coach, voice control, webcam motion mode, command palette (`/`).
- **Full backend (Docker):** FastAPI + Postgres + Redis (or Redis Cluster) + Qdrant; LangGraph agents (director, anti-cheat, profiler, commentator); hybrid RAG (BM25 + BGE + RRF + HyDE + cross-encoder); HMAC-signed scores; JWT auth; Prometheus; CI.
- **Vision:** PyTorch gesture CNN + OpenCV presence. Train it yourself with `docs/collect.html` + the Colab notebook.
- **Avatars:** instant in-browser filters, or diffusion (SD-Turbo) through the optional avatar service.
- **Two frontends:** `docs/` (vanilla, deployed on Pages) and `web/` (Next.js 15, React 19, Tailwind 4, Zustand, Framer Motion).

## Repo map
| Path | Purpose |
|---|---|
| `docs/` | Static site served by GitHub Pages (+ `collect.html` gesture trainer) |
| `web/` | Next.js client (static export) |
| `backend_api/` | FastAPI API, Alembic migrations, tests |
| `ai_engine/` | Agents, hybrid RAG, chat over SSE |
| `vision_service/` | Gesture CNN, presence check, `train.py` |
| `avatar_service/` | Optional diffusion avatars |
| `notebooks/` | Colab gesture training |
| `docker-compose*.yml`, `Caddyfile`, `Makefile`, `.github/workflows` | Ops |

## Deploy the site on GitHub Pages
1. Push this repo to `Nikhil-creat/neon-pulse`.
2. **Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/docs` → Save.**
3. Open https://nikhil-creat.github.io/neon-pulse/ (about a minute). Update later with `git add . && git commit -m "update" && git push`.

Optional: publish the Next.js app instead: Settings → Pages → Source **GitHub Actions**, then Actions → *deploy-next* → Run workflow.

## Run the full stack
```bash
cp .env.example .env     # set secrets + GROQ_API_KEY and/or GEMINI_API_KEY (both free)
docker compose up --build
```
Site http://localhost:8080 · API docs http://localhost:8000/docs · metrics http://localhost:8000/metrics

| Add-on | Command |
|---|---|
| Diffusion avatars (2 GB model, slow on CPU) | `make avatar` |
| Next.js app on :8081 | `make next` |
| Redis Cluster (experimental) | `make cluster` |
| Production HTTPS (Caddy, set `DOMAIN`) | `make prod` |
| Migrations (`AUTO_CREATE_TABLES=0` in prod) | `make migrate` |
| Tests | `make test` (unit) · `make e2e` (browser) |
| Grafana (:3000) + Prometheus (:9090) | `make obs` |
| Load test | `make load` (set `RATE_LIMIT=100000` in `.env` first) |

To use the backend from the Pages site: expose it over HTTPS (`cloudflared tunnel --url http://localhost:8000` or a VPS with `make prod`), add `https://nikhil-creat.github.io` to `CORS_ORIGINS`, paste the URL into the Account box.

## Train your gestures
1. Open `collect.html` on your phone, record ~150 frames each for idle / tap / fist, download `dataset.json`.
2. Upload it to `notebooks/train_gesture_colab.ipynb` in Google Colab (or run `python vision_service/train.py dataset.json`).
3. Put `gesture.pt` at `vision_service/weights/gesture.pt`, rebuild `vision_service`.

## Status and honesty
Verified in a headless browser (also what `e2e/smoke.py` runs): the static site (modes, power-ups, seeded rounds, boards, Weekly Cup, WebGL backdrop, analytics, WebRTC duel, trainer page). Written but **not executed here**: the Next.js app (CI builds it), avatar service, Redis Cluster mode, on-device WebGPU model, Grafana/k6, the Docker stack end to end. Report issues via GitHub.

See `ARCHITECTURE.md`, `SECURITY.md`, `CONTRIBUTING.md`, `CHANGELOG.md`.
