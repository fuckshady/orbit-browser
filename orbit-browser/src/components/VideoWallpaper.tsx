import { useEffect, useRef, useState } from "react";

/** Decode only while the home screen is visible; respect reduced motion. */
export function VideoWallpaper({
  active,
  animations,
  src,
  poster,
}: {
  src: string;
  poster: string;
  active: boolean;
  animations: boolean;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (active && animations && !document.hidden && !reduced.matches) {
        void video.play().catch(() => {});
      } else video.pause();
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => {
      video.pause();
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [active, animations, src]);
  if (failed) return <img className="wallpaper-video" src={poster} alt="" />;
  return (
    <video
      ref={ref}
      className="wallpaper-video"
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
      onError={() => setFailed(true)}
    />
  );
}
