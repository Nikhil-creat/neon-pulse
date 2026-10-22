# Architecture
- **docs/**: static frontend (HTML, CSS, vanilla JS modules `game.js`, `api.js`, `site.js`). Deployed by GitHub Pages from `/docs`, or by nginx in `frontend/`.
- **backend_api/**: FastAPI. Postgres stores users. Redis stores sorted-set leaderboards (`lb:all`, `lb:d:YYYYMMDD`, `lb:w:YYYYWW`), per-player stats hashes, ghosts, friends, daily-reward keys, rate-limit counters and the `live` pub/sub channel.
- **ai_engine/**: LangGraph pipeline (anti-cheat then director), profiler, commentator, hybrid RAG (BM25 + BGE in Qdrant, RRF), Click-Bot chat with tool calling over SSE.
- **vision_service/**: PyTorch CNN (`idle`, `tap`, `fist`) and OpenCV face presence.
## Score flow
client signs body (HMAC-SHA256, per-user key) -> `POST /api/v1/scores` -> signature + maths check -> ai_engine `/anticheat` (trust) -> trust >= 40 -> ZADD boards, update stats, publish live event.
## Endpoints (v1)
auth: register, login, refresh · scores · leaderboard (all|today|week|friends) · me/stats · me/achievements · players/{name} · rewards/daily · friends/{name} · ghosts · chat (SSE) · vision/gesture, vision/presence · stats/global · contact · `/health` `/ready` `/metrics` `/ws/live`

## v5 additions
- **web/**: Next.js 15 static export. Zustand store (`api base`, token, sign key), `api.ts` fetch wrapper + HMAC helper, `GameCanvas`, `Leaderboard` (+ `useLive` WebSocket), `ChatPanel` (SSE).
- **avatar_service/**: `POST /stylize` runs SD-Turbo img2img (2 steps). Backend proxies it at `POST /api/v1/avatar` (auth required). Start with `--profile avatar`.
- **Redis Cluster**: `REDIS_CLUSTER=1` switches to `redis.asyncio.cluster.RedisCluster`; pub/sub runs on a single plain connection (`PUBSUB_URL`). All keys are single-key operations, so no hash-tag design is needed.
- **Gesture training**: `docs/collect.html` -> `dataset.json` -> `train.py` / Colab -> `weights/gesture.pt`.
- **On-device LLM**: optional WebLLM (Qwen2.5-0.5B, WebGPU) loaded from a CDN on demand; answers use the local RAG context.

## v6 additions
- **fx.js**: WebGL fragment shader (domain-warped fbm plasma, half-resolution, 30 fps, paused off-screen), pointer-driven card tilt, count-up stats, WebAudio generative music.
- **local.js**: Weekly Cup state machine (`PR.cup`, seeded by week number), rating/tier, per-mode ghosts.
- **observability/**: Prometheus scrape of `/metrics`, provisioned Grafana dashboard (rate, p95 latency, WebSockets, rejected scores).
