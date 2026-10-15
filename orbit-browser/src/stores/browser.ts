import { create } from "zustand";
import type { State } from "../types";
export const useBrowser = create<{
  state: State | null;
  error: string;
  set: (state: State) => void;
  run: (a: string, p?: unknown) => Promise<any>;
}>((set) => ({
  state: null,
  error: "",
  set: (state) => set({ state }),
  run: async (a, p) => {
    try {
      const result = await window.orbit.call(a, p);
      if (result?.tabs) set({ state: result });
      return result;
    } catch (e) {
      set({ error: String(e).replace(/^Error: /, "") });
      return undefined;
    }
  },
}));
