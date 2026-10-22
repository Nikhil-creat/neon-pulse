"""Playwright end-to-end smoke test for the static site.  BASE=http://localhost:8000 python e2e/smoke.py"""
import os, sys
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BASE", "http://localhost:8000")
ignore = ("ERR_NAME_NOT_RESOLVED", "ERR_INTERNET_DISCONNECTED", "Failed to load resource")

def hit(pg, i=0):
    pg.evaluate("""i=>{const t=T[i];if(!t)return;const r=cv.getBoundingClientRect(),d=devicePixelRatio||1;
      A.gz=true;cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+t.x/d,clientY:r.top+t.y/d}));A.gz=false}""", i)

with sync_playwright() as p:
    b = p.chromium.launch(); ctx = b.new_context(viewport={"width": 390, "height": 800}); errs = []
    pg = ctx.new_page(); pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and not any(x in m.text for x in ignore) and errs.append(m.text))
    pg.goto(BASE + "/index.html"); pg.wait_for_timeout(600)
    # local account
    pg.fill("#un", "e2e_user"); pg.fill("#pw", "password123"); pg.click("#rg"); pg.wait_for_timeout(300)
    assert pg.inner_text("#li") == "Log out", "register should log in locally"
    # play + power-ups
    pg.click("#go"); pg.wait_for_timeout(1700); hit(pg)
    pg.evaluate("T=[{x:200,y:200,r:30,b:performance.now(),type:'gold'}];sc=0;cb=0"); hit(pg)
    assert pg.evaluate("sc") == 33, "gold ring pays x3"
    pg.evaluate("st=performance.now()-40000"); pg.wait_for_timeout(500)
    assert "e2e_user" in pg.inner_text("#lb"), "score appears on board"
    # seeded daily layout is deterministic
    pg.click("[data-m=daily]")
    def layout():
        pg.click("#go"); pg.wait_for_timeout(1700)
        r = pg.evaluate("T.slice(0,2).map(o=>[Math.round(o.x),Math.round(o.y),o.type])"); pg.evaluate("st=performance.now()-40000"); pg.wait_for_timeout(400); return r
    assert layout() == layout(), "daily layout must be identical"
    # weekly cup
    pg.click("#cupgo"); pg.wait_for_timeout(600); assert pg.evaluate("[run,MODE]") == [True, "rush"]
    pg.evaluate("sc=9999;st=performance.now()-40000"); pg.wait_for_timeout(600); assert "Won" in pg.inner_text("#cupb")
    # palette
    pg.keyboard.press("/"); pg.wait_for_timeout(150); pg.keyboard.type("theme: retro"); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    # duel over WebRTC between two pages
    a = ctx.new_page(); a.on("pageerror", lambda e: errs.append("host:" + str(e))); a.goto(BASE + "/index.html")
    g = ctx.new_page(); g.on("pageerror", lambda e: errs.append("guest:" + str(e))); g.goto(BASE + "/index.html"); a.wait_for_timeout(400)
    a.click("#du"); a.click("#dh"); a.wait_for_function("document.getElementById('dc1').value.length>50", timeout=20000)
    g.click("#du"); g.click("#dj"); g.fill("#dc2", a.input_value("#dc1")); g.click("#dgo")
    g.wait_for_function("document.getElementById('dc1').value.length>50", timeout=20000)
    a.fill("#dc2", g.input_value("#dc1")); a.click("#dgo")
    a.wait_for_function("run===true", timeout=25000); g.wait_for_function("run===true", timeout=25000)
    a.evaluate("sc=77"); g.wait_for_timeout(900); assert "77" in g.inner_text("#oh")
    print("e2e OK"); b.close()
    if errs: print("ERRORS", errs); sys.exit(1)
