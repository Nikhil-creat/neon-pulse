"""Neon-Pulse core API: auth, signed scores, leaderboards, rewards, friends, ghosts,
AI chat + vision proxies, live WebSocket, Prometheus metrics."""
import json, logging, os, time, uuid
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import httpx, jwt, redis.asyncio as aioredis
from fastapi import Cookie, Depends, FastAPI, File, Header, HTTPException, Request, Response, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, generate_latest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from .core import config as C, security as S
from .models.db import Base, Chat, Contact, Cred, Ghost, Score, User
from .services.ratelimit import limiter

class J(logging.Formatter):
    def format(self, r): return json.dumps({"t": r.created, "lvl": r.levelname, "msg": r.getMessage(), "cid": getattr(r, "cid", None)})
_h = logging.StreamHandler(); _h.setFormatter(J()); log = logging.getLogger("api"); log.addHandler(_h); log.setLevel("INFO")

WS = Gauge("ws_connections", "Open WebSockets"); REQ = Counter("http_requests_total", "Requests", ["path", "status"])
LAT = Histogram("http_latency_seconds", "Latency", ["path"]); REJ = Counter("scores_rejected_total", "Rejected scores", ["reason"])
engine = create_async_engine(C.DATABASE_URL, pool_pre_ping=True); Session = async_sessionmaker(engine, expire_on_commit=False)
redis = aioredis.from_url(C.REDIS_URL, decode_responses=True)
SAMESITE = os.environ.get("COOKIE_SAMESITE", "none")

@asynccontextmanager
async def lifespan(app):
    if os.environ.get("AUTO_CREATE_TABLES", "1") == "1":  # set 0 in prod and run `make migrate`
        async with engine.begin() as c: await c.run_sync(Base.metadata.create_all)
    yield
    await redis.aclose()

