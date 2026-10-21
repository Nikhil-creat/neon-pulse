"""LangGraph pipeline: Anti-Cheat -> Director. Profiler + Commentator are plain functions."""
import math, statistics
from typing import TypedDict
from langgraph.graph import END, StateGraph

class S(TypedDict, total=False):
    intervals: list; hits: int; shots: int; trust: float; flag: str; director: dict

def anticheat(s: S) -> S:
    iv = s.get("intervals") or []
    trust, flag = 100.0, "clean"
    if len(iv) >= 12:
        m, sd = statistics.mean(iv), statistics.pstdev(iv)
        bins = {}
        for v in iv: bins[round(v / 10)] = bins.get(round(v / 10), 0) + 1
        ent = -sum(c / len(iv) * math.log2(c / len(iv)) for c in bins.values())
        if sd < 6 and m < 400: trust, flag = 25, "macro-like regularity"
        elif m > 0 and 1000 / m > 14: trust, flag = 30, "superhuman CPS"
        elif ent < 1.2 and len(iv) > 30: trust, flag = 55, "low entropy"
    return {"trust": trust, "flag": flag}

def director(s: S) -> S:
    acc = s["hits"] / s["shots"] if s.get("shots") else 1
    if acc > .85: d = {"spawn_ms": -60, "ring_px": -1, "note": "harder"}
    elif acc < .6: d = {"spawn_ms": +60, "ring_px": +1, "note": "easier"}
    else: d = {"spawn_ms": 0, "ring_px": 0, "note": "steady"}
    return {"director": d}

g = StateGraph(S); g.add_node("anticheat", anticheat); g.add_node("director", director)
g.set_entry_point("anticheat"); g.add_edge("anticheat", "director"); g.add_edge("director", END)
graph = g.compile()

def profile(cps: float, acc: float) -> str:
    return "The Speed Demon" if cps > 3.5 else "Precision Sniper" if acc > .9 else "Tactical Strategist"

def commentary(combo: int, rank_delta: int = 0) -> str:
    if rank_delta > 0: return f"Up {rank_delta} places on the board!"
    return f"Combo x{combo}, unreal rhythm!" if combo >= 10 else "Steady hands, keep the pace."
