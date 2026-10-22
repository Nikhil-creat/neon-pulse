"use client";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";

type Msg = { role: "user" | "bot"; text: string };

/** Click-Bot Prime: streams SSE tokens from POST /api/v1/chat (Groq/Gemini with tool calling on the server). */
export default function ChatPanel() {
  const token = useStore((s) => s.token);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "bot", text: "Click-Bot Prime online. Log in, then ask about combos, anti-cheat or your stats." }]);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);

  async function send() {
    const text = q.trim();
    if (!text) return;
    setQ(""); setMsgs((m) => [...m, { role: "user", text }, { role: "bot", text: "…" }]);
    const set = (t: string) => setMsgs((m) => { const c = m.slice(); c[c.length - 1] = { role: "bot", text: t }; return c; });
    if (!token) { set("Log in first so I can reach the AI engine."); return; }
    try {
      const r = await api("/api/v1/chat", { method: "POST", body: JSON.stringify({ message: text }) });
      const rd = r.body!.getReader(); const dc = new TextDecoder(); let buf = "", acc = "";
      for (;;) {
        const { done, value } = await rd.read(); if (done) break;
        buf += dc.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() || "";
        for (const l of lines) if (l.startsWith("data: ") && !l.includes("[DONE]")) { try { acc += JSON.parse(l.slice(6)).token; set(acc); } catch {} }
        box.current?.scrollTo({ top: 1e6 });
      }
    } catch (e: any) { set("Chat error: " + e.message); }
  }

  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed bottom-4 right-4 z-40 bg-brand px-5 py-3 font-medium shadow-[0_0_20px_#c81b1c88]">Click-Bot</button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-3 z-40 flex max-h-[68vh] w-[min(390px,calc(100vw-24px))] flex-col border border-brand bg-black/90 backdrop-blur">
            <div ref={box} className="flex-1 space-y-2 overflow-auto p-3 text-sm">
              {msgs.map((m, i) => <p key={i} className={"whitespace-pre-wrap " + (m.role === "user" ? "font-medium" : "text-[#e6e6e6]")}>{m.text}</p>)}
            </div>
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask Click-Bot…" className="m-3 border border-line bg-[#0a0a0a] p-2.5 font-mono text-sm" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