app = FastAPI(title="Neon-Pulse API", version="1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=C.CORS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.middleware("http")
async def mw(request: Request, call_next):
    cid = request.headers.get("x-correlation-id", uuid.uuid4().hex[:12]); t = time.time(); path = request.url.path
    try:
        vision = path.startswith("/api/v1/vision")
        resp = await limiter(request, call_next, redis, 600 if vision else 100, "vision" if vision else "api")
    except Exception as e:
        log.error(f"unhandled {type(e).__name__}: {e}", extra={"cid": cid}); return Response("internal error", 500)
    resp.headers.update({"x-correlation-id": cid, "x-content-type-options": "nosniff", "x-frame-options": "DENY", "referrer-policy": "no-referrer"})
    REQ.labels(path, resp.status_code).inc(); LAT.labels(path).observe(time.time() - t)
    log.info(f"{request.method} {path} {resp.status_code}", extra={"cid": cid}); return resp

async def me(authorization: str = Header("")):
    try: return S.read_token(authorization.removeprefix("Bearer "), "access")
    except jwt.PyJWTError: raise HTTPException(401, "invalid token")

async def opt_me(authorization: str = Header("")):
    try: return S.read_token(authorization.removeprefix("Bearer "), "access")
    except jwt.PyJWTError: return None

def _keys():
    d = datetime.now(timezone.utc); return {"all": "lb:all", "today": f"lb:d:{d:%Y%m%d}", "week": f"lb:w:{d:%G%V}"}

async def stats_of(u: str) -> dict:
    h = await redis.hgetall(f"stats:{u}"); rk = await redis.zrevrank("lb:all", u)
    return {"user": u, "best": int(h.get("best", 0)), "rounds": int(h.get("rounds", 0)), "accuracy_pct": round(100 * int(h.get("hits", 0)) / max(1, int(h.get("shots", 0)))),
            "coins": int(h.get("coins", 0)), "streak": int(h.get("streak", 0)), "persona": h.get("persona", "unranked"), "global_rank": None if rk is None else rk + 1}

@app.get("/health")
async def health(): return {"ok": True}
@app.get("/ready")
async def ready():
    try:
        await redis.ping()
        async with engine.connect() as c: await c.exec_driver_sql("select 1")
    except Exception as e: raise HTTPException(503, f"not ready: {type(e).__name__}")
    return {"ready": True}
@app.get("/metrics")
async def metrics(): return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# ---------- auth ----------
@app.post("/api/v1/auth/register", status_code=201)
async def register(c: Cred):
    async with Session() as s:
        if (await s.execute(select(User).where(User.name == c.name))).scalar(): raise HTTPException(409, "name taken")
        s.add(User(name=c.name, pw=S.hash_pw(c.password))); await s.commit()
    return {"ok": True}

@app.post("/api/v1/auth/login")
async def login(c: Cred, resp: Response):
    async with Session() as s: u = (await s.execute(select(User).where(User.name == c.name))).scalar()
    if not u or not S.verify_pw(c.password, u.pw): raise HTTPException(401, "bad credentials")
    resp.set_cookie("refresh", S.make_token(c.name, 60 * 24 * 7, "refresh"), httponly=True, secure=True, samesite=SAMESITE, max_age=604800)
    return {"access_token": S.make_token(c.name, 15, "access"), "sign_key": S.sign_key(c.name), "user": c.name}

@app.post("/api/v1/auth/refresh")
async def refresh(refresh: str | None = Cookie(None)):
    try: sub = S.read_token(refresh or "", "refresh")
    except jwt.PyJWTError: raise HTTPException(401, "invalid refresh")
    return {"access_token": S.make_token(sub, 15, "access"), "sign_key": S.sign_key(sub), "user": sub}

# ---------- scores / leaderboards ----------
@app.post("/api/v1/scores")
async def submit(request: Request, user: str = Depends(me), x_signature: str = Header("")):
    raw = await request.body()
    if not S.valid_signature(user, raw, x_signature): REJ.labels("signature").inc(); raise HTTPException(400, "bad signature")
    p = Score.model_validate_json(raw)
    if p.hits > p.shots or p.score > 10 * p.hits + p.hits * (p.hits + 1) // 2:
        REJ.labels("impossible").inc(); raise HTTPException(422, "score impossible for reported hits")
    tel = {"intervals": p.intervals, "hits": p.hits, "shots": p.shots}
    try:
        async with httpx.AsyncClient(timeout=8) as c:
            v = (await c.post(f"{C.AI_ENGINE_URL}/anticheat", json=tel)).json()
            persona = (await c.post(f"{C.AI_ENGINE_URL}/profile", json=tel)).json().get("persona", "unranked")
    except (httpx.HTTPError, ValueError): v, persona = {"trust": 50, "flag": "ai_engine_unreachable"}, "unranked"
    if v["trust"] < 40: REJ.labels("anticheat").inc(); raise HTTPException(422, f"rejected by anti-cheat: {v['flag']}")
    ks = _keys()
    for k in ks.values(): await redis.zadd(k, {user: p.score}, gt=True)
    await redis.expire(ks["today"], 172800); await redis.expire(ks["week"], 900000)
    st = f"stats:{user}"; best = int(await redis.hget(st, "best") or 0)
    await redis.hset(st, mapping={"best": max(best, p.score), "persona": persona})
    await redis.hincrby(st, "rounds", 1); await redis.hincrby(st, "hits", p.hits); await redis.hincrby(st, "shots", p.shots)
    await redis.incr("global:rounds")
    await redis.publish("live", json.dumps({"user": user, "score": p.score, "persona": persona}))
    return {"accepted": True, "trust": v["trust"], "persona": persona, "director": v.get("director")}

@app.get("/api/v1/leaderboard")
async def board(period: str = "all", limit: int = 100, user: str | None = Depends(opt_me)):
    limit = max(1, min(limit, 100))
    if period == "friends":
        if not user: raise HTTPException(401, "login required")
        names = list(await redis.smembers(f"friends:{user}")) + [user]
        scores = await redis.zmscore("lb:all", names)
        rows = sorted(((n, s) for n, s in zip(names, scores) if s is not None), key=lambda r: -r[1])[:limit]
    else:
        k = _keys().get(period)
        if not k: raise HTTPException(400, "period: all|today|week|friends")
        rows = await redis.zrevrange(k, 0, limit - 1, withscores=True)
    return [{"rank": i + 1, "user": u, "score": int(s)} for i, (u, s) in enumerate(rows)]

# ---------- player: stats, rewards, friends, ghosts ----------
@app.get("/api/v1/me/stats")
async def my_stats(user: str = Depends(me)): return await stats_of(user)

@app.post("/api/v1/rewards/daily")
async def daily(user: str = Depends(me)):
    now = datetime.now(timezone.utc); day, yday = f"{now:%Y%m%d}", f"{now - timedelta(days=1):%Y%m%d}"
    if not await redis.set(f"daily:{user}:{day}", 1, nx=True, ex=172800): raise HTTPException(409, "already claimed today")
    prev = await redis.exists(f"daily:{user}:{yday}"); st = f"stats:{user}"
    streak = (int(await redis.hget(st, "streak") or 0) + 1) if prev else 1
    bonus = 50 + 10 * min(streak, 10)
    await redis.hset(st, "streak", streak); await redis.hincrby(st, "coins", bonus)
    return {"bonus": bonus, "streak": streak}

@app.post("/api/v1/friends/{name}", status_code=201)
async def add_friend(name: str, user: str = Depends(me)):
    if name == user: raise HTTPException(400, "cannot friend yourself")
    async with Session() as s:
        if not (await s.execute(select(User).where(User.name == name))).scalar(): raise HTTPException(404, "no such player")
    await redis.sadd(f"friends:{user}", name); return {"ok": True}

@app.post("/api/v1/ghosts")
async def save_ghost(g: Ghost, user: str = Depends(me)):
    cur = json.loads(await redis.get(f"ghost:{user}") or '{"score":-1}')
    if g.score >= cur["score"]: await redis.set(f"ghost:{user}", g.model_dump_json())
    return {"saved": g.score >= cur["score"]}

@app.get("/api/v1/ghosts/{who}")
async def get_ghost(who: str, user: str = Depends(me)):
    if who == "top":
        top = await redis.zrevrange("lb:all", 0, 0); who = top[0] if top else user
    raw = await redis.get(f"ghost:{who}")
    if not raw: raise HTTPException(404, "no ghost recorded")
    return {"user": who, **json.loads(raw)}

# ---------- AI + vision proxies ----------
@app.post("/api/v1/chat")
async def chat(c: Chat, user: str = Depends(me)):
    player = await stats_of(user)
    async def gen():
        try:
            async with httpx.AsyncClient(timeout=None) as cl:
                async with cl.stream("POST", f"{C.AI_ENGINE_URL}/chat", json={"message": c.message, "player": player}) as r:
                    async for line in r.aiter_lines():
                        if line: yield line + "\n\n"
        except httpx.HTTPError: yield 'data: {"token": "AI engine unreachable"}\n\ndata: [DONE]\n\n'
    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

async def _vision(path: str, frame: UploadFile):
    data = await frame.read()
    if len(data) > 1_000_000: raise HTTPException(413, "frame too large")
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.post(f"{os.environ.get('VISION_URL', 'http://vision_service:8002')}{path}", files={"frame": ("f.jpg", data, "image/jpeg")})
        return r.json()
    except httpx.HTTPError: raise HTTPException(503, "vision service unavailable")

@app.post("/api/v1/vision/gesture")
async def gesture(frame: UploadFile = File(...), user: str = Depends(me)): return await _vision("/gesture", frame)
@app.post("/api/v1/vision/presence")
async def presence(frame: UploadFile = File(...), user: str = Depends(me)): return await _vision("/presence", frame)

# ---------- live feed ----------
@app.websocket("/ws/live")
async def live(ws: WebSocket):
    await ws.accept(); WS.inc(); ps = redis.pubsub(); await ps.subscribe("live")
    try:
        async for m in ps.listen():
            if m["type"] == "message": await ws.send_text(m["data"])
    except WebSocketDisconnect: pass
    finally: WS.dec(); await ps.close()

# ---------- achievements, public profiles, global stats, contact ----------
ACH = [("first_blood", "First Blood", "Finish a ranked round", lambda s: s["rounds"] >= 1),
       ("centurion", "Centurion", "Score 100+ in a round", lambda s: s["best"] >= 100),
       ("sharpshooter", "Sharpshooter", "90%+ accuracy over 3 rounds", lambda s: s["rounds"] >= 3 and s["accuracy_pct"] >= 90),
       ("regular", "Regular", "3-day reward streak", lambda s: s["streak"] >= 3),
       ("veteran", "Veteran", "Play 25 rounds", lambda s: s["rounds"] >= 25),
       ("legend", "Legend", "Score 400+ in a round", lambda s: s["best"] >= 400)]
SKINS = {"first_blood": "Cyberpunk Neon", "sharpshooter": "Retro 8-Bit", "regular": "Synthwave 80s", "legend": "Ghost Gold"}

@app.get("/api/v1/me/achievements")
async def achievements(user: str = Depends(me)):
    s = await stats_of(user); out = [{"id": i, "name": n, "desc": d, "unlocked": bool(fn(s))} for i, n, d, fn in ACH]
    return {"achievements": out, "skins": [SKINS[a["id"]] for a in out if a["unlocked"] and a["id"] in SKINS]}

@app.get("/api/v1/players/{name}")
async def profile(name: str):
    if not await redis.exists(f"stats:{name}"): raise HTTPException(404, "no such player")
    s = await stats_of(name); s.pop("coins"); return s

@app.get("/api/v1/stats/global")
async def global_stats(): return {"players": await redis.zcard("lb:all"), "rounds": int(await redis.get("global:rounds") or 0)}

@app.post("/api/v1/contact", status_code=201)
async def contact(c: Contact):
    await redis.lpush("contact:inbox", c.model_dump_json()); await redis.ltrim("contact:inbox", 0, 499); return {"ok": True}
