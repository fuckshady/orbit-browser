import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("orbit", {
  call: (action: string, payload: unknown) =>
    ipcRenderer.invoke("orbit:command", action, payload),
  subscribe: (fn: (s: unknown) => void) => {
    const listener = (_: unknown, s: unknown) => fn(s);
    ipcRenderer.on("orbit:state", listener);
    return () => ipcRenderer.removeListener("orbit:state", listener);
  },
  shortcut: (fn: (s: string) => void) => {
    const listener = (_: unknown, s: string) => fn(s);
    ipcRenderer.on("orbit:shortcut", listener);
    return () => ipcRenderer.removeListener("orbit:shortcut", listener);
  },
});
