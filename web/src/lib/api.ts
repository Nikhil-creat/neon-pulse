import { useStore } from "@/store/useStore";

export async function api(path: string, init: RequestInit = {}): Promise<Response> {
  const { base, token } = useStore.getState();
  if (!base) throw new Error("Set the API URL first");
  const headers: Record<string, string> = { ...((init.headers as Record<string, string>) || {}) };
  if (!(init.body instanceof FormData) && !headers["Content-Type"]) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = "Bearer " + token;
  const r = await fetch(base + path, { ...init, headers, credentials: "include" });
  if (!r.ok) {
    let d = "";
    try { d = (await r.json()).detail; } catch {}
    throw new Error(d || "HTTP " + r.status);
  }
  return r;
}

/** HMAC-SHA256 of the exact request body, hex encoded. The key is the hex string returned at login (as UTF-8). */
export async function hmacHex(key: string, body: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
