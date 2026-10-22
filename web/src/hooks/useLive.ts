import { useEffect } from "react";
import { useStore } from "@/store/useStore";

/** Subscribes to /ws/live and calls onEvent for every score pushed by the API. */
export function useLive(onEvent: (e: { user: string; score: number; persona?: string; mode?: string }) => void) {
  const base = useStore((s) => s.base);
  useEffect(() => {
    if (!base) return;
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(base.replace(/^http/, "ws") + "/ws/live");
      ws.onmessage = (m) => { try { onEvent(JSON.parse(m.data)); } catch {} };
    } catch {}
    return () => { ws && ws.close(); };
  }, [base]);
}
