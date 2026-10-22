"use client";
import { useEffect, useRef, useState } from "react";

export type Result = { score: number; hits: number; shots: number; intervals: number[] };
type Ring = { x: number; y: number; r: number; born: number };

/** Classic 30-second round. Reports score, hits, shots and click intervals (ms) when finished. */
export default function GameCanvas({ onFinish }: { onFinish: (r: Result) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const g = useRef({ on: false, start: 0, next: 0, rings: [] as Ring[], score: 0, combo: 0, hits: 0, shots: 0, clicks: [] as number[], last: "" });
  const [hud, setHud] = useState({ score: 0, combo: 0, time: 30, on: false });

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const fit = () => { const b = c.getBoundingClientRect(); c.width = b.width * devicePixelRatio; c.height = b.height * devicePixelRatio; };
    fit();
    addEventListener("resize", fit);
    const loop = (t: number) => {
      const s = g.current;
      ctx.clearRect(0, 0, c.width, c.height);
      if (s.on) {
        if (t > s.next) {
          const r = 26 * devicePixelRatio;
          s.rings.push({ x: r + Math.random() * (c.width - 2 * r), y: r + Math.random() * (c.height - 2 * r), r, born: t });
          s.next = t + 800;
        }
        s.rings = s.rings.filter((o) => {
          const a = (t - o.born) / 1400;
          if (a >= 1) { s.combo = 0; s.shots++; return false; }
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r * (1 - a * 0.3), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,255,255,${1 - a * 0.6})`; ctx.lineWidth = 3; ctx.fillStyle = "rgba(200,27,28,.45)";
          ctx.shadowColor = "#c81b1c"; ctx.shadowBlur = 20; ctx.stroke(); ctx.fill();
          return true;
        });
        ctx.shadowBlur = 0;
        const left = Math.max(0, 30 - (t - s.start) / 1000);
        const key = `${s.score}|${s.combo}|${Math.ceil(left)}`;
        if (key !== s.last) { s.last = key; setHud({ score: s.score, combo: s.combo, time: Math.ceil(left), on: true }); }
        if (left <= 0) {
          s.on = false;
          const iv = s.clicks.slice(1).map((v, i) => v - s.clicks[i]).slice(-500);
          setHud((h) => ({ ...h, on: false }));
          finishRef.current({ score: s.score, hits: s.hits, shots: s.shots, intervals: iv });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", fit); };
  }, []);

  const start = () => {
    const s = g.current;
    Object.assign(s, { on: true, start: performance.now(), next: 0, rings: [], score: 0, combo: 0, hits: 0, shots: 0, clicks: [], last: "" });
    setHud({ score: 0, combo: 0, time: 30, on: true });
  };

  const press = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = g.current;
    if (!s.on) return;
    const b = ref.current!.getBoundingClientRect();
    const px = (e.clientX - b.left) * devicePixelRatio, py = (e.clientY - b.top) * devicePixelRatio;
    s.clicks.push(e.timeStamp); s.shots++;
    const i = s.rings.findIndex((o) => Math.hypot(o.x - px, o.y - py) <= o.r * 1.15);
    if (i > -1) { s.rings.splice(i, 1); s.hits++; s.combo++; s.score += Math.round(10 * (1 + s.combo * 0.1)); } else s.combo = 0;
  };

  return (
    <div className="border border-line bg-[#050505] p-4">
      <div className="mb-3 flex flex-wrap gap-5 font-mono text-sm text-lab">
        <span>SCORE <b className="text-white">{hud.score}</b></span><span>COMBO <b className="text-white">{hud.combo}</b></span><span>TIME <b className="text-white">{hud.time}</b></span>
      </div>
      <canvas ref={ref} onPointerDown={press} className="h-[380px] w-full cursor-crosshair touch-manipulation border border-line bg-black" aria-label="Game area" />
      <button onClick={start} disabled={hud.on} className="mt-3 bg-brand px-6 py-3 font-medium hover:bg-brand-dark disabled:opacity-50">{hud.on ? "Round in progress" : "Start 30s round"}</button>
    </div>
  );
}
