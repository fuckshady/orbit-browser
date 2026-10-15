import type { RefObject } from "react";
import {
  Orbit,
  Globe,
  RotateCw,
  Copy,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
  Lock,
  Star,
  Sparkles,
  Settings as SettingsIcon,
} from "lucide-react";
import { useBrowser } from "../stores/browser";
export function BrowserChrome({
  setPage,
  address,
  setAddress,
  addressRef,
  setBookmark,
  ai,
  setAi,
}: {
  setPage: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  addressRef: RefObject<HTMLInputElement | null>;
  setBookmark: (v: boolean) => void;
  ai: boolean;
  setAi: (v: boolean | ((old: boolean) => boolean)) => void;
}) {
  const { state: s, run } = useBrowser();
  if (!s) return null;
  const tab = s.tabs.find((t) => t.id === s.active);
  return (
    <header className="browser-chrome">
      <div className="tab-strip">
        <div className="tab-list">
          {s.tabs
            .filter((t) => t.space === s.space)
            .map((t) => (
              <div
                role="tab"
                aria-selected={t.id === s.active}
                tabIndex={0}
                key={t.id}
                className={"tab " + (t.id === s.active ? "selected" : "")}
                onClick={() => {
                  setPage("home");
                  void run("select", t.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void run("select", t.id);
                }}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("tab", t.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("tab");
                  const ids = s.tabs.map((t) => t.id),
                    from = ids.indexOf(id),
                    to = ids.indexOf(t.id);
                  if (from < 0) return;
                  ids.splice(from, 1);
                  ids.splice(to, 0, id);
                  void run("reorder", ids);
                }}
              >
                {t.loading ? (
                  <RotateCw size={13} className="spin" />
                ) : t.favicon ? (
                  <img alt="" src={t.favicon} />
                ) : (
                  <Orbit size={14} />
                )}
                <span>{t.title}</span>
                <button
                  title="Duplicar pestaña"
                  className="duplicate-tab"
                  onClick={(e) => {
                    e.stopPropagation();
                    void run("duplicate", t.id);
                  }}
                >
                  <Copy size={12} />
                </button>
                <button
                  title="Cerrar pestaña"
                  onClick={(e) => {
                    e.stopPropagation();
                    void run("close", t.id);
                  }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
        </div>
        <button
          className="new-tab"
          title="Nueva pestaña · ⌘T"
          onClick={() => {
            setPage("home");
            void run("new");
          }}
        >
          <Plus size={18} />
        </button>
        <span className="chrome-brand">
          ORBIT <span>✦</span>
        </span>
      </div>
      <div className="toolbar">
        <button title="Atrás" disabled={!tab?.back} onClick={() => run("back")}>
          <ChevronLeft size={19} />
        </button>
        <button
          title="Adelante"
          disabled={!tab?.forward}
          onClick={() => run("forward")}
        >
          <ChevronRight size={19} />
        </button>
        <button
          title={tab?.loading ? "Detener" : "Recargar"}
          onClick={() => run(tab?.loading ? "stop" : "reload")}
        >
          {tab?.loading ? <X size={16} /> : <RotateCw size={16} />}
        </button>
        <form
          className="address"
          onSubmit={(e) => {
            e.preventDefault();
            setPage("home");
            void run("navigate", address);
            addressRef.current?.blur();
          }}
        >
          {tab?.url.startsWith("https:") ? (
            <Lock size={13} />
          ) : (
            <Globe size={14} />
          )}
          <input
            ref={addressRef}
            aria-label="Dirección o búsqueda"
            value={address}
            placeholder="Busca o escribe una dirección web"
            onChange={(e) => setAddress(e.target.value)}
            onFocus={(e) => e.target.select()}
          />
          <span className="address-hint">⌘ L</span>
          <button
            type="button"
            title="Guardar marcador"
            disabled={!tab?.url}
            onClick={() => setBookmark(true)}
          >
            <Star
              size={16}
              fill={
                s.bookmarks.some((b) => b.url === tab?.url)
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </form>
        <button
          title="ORBIT AI"
          className={ai ? "accent" : ""}
          onClick={() => setAi((v) => !v)}
        >
          <Sparkles size={19} />
        </button>
        <button title="Personaliza ORBIT" onClick={() => setPage("settings")}>
          <SettingsIcon size={17} />
        </button>
      </div>
      {tab?.loading && <div className="loading-line" />}
    </header>
  );
}
