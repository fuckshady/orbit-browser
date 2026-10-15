import { app, net, protocol, nativeImage } from "electron";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { get, put } from "../storage";
import type {
  SavedWallpaper,
  WallhavenResult,
  WallhavenSearch,
} from "../../src/types";
const api = "https://wallhaven.cc/api/v1";
const cache = new Map<string, { expires: number; value: WallhavenSearch }>();
let nextRequest = 0;
export function validId(value: unknown): string {
  if (typeof value !== "string" || !/^[a-z0-9]{6}$/.test(value))
    throw Error("Identificador de Wallhaven inválido");
  return value;
}
function cdn(value: unknown, host: string): string {
  if (typeof value !== "string") throw Error("Imagen inválida");
  const u = new URL(value);
  if (
    u.protocol !== "https:" ||
    u.hostname !== host ||
    u.port ||
    u.username ||
    u.password
  )
    throw Error("Origen de imagen no permitido");
  return u.href;
}
async function request(url: string) {
  if (nextRequest - Date.now() > 2000)
    throw Error(
      "Wallhaven alcanzó su límite de consultas. Inténtalo en un minuto.",
    );
  if (Date.now() < nextRequest)
    await new Promise((r) => setTimeout(r, nextRequest - Date.now()));
  nextRequest = Date.now() + 1500;
  let r: Response;
  try {
    r = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(20000),
      redirect: "error",
    });
  } catch {
    throw Error(
      "No se pudo conectar con Wallhaven. Comprueba tu conexión y vuelve a intentar.",
    );
  }
  if (r.status === 429) {
    nextRequest = Date.now() + 60000;
    throw Error(
      "Wallhaven alcanzó su límite de consultas. Inténtalo en un minuto.",
    );
  }
  if (!r.ok) throw Error(`Wallhaven no está disponible (HTTP ${r.status}).`);
  if (!r.headers.get("content-type")?.includes("application/json"))
    throw Error("Wallhaven no devolvió una respuesta válida.");
  return r.json();
}
export async function searchWallhaven(p: unknown): Promise<WallhavenSearch> {
  if (!p || typeof p !== "object") throw Error("Búsqueda inválida");
  const v = p as Record<string, unknown>;
  if (typeof v.query !== "string" || v.query.length > 150)
    throw Error("Consulta inválida");
  if (
    !["toplist", "relevance", "date_added", "random"].includes(String(v.sort))
  )
    throw Error("Orden inválido");
  if (
    !["", "1920x1080", "2560x1440", "3840x2160"].includes(String(v.resolution))
  )
    throw Error("Resolución inválida");
  if (!Number.isInteger(v.page) || Number(v.page) < 1 || Number(v.page) > 1000)
    throw Error("Página inválida");
  const params = new URLSearchParams({
    q: v.query.trim(),
    purity: "100",
    categories: "111",
    sorting: String(v.sort),
    order: "desc",
    page: String(v.page),
  });
  if (v.resolution) params.set("atleast", String(v.resolution));
  if (v.sort === "toplist") params.set("topRange", "1M");
  if (typeof v.seed === "string" && /^[a-zA-Z0-9]{6}$/.test(v.seed))
    params.set("seed", v.seed);
  const key = params.toString(),
    cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  const json = await request(`${api}/search?${params}`);
  if (!Array.isArray(json.data) || !json.meta)
    throw Error("Resultados de Wallhaven inválidos");
  const items: WallhavenResult[] = json.data
    .filter((r: any) => r.purity === "sfw")
    .flatMap((r: any) => {
      try {
        return [
          {
            id: validId(r.id),
            thumbnail: cdn(r.thumbs.large, "th.wallhaven.cc"),
            page: `https://wallhaven.cc/w/${validId(r.id)}`,
            width: Number(r.dimension_x),
            height: Number(r.dimension_y),
            resolution: String(r.resolution),
          },
        ];
      } catch {
        return [];
      }
    });
  const value = {
    items,
    page: Number(json.meta.current_page) || 1,
    pages: Number(json.meta.last_page) || 1,
    total: Number(json.meta.total) || 0,
    seed: typeof json.meta.seed === "string" ? json.meta.seed : undefined,
  };
  if (cache.size > 20) cache.delete(cache.keys().next().value!);
  cache.set(key, { expires: Date.now() + 300000, value });
  return value;
}
export function registerWallpaperProtocol() {
  protocol.handle("orbit-wallpaper", (request) => {
    try {
      const u = new URL(request.url);
      if (
        u.hostname !== "wallpaper" ||
        u.search ||
        u.hash ||
        !/^\/wallhaven-[a-z0-9]{6}$/.test(u.pathname)
      )
        return new Response("Not found", { status: 404 });
      const id = u.pathname.slice(1);
      const files = get<Record<string, string>>("wallpaperFiles", {});
      const file = files[id];
      if (!file || !/^wallhaven-[a-z0-9]{6}\.(jpg|png|webp)$/.test(file))
        return new Response("Not found", { status: 404 });
      return net.fetch(
        pathToFileURL(path.join(app.getPath("userData"), "wallpapers", file))
          .href,
      );
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });
}
export async function saveWallhaven(
  value: unknown,
  library: SavedWallpaper[],
): Promise<SavedWallpaper> {
  const id = validId(value),
    key = "wallhaven-" + id;
  const existing = library.find((w) => w.id === key);
  if (existing) return existing;
  const { data } = await request(`${api}/w/${id}`);
  if (!data || data.purity !== "sfw" || data.id !== id)
    throw Error("Este fondo no está disponible en el catálogo público.");
  const url = cdn(data.path, "w.wallhaven.cc");
  const ext = (
    { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<
      string,
      string
    >
  )[data.file_type];
  if (!ext || Number(data.file_size) > 35 * 1024 * 1024)
    throw Error("La imagen no es compatible o supera 35 MB.");
  const response = await fetch(url, {
    signal: AbortSignal.timeout(45000),
    redirect: "error",
  });
  if (!response.ok)
    throw Error(`No se pudo descargar el fondo (HTTP ${response.status}).`);
  if (Number(response.headers.get("content-length")) > 35 * 1024 * 1024)
    throw Error("La imagen supera 35 MB.");
  const reader = response.body?.getReader();
  if (!reader) throw Error("Imagen vacía");
  let total = 0;
  const chunks: Uint8Array[] = [];
  try {
    for (;;) {
      const r = await reader.read();
      if (r.done) break;
      total += r.value.byteLength;
      if (total > 35 * 1024 * 1024) throw Error("La imagen supera 35 MB.");
      chunks.push(r.value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const bytes = Buffer.concat(chunks);
  const image = nativeImage.createFromBuffer(bytes);
  if (image.isEmpty())
    throw Error("El archivo descargado no es una imagen válida.");
  const size = image.getSize();
  const dir = path.join(app.getPath("userData"), "wallpapers");
  await fs.promises.mkdir(dir, { recursive: true });
  const file = key + "." + ext;
  await fs.promises.writeFile(path.join(dir, file), bytes);
  const files = get<Record<string, string>>("wallpaperFiles", {});
  files[key] = file;
  put("wallpaperFiles", files);
  return {
    id: key,
    name: `Wallhaven · ${id}`,
    src: `orbit-wallpaper://wallpaper/${key}`,
    page: `https://wallhaven.cc/w/${id}`,
    resolution: `${size.width}×${size.height}`,
    date: Date.now(),
  };
}
