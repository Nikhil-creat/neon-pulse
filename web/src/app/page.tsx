"use client";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GameCanvas, { Result } from "@/components/GameCanvas";
import AuthPanel from "@/components/AuthPanel";
import Leaderboard from "@/components/Leaderboard";
import ChatPanel from "@/components/ChatPanel";
import { api, hmacHex } from "@/lib/api";
import { useStore } from "@/store/useStore";

const features = [
  ["Agentic AI", "Director, anti-cheat, commentator and profiler agents orchestrated with LangGraph."],
  ["Hybrid RAG", "BM25 + BGE vectors with RRF, HyDE expansion and cross-encoder re-ranking."],
  ["Computer vision", "PyTorch gesture CNN and OpenCV presence check."],
  ["Signed scores", "HMAC-SHA256 payloads, server-side maximum checks and trust scores."],
  ["Live boards", "Redis sorted sets with WebSocket push; optional Redis Cluster."],
  ["Production ops", "Prometheus, JSON logs, rate limits, health checks, Docker, CI."],
];

export default function Home() {
  const { token, signKey, say, msg, refresh } = useStore();

  async function finish(r: Result) {
    if (!token || !signKey) { say(`Round over: ${r.score} points. Log in to rank it.`); return; }
    const body = JSON.stringify({ ...r, mode: "classic" });
    try {
      const j = await (await api("/api/v1/scores", { method: "POST", body, headers: { "X-Signature": await hmacHex(signKey, body) } })).json();
      say(`Accepted ${r.score} pts · trust ${Math.round(j.trust)} · ${j.persona}`); refresh();
    } catch (e: any) { say("Server rejected score: " + e.message); }
  }

  return (
    <main id="top">
      <Header />
      <section className="flex min-h-svh flex-col justify-center bg-[radial-gradient(800px_500px_at_85%_20%,#c81b1c33,transparent)] px-5 pt-28 md:px-[73px]">
        <p className="mb-3 font-mono text-xs uppercase tracking-[.22em] text-lab">Project Neon-Pulse · Next.js client</p>
        <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 0.85, 0.24, 1] }}
          className="text-[clamp(38px,7.6vw,96px)] font-bold leading-[1.05] tracking-[-.035em]">Intelligence built into<br />every single click.</motion.h1>
        <p className="mt-5 max-w-xl font-mono text-[15px] text-[#e6e6e6]">Agentic AI, hybrid RAG and computer vision, engineered to stay fair and uncheatable under pressure.</p>
        <a href="#play" className="mt-8 w-fit bg-brand px-8 py-3.5 text-lg font-medium hover:bg-brand-dark">Start playing</a>
      </section>

      <section id="play" className="border-t border-line px-5 py-20 md:px-[73px]">
        <h2 className="mb-2 text-[clamp(28px,4.6vw,56px)] font-bold tracking-tight">Beat the Director.</h2>
        <p className="mb-8 h-5 font-mono text-xs text-lab">{msg}</p>
        <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
          <GameCanvas onFinish={finish} />
          <div className="grid content-start gap-5"><AuthPanel /><Leaderboard /></div>
        </div>
      </section>

      <section id="features" className="border-t border-line px-5 py-20 md:px-[73px]">
        <h2 className="mb-8 text-[clamp(28px,4.6vw,56px)] font-bold tracking-tight">Everything a ranked arena needs.</h2>
        <div className="grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([t, d]) => (
            <motion.div key={t} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="border-b border-r border-line p-6">
              <h3 className="mb-2 text-xl font-bold">{t}</h3><p className="text-sm text-[#e6e6e6]">{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="agents" className="border-t border-line px-5 py-20 md:px-[73px]">
        <h2 className="mb-4 text-[clamp(28px,4.6vw,56px)] font-bold tracking-tight">Four agents. One fair game.</h2>
        <p className="max-w-2xl font-mono text-sm text-[#e6e6e6]">Anti-cheat feeds the director; the profiler and commentator react to the verdict. See the repository for the LangGraph pipeline.</p>
      </section>

      <section id="about" className="border-t border-line px-5 py-20 md:px-[73px]">
        <h2 className="mb-4 text-[clamp(28px,4.6vw,56px)] font-bold tracking-tight">Built by Nikhil Chary Sriramoju.</h2>
        <p className="max-w-2xl text-[#e6e6e6]">B.Tech CSE, Vaagdevi College of Engineering (2023–2027). ML Engineer Intern at Yuva Intern (NSDC) and Data Analytics Intern at Thiranex. Certified by NASSCOM / Skill India Digital Hub, IBM SkillsBuild and Reliance Foundation.</p>
      </section>
      <Footer />
      <ChatPanel />
    </main>
  );
}
