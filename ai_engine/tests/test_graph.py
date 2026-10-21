import random
from app.agents.graph import anticheat, director, profile

def test_macro_flagged():
    r = anticheat({"intervals": [100.0] * 30}); assert r["trust"] < 40

def test_human_passes():
    random.seed(1); r = anticheat({"intervals": [random.gauss(320, 90) for _ in range(30)]}); assert r["trust"] >= 55

def test_director_and_persona():
    assert director({"hits": 9, "shots": 10})["director"]["note"] == "harder"
    assert profile(4, .5) == "The Speed Demon" and profile(1, .95) == "Precision Sniper"
