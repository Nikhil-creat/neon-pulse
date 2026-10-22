"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLive } from "@/hooks/useLive";
import { useStore } from "@/store/useStore";

type Row = { rank: number; user: string; score: number };
const periods = ["all", "today", "week", "friends"];

export default function Leaderboard() {
  const { bump, user, base, refresh } = useStore();
  const [period, setPeriod] = useState("all");
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    if (!base) { setRows([]); return; }
    try { setRows(await (await api(`/api/v1/leaderboard?period=${period}&limit=10`)).json()); setErr(""); } catch (e: any) { setErr(e.message); }
  }, [period, base]);
  useEffect(() => { load(); }, [load, bump]);
  useLive(() => refresh());

  return (
    <div className="border border-line bg-[#050505] p-4">
      <h3 className="mb-3 font-mono text-xs uppercase tracking-[.22em] text-lab">Leaderboard</h3>
      <div className="mb-3 flex flex-wrap gap-2">
        {periods.map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={"border px-3 py-1 font-mono text-xs " + (p === period ? "border-brand bg-brand" : "border-line bg-[#111] text-[#e6e6e6]")}>{p}</button>
        ))}
      </div>
      <ol className="list-decimal pl-6 font-mono text-sm">
        {rows.map((r) => <li key={r.rank} className={r.user === user ? "text-brand" : ""}>{r.user} — {r.score}</li>)}
      </ol>
      {!rows.length && <p className="font-mono text-xs text-lab">{err || (base ? "No scores yet." : "Set the API URL to load boards.")}</p>}
    </div>
  );
}
