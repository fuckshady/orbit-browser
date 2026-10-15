import { useEffect, useState } from "react";
const cache = new Map<string, string>();
export function useWallpaperTint(wallpaper: string, enabled: boolean) {
  const [value, setValue] = useState({ wallpaper: "", color: "#6e86b8" });
  useEffect(() => {
    if (!enabled || !window.orbit) return;
    let cancelled = false;
    const cached = cache.get(wallpaper);
    if (cached) {
      setValue({ wallpaper, color: cached });
      return;
    }
    void window.orbit
      .call("wallpaperTint", wallpaper)
      .then((color: unknown) => {
        if (typeof color === "string" && /^#[a-f\d]{6}$/i.test(color)) {
          cache.set(wallpaper, color);
          if (!cancelled) setValue({ wallpaper, color });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [wallpaper, enabled]);
  return (
    cache.get(wallpaper) ??
    (value.wallpaper === wallpaper ? value.color : "#6e86b8")
  );
}
