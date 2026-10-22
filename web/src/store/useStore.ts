import { create } from "zustand";

type State = {
  base: string; token: string | null; signKey: string | null; user: string | null; bump: number; msg: string;
  setBase: (b: string) => void;
  setAuth: (token: string | null, signKey: string | null, user: string | null) => void;
  refresh: () => void;
  say: (m: string) => void;
};

const initialBase = (typeof window !== "undefined" && localStorage.getItem("np_api")) || process.env.NEXT_PUBLIC_API_URL || "";

export const useStore = create<State>((set) => ({
  base: initialBase, token: null, signKey: null, user: null, bump: 0, msg: "",
  setBase: (b) => { try { localStorage.setItem("np_api", b); } catch {} set({ base: b.replace(/\/$/, "") }); },
  setAuth: (token, signKey, user) => set({ token, signKey, user }),
  refresh: () => set((s) => ({ bump: s.bump + 1 })),
  say: (m) => set({ msg: m }),
}));
