# Architecture
- **docs/**: static frontend (HTML, CSS, vanilla JS modules `game.js`, `api.js`, `site.js`). Deployed by GitHub Pages from `/docs`, or by nginx in `frontend/`.
- **backend_api/**: FastAPI. Postgres stores users. Redis stores sorted-set leaderboards (`lb:all`, `lb:d:YYYYMMDD`, `lb:w:YYYYWW`), per-player stats hashes, ghosts, friends, daily-reward keys, rate-limit counters and the `live` pub/sub channel.
- **ai_engine/**: LangGraph pipeline (anti-cheat then director), profiler, commentator, hybrid RAG (BM25 + BGE in Qdrant, RRF), Click-Bot chat with tool calling over SSE.
- **vision_service/**: PyTorch CNN (`idle`, `tap`, `fist`) and OpenCV face presence.
## Score flow
client signs body (HMAC-SHA256, per-user key) -> `POST /api/v1/scores` -> signature + maths check -> ai_engine `/anticheat` (trust) -> trust >= 40 -> ZADD boards, update stats, publish live event.
## Endpoints (v1)
auth: register, login, refresh · scores · leaderboard (all|today|week|friends) · me/stats · me/achievements · players/{name} · rewards/daily · friends/{name} · ghosts · chat (SSE) · vision/gesture, vision/presence · stats/global · contact · `/health` `/ready` `/metrics` `/ws/live`
