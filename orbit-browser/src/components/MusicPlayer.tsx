import { useEffect, useRef, useState } from "react";
import {
  Music2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FolderOpen,
} from "lucide-react";
import { useBrowser } from "../stores/browser";
export function MusicPlayer() {
  const run = useBrowser((s) => s.run),
    audio = useRef<HTMLAudioElement>(null),
    resume = useRef(false);
  const [tracks, setTracks] = useState<{ name: string; url: string }[]>([]),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false);
  useEffect(
    () => () => {
      tracks.forEach((t) => URL.revokeObjectURL(t.url));
    },
    [tracks],
  );
  useEffect(() => {
    if (resume.current) {
      resume.current = false;
      void audio.current?.play().catch(() => setPlaying(false));
    }
  }, [index]);
  async function choose() {
    const files = await run("audio");
    if (!files?.length) return;
    setTracks(
      files.map((f: { name: string; data: string; mime: string }) => ({
        name: f.name,
        url: URL.createObjectURL(
          new Blob([Uint8Array.from(atob(f.data), (c) => c.charCodeAt(0))], {
            type: f.mime,
          }),
        ),
      })),
    );
    setIndex(0);
    setPlaying(false);
  }
  function move(d: number) {
    if (tracks.length === 1) {
      if (audio.current) {
        audio.current.currentTime = 0;
        if (playing) void audio.current.play();
      }
      return;
    }
    resume.current = playing;
    setIndex((i) => (i + d + tracks.length) % tracks.length);
  }
  return (
    <div className="music glass">
      <div className="album">
        <Music2 size={21} />
      </div>
      <div className="track">
        <strong>{tracks[index]?.name ?? "Tu propia banda sonora"}</strong>
        <small>
          {tracks.length ? "Audio local · ORBIT" : "Añade música desde tu Mac"}
        </small>
      </div>
      <button title="Seleccionar archivos" onClick={choose}>
        <FolderOpen size={16} />
      </button>
      {tracks.length > 0 && (
        <>
          <button title="Anterior" onClick={() => move(-1)}>
            <SkipBack size={15} />
          </button>
          <button
            title={playing ? "Pausar" : "Reproducir"}
            onClick={() => {
              if (playing) audio.current?.pause();
              else void audio.current?.play().catch(() => setPlaying(false));
            }}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button title="Siguiente" onClick={() => move(1)}>
            <SkipForward size={15} />
          </button>
        </>
      )}
      <audio
        ref={audio}
        src={tracks[index]?.url}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => move(1)}
      />
    </div>
  );
}
