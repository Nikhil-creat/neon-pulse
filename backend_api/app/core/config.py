import os
def env(k, d=""): return os.environ.get(k, d)
DATABASE_URL = env("DATABASE_URL"); REDIS_URL = env("REDIS_URL", "redis://redis:6379/0")
JWT_SECRET = env("JWT_SECRET", "dev"); SIGN_SECRET = env("SIGN_SECRET", "dev-sign")
AI_ENGINE_URL = env("AI_ENGINE_URL", "http://ai_engine:8001")
CORS = [o.strip() for o in env("CORS_ORIGINS", "*").split(",")]
