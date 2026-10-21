"""AI engine: agents, hybrid RAG, and Click-Bot Prime (Groq primary, Gemini fallback, SSE streaming)."""
import json, os
from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from .agents import graph as ag
from .rag import hybrid
from .tools import defs

@asynccontextmanager
async def lifespan(app):
    hybrid.ingest("knowledge"); yield
app = FastAPI(title="Neon-Pulse AI Engine", lifespan=lifespan)
GROQ, GEM = os.environ.get("GROQ_API_KEY", ""), os.environ.get("GEMINI_API_KEY", "")
SYS = "You are Click-Bot Prime, a concise esports coach. Use tools for stats, rewards, challenges and rules."

class Tel(BaseModel): intervals: list[float] = []; hits: int = 0; shots: int = 0
class Chat(BaseModel): message: str; player: dict = {}

@app.get("/health")
async def health(): return {"ok": True}
@app.post("/anticheat")
async def anticheat(t: Tel): return await ag.graph.ainvoke(t.model_dump())
@app.post("/profile")
async def profile(t: Tel): 
    acc = t.hits / t.shots if t.shots else 0
    return {"persona": ag.profile(t.hits / 30, acc)}
@app.get("/commentary")
async def commentary(combo: int = 0, rank_delta: int = 0): return {"text": ag.commentary(combo, rank_delta)}
@app.get("/rag/query")
async def rag_q(q: str): return {"chunks": hybrid.search(q)}

async def hyde(q: str):
    """HyDE: have the LLM draft a hypothetical answer passage, used to expand retrieval."""
    if not GROQ: return None
    try:
        async with httpx.AsyncClient(timeout=6) as cl:
            r = await cl.post("https://api.groq.com/openai/v1/chat/completions", headers={"Authorization": f"Bearer {GROQ}"},
                              json={"model": os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile"), "max_tokens": 80, "messages": [{"role": "user", "content": "Write 2 sentences from a clicker-game rulebook answering: " + q}]})
            return r.json()["choices"][0]["message"]["content"]
    except Exception: return None

def sse(t): return f"data: {json.dumps({'token': t})}\n\n"

@app.post("/chat")
async def chat(c: Chat):
    async def gen():
        ctx = "\n".join(hybrid.search(c.message, hyde=await hyde(c.message)))
        msgs = [{"role": "system", "content": SYS + "\nContext:\n" + ctx}, {"role": "user", "content": c.message}]
        try:
            if GROQ:
                H = {"Authorization": f"Bearer {GROQ}"}; url = "https://api.groq.com/openai/v1/chat/completions"; model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
                async with httpx.AsyncClient(timeout=60) as cl:
                    r = (await cl.post(url, headers=H, json={"model": model, "messages": msgs, "tools": defs.TOOLS, "tool_choice": "auto"})).json()["choices"][0]["message"]
                    if r.get("tool_calls"):  # agentic tool loop (single round)
                        msgs.append(r)
                        for tc in r["tool_calls"]:
                            out = defs.run(tc["function"]["name"], json.loads(tc["function"]["arguments"] or "{}"), c.player)
                            msgs.append({"role": "tool", "tool_call_id": tc["id"], "content": out})
                    async with cl.stream("POST", url, headers=H, json={"model": model, "messages": msgs, "stream": True}) as s:
                        async for line in s.aiter_lines():
                            if line.startswith("data: ") and "[DONE]" not in line:
                                yield sse(json.loads(line[6:])["choices"][0]["delta"].get("content") or "")
            elif GEM:
                m = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
                async with httpx.AsyncClient(timeout=60) as cl:
                    r = await cl.post(f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent", headers={"x-goog-api-key": GEM},
                                      json={"contents": [{"parts": [{"text": msgs[0]["content"] + "\n\n" + c.message}]}]})
                    yield sse(r.json()["candidates"][0]["content"]["parts"][0]["text"])
            else: yield sse(ctx.split("\n")[0] + " (set GROQ_API_KEY or GEMINI_API_KEY for LLM answers)")
        except Exception as e: yield sse(f"[assistant error: {type(e).__name__}] " + ctx[:200])
        yield "data: [DONE]\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream")
