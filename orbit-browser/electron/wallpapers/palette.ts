import { app, nativeImage } from "electron";
import path from "node:path";
import { get } from "../storage";
import { dominantColor } from "../browser/palette";
const cache = new Map<string, string>();
const builtins: Record<string, string> = {
  earth: "earth.jpg",
  orbit: "orbit.jpg",
  nature: "nature.jpg",
  waterfall: "waterfall.jpg",
  flow: "flow-4k.jpg",
  satellite: "satellite-4k.jpg",
};
export function wallpaperTint(value: unknown): string {
  if (typeof value !== "string" || value.length > 80)
    throw Error("Fondo inválido");
  if (cache.has(value)) return cache.get(value)!;
  const flat: Record<string, string> = {
    aurora: "#7857b8",
    midnight: "#657da9",
    carbon: "#7b8190",
  };
  if (flat[value]) return flat[value];
  let file: string;
  if (builtins[value])
    file = path.join(
      app.getAppPath(),
      app.isPackaged ? "dist" : "public",
      "wallpapers",
      builtins[value],
    );
  else {
    const files = get<Record<string, string>>("wallpaperFiles", {});
    const name = files[value];
    if (
      !/^wallhaven-[a-z0-9]{6}$/.test(value) ||
      !name ||
      !/^wallhaven-[a-z0-9]{6}\.(jpg|png|webp)$/.test(name)
    )
      throw Error("Fondo no encontrado");
    file = path.join(app.getPath("userData"), "wallpapers", name);
  }
  const image = nativeImage.createFromPath(file);
  if (image.isEmpty()) return "#6e86b8";
  const color = dominantColor(
    image.resize({ width: 64, height: 64, quality: "good" }).toBitmap(),
  );
  if (cache.size >= 40) cache.delete(cache.keys().next().value!);
  cache.set(value, color);
  return color;
}
