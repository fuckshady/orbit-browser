import { app, session, type DownloadItem } from "electron";
import path from "node:path";
import { randomUUID as uuid } from "node:crypto";
import { put } from "../storage";
import type { State, Download } from "../../src/types";
export function wireDownloads(
  s: State,
  emit: () => void,
  downloads: Map<string, DownloadItem>,
  smoke: boolean,
) {
  const ses = session.fromPartition("persist:orbit-web");
  ses.setPermissionCheckHandler(() => false);
  ses.setPermissionRequestHandler((_w, _p, cb) => cb(false));
  ses.on("will-download", (_, item) => {
    const id = uuid();
    if (smoke)
      item.setSavePath(path.join(app.getPath("userData"), item.getFilename()));
    downloads.set(id, item);
    const d: Download = {
      id,
      name: item.getFilename(),
      path: "",
      received: 0,
      total: item.getTotalBytes(),
      state: "progressing",
      paused: false,
      speed: 0,
    };
    s.downloads.unshift(d);
    let last = 0,
      time = Date.now();
    item.on("updated", (_, status) => {
      const now = Date.now();
      d.received = item.getReceivedBytes();
      d.speed = (d.received - last) / Math.max(0.001, (now - time) / 1000);
      last = d.received;
      time = now;
      Object.assign(d, {
        total: item.getTotalBytes(),
        state: status,
        paused: item.isPaused(),
        path: item.getSavePath(),
      });
      emit();
    });
    item.once("done", (_, status) => {
      d.state = status;
      d.path = item.getSavePath();
      downloads.delete(id);
      put("downloads", s.downloads);
      emit();
    });
    emit();
  });
}
