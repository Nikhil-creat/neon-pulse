import time
from fastapi import Request
from fastapi.responses import JSONResponse

async def limiter(request: Request, call_next, redis, limit=100, scope="api"):
    """Fixed-window rate limit per IP and scope (Redis INCR + EXPIRE)."""
    ip = request.client.host if request.client else "?"
    key = f"rl:{scope}:{ip}:{int(time.time() // 60)}"
    n = await redis.incr(key)
    if n == 1: await redis.expire(key, 61)
    if n > limit: return JSONResponse({"detail": "rate limited"}, 429)
    return await call_next(request)
