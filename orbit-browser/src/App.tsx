import { useEffect, useRef, useState, type CSSProperties } from "react";
import { MotionConfig, AnimatePresence, motion } from "motion/react";
import { Orbit, WifiOff, X, Star } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { BrowserChrome } from "./components/BrowserChrome";
import { useBrowser } from "./stores/browser";
import { Home } from "./pages/Home";
import { Library } from "./pages/Library";
import { Settings } from "./pages/Settings";
import { AIChat } from "./components/AIChat";
import { VideoWallpaper } from "./components/VideoWallpaper";
import { useWallpaperTint } from "./hooks/useWallpaperTint";
import { MusicPlayer } from "./components/MusicPlayer";
export default function App() {
  const { state: s, error, set, run } = useBrowser();
  const [page, setPage] = useState("home"),
    [expanded, setExpanded] = useState(false),
    [ai, setAi] = useState(false),
    [address, setAddress] = useState(""),
    [bookmark, setBookmark] = useState(false),
    [folder, setFolder] = useState("General");
  const addressRef = useRef<HTMLInputElement>(null),
    viewport = useRef<HTMLDivElement>(null),
    shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.orbit) return;
    void run("state");
    const off = window.orbit.subscribe(set),
      keys = window.orbit.shortcut(() => {
        addressRef.current?.focus();
        addressRef.current?.select();
      });
    return () => {
      off();
      keys();
    };
  }, []);
  const tab = s?.tabs.find((t) => t.id === s.active),
    space = s?.spaces.find((x) => x.id === s.space);
  const wallpaperColor = useWallpaperTint(
    space?.wallpaper ?? "earth",
    s?.settings.appearanceMode === "adaptive",
  );
  useEffect(() => {
    setAddress(tab?.url ?? "");
    setBookmark(false);
  }, [tab?.url, tab?.id]);
  useEffect(() => {
    setPage("home");
  }, [s?.active]);
  const remote = !!tab?.url && page === "home" && !tab.error && !bookmark;
  useEffect(() => {
    const el = viewport.current;
    if (!el || !s) return;
    function sync() {
      const r = el!.getBoundingClientRect();
      // Fit cinematic video within the usable page area, outside browser chrome.
      const host = shell.current;
      if (host) {
        host.style.setProperty("--view-x", `${r.x}px`);
        host.style.setProperty("--view-y", `${r.y}px`);
        host.style.setProperty("--view-width", `${r.width}px`);
        host.style.setProperty("--view-height", `${r.height}px`);
      }
      void run("layout", {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        visible: remote,
      });
    }
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    sync();
    return () => observer.disconnect();
  }, [remote, expanded, ai, !!s, s?.settings.verticalTabs]);
  if (!window.orbit)
    return (
      <div className="boot">
        <Orbit />
        <h1>ORBIT es una aplicación de escritorio.</h1>
        <p>Ejecuta npm run dev para iniciar Electron y navegar.</p>
      </div>
    );
  if (!s)
    return (
      <div className="boot">
        <Orbit className="spin" />
        <p>Preparando tu universo…</p>
      </div>
    );
  function go(id: string) {
    if (id === "search") {
      addressRef.current?.focus();
      addressRef.current?.select();
    } else if (id === "ai") setAi((v) => !v);
    else if (id === "home") {
      setPage("home");
      void run("home");
    } else setPage(id);
  }
  const wallpaper = space?.wallpaper ?? "earth";
  const custom = s.wallpapers.find((w) => w.id === wallpaper);
  const video = ["flow", "satellite"].includes(wallpaper);
  const image = ["earth", "orbit", "nature", "waterfall"].includes(wallpaper);
  const adaptive = s.settings.appearanceMode === "adaptive";
  const glassColor =
    s.settings.glassColorSource === "manual"
      ? s.settings.glassColor
      : wallpaperColor;
  const rgb = [1, 3, 5].map((i) => parseInt(glassColor.slice(i, i + 2), 16));
  const ambient =
    custom?.src ??
    (video
      ? `wallpapers/${wallpaper}-4k.jpg`
      : image
        ? `wallpapers/${wallpaper}.jpg`
        : undefined);
  return (
    <MotionConfig reducedMotion={s.settings.animations ? "user" : "always"}>
      <div
        ref={shell}
        className={
          "app wall-" +
          wallpaper +
          (video ? " video-wallpaper " : custom ? " saved-wallpaper " : " ") +
          (adaptive ? " adaptive-glass " : "") +
          (expanded ? "expanded " : "") +
          (!s.settings.animations ? "no-motion " : "") +
          (s.settings.verticalTabs ? "vertical " : "")
        }
        style={
          {
            "--accent": adaptive
              ? glassColor
              : (space?.accent ?? s.settings.accent),
            "--tint-rgb": rgb.join(", "),
            "--tint-color": glassColor,
            "--surface-alpha": 1 - s.settings.glassTransparency / 100,
            "--tint-strength": s.settings.glassIntensity / 100,
            "--tint-percent": `${s.settings.glassIntensity}%`,
            "--surface-blur": `${s.settings.glassBlur}px`,
            "--glass-alpha": s.settings.opacity / 100,
          } as CSSProperties
        }
        onPointerMove={(e) => {
          if (
            s.settings.animations &&
            !window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ) {
            shell.current?.style.setProperty(
              "--px",
              `${(e.clientX / innerWidth - 0.5) * 10}px`,
            );
            shell.current?.style.setProperty(
              "--py",
              `${(e.clientY / innerHeight - 0.5) * 8}px`,
            );
          }
        }}
      >
        {adaptive && (
          <div
            className="ambient-glass"
            aria-hidden="true"
            style={
              ambient ? { backgroundImage: `url("${ambient}")` } : undefined
            }
          />
        )}
        <div className="wallpaper-shell">
          <AnimatePresence mode="sync">
            <motion.div
              key={wallpaper}
              className={"wallpaper theme-" + wallpaper}
              style={
                custom
                  ? { backgroundImage: `url("${custom.src}")` }
                  : image
                    ? { backgroundImage: `url(wallpapers/${wallpaper}.jpg)` }
                    : undefined
              }
              initial={{
                opacity: 0,
                scale: video || custom ? 1 : 1.035,
                filter: "blur(8px)",
              }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {video && (
                <VideoWallpaper
                  src={`wallpapers/${wallpaper}-4k.mp4`}
                  poster={`wallpapers/${wallpaper}-4k.jpg`}
                  active={page === "home" && !tab?.url}
                  animations={s.settings.animations}
                />
              )}
            </motion.div>
          </AnimatePresence>
          <div className="wallpaper-tint" />
          <div className="atmosphere" />
        </div>
        <Sidebar
          expanded={expanded}
          ai={ai}
          page={page}
          go={go}
          setPage={setPage}
          setExpanded={setExpanded}
        />
        <div className="main-shell">
          <BrowserChrome
            setPage={setPage}
            address={address}
            setAddress={setAddress}
            addressRef={addressRef}
            setBookmark={setBookmark}
            ai={ai}
            setAi={setAi}
          />
          <div className="body-row">
            <main
              ref={viewport}
              className={"viewport " + (page !== "home" ? "internal" : "")}
            >
              {page === "home" ? (
                tab?.url ? (
                  <>
                    {tab.error && (
                      <div className="error-page">
                        <WifiOff size={38} />
                        <h1>No pudimos llegar a este destino.</h1>
                        <p>{tab.error}</p>
                        <button
                          className="primary"
                          onClick={() => run("reload")}
                        >
                          Volver a intentar
                        </button>
                        <button onClick={() => run("home")}>
                          Ir al inicio
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <Home ai={() => setAi(true)} />
                )
              ) : page === "settings" ? (
                <Settings />
              ) : (
                <Library key={page} page={page} />
              )}
            </main>
            <AnimatePresence>
              {ai && (
                <motion.div
                  className="ai-wrapper"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 360, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <AIChat close={() => setAi(false)} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="status-bar">
            <span>
              <i />
              {tab?.loading
                ? "Conectando…"
                : tab?.url
                  ? "Navegando en tu órbita"
                  : "Listo para explorar"}
            </span>
            <span>
              {space?.name} <span className="status-dot">·</span> ORBIT 0.1
            </span>
          </div>
        </div>
        <div
          className="persistent-music"
          style={{ display: page === "home" && !tab?.url ? undefined : "none" }}
        >
          <MusicPlayer />
        </div>
        {bookmark && (
          <div className="modal-shade">
            <form
              className="modal glass"
              onSubmit={(e) => {
                e.preventDefault();
                void run("bookmark", folder);
                setBookmark(false);
              }}
            >
              <button
                type="button"
                className="modal-close"
                onClick={() => setBookmark(false)}
              >
                <X />
              </button>
              <Star />
              <h2>Guarda este destino</h2>
              <p>{tab?.title}</p>
              <label>
                Carpeta
                <input
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  maxLength={80}
                />
              </label>
              <button className="primary">Guardar marcador</button>
            </form>
          </div>
        )}
        {error && (
          <div className="toast" role="alert">
            {error}
            <button
              title="Cerrar aviso"
              onClick={() => useBrowser.setState({ error: "" })}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
