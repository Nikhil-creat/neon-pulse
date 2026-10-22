"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useStore } from "@/store/useStore";

export default function AuthPanel() {
  const { base, setBase, setAuth, user, say, refresh } = useStore();
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");

  async function go(kind: "login" | "register") {
    setErr("");
    try {
      const body = JSON.stringify({ name: u.trim(), password: p });
      if (kind === "register") await api("/api/v1/auth/register", { method: "POST", body });
      const j = await (await api("/api/v1/auth/login", { method: "POST", body })).json();
      setAuth(j.access_token, j.sign_key, j.user); say("Signed in as " + j.user); refresh();
    } catch (e: any) { setErr(e.message + (/fetch/i.test(e.message) ? " (is the API reachable and CORS_ORIGINS set?)" : "")); }
  }

  if (user) return (
    <div className="border border-line p-4 font-mono text-sm">Signed in as <b>{user}</b>
      <button className="ml-4 underline" onClick={() => { setAuth(null, null, null); refresh(); }}>Log out</button></div>
  );
  const input = "mb-2 w-full border border-line bg-[#0a0a0a] p-2.5 font-mono text-sm";
  return (
    <div className="border border-line bg-[#050505] p-4">
      <h3 className="mb-3 font-mono text-xs uppercase tracking-[.22em] text-lab">Account · live API</h3>
      <input className={input} placeholder="API URL, e.g. https://api.yourdomain.com" value={base} onChange={(e) => setBase(e.target.value)} />
      <input className={input} placeholder="username" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
      <input className={input} type="password" placeholder="password (8+ chars)" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" />
      <div className="flex gap-2">
        <button onClick={() => go("login")} className="flex-1 bg-brand py-2.5 font-medium hover:bg-brand-dark">Log in</button>
        <button onClick={() => go("register")} className="flex-1 border border-line bg-[#161616] py-2.5">Register</button>
      </div>
      {err && <p className="mt-2 font-mono text-xs text-lab">Error: {err}</p>}
    </div>
  );
}
