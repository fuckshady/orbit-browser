import {
  Orbit,
  Home as HomeIcon,
  Search,
  Sparkles,
  Layers,
  Bookmark,
  History,
  Download,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
} from "lucide-react";
import { useBrowser } from "../stores/browser";
const nav = [
  { id: "home", name: "Inicio", icon: HomeIcon },
  { id: "search", name: "Buscar", icon: Search },
  { id: "ai", name: "AI Assistant", icon: Sparkles },
  { id: "spaces", name: "Espacios", icon: Layers },
  { id: "bookmarks", name: "Marcadores", icon: Bookmark },
  { id: "history", name: "Historial", icon: History },
  { id: "downloads", name: "Descargas", icon: Download },
];
export function Sidebar({
  expanded,
  ai,
  page,
  go,
  setPage,
  setExpanded,
}: {
  expanded: boolean;
  ai: boolean;
  page: string;
  go: (id: string) => void;
  setPage: (page: string) => void;
  setExpanded: (value: boolean | ((old: boolean) => boolean)) => void;
}) {
  const { state: s, run } = useBrowser();
  if (!s) return null;
  return (
    <aside className="sidebar glass">
      <div className="traffic-space" />
      <button
        className="logo"
        title="ORBIT · Inicio"
        onClick={() => go("home")}
      >
        <Orbit size={29} />
        {expanded && <b>ORBIT</b>}
      </button>
      <div className="nav-main">
        {nav.map((n) => (
          <button
            key={n.id}
            className={
              "nav-button " +
              (n.id === page || (n.id === "ai" && ai) ? "active" : "")
            }
            title={n.name}
            onClick={() => go(n.id)}
          >
            <n.icon size={20} />
            {expanded && <span>{n.name}</span>}
            {n.id === "downloads" &&
              s.downloads.some((d) => d.state === "progressing") && <i />}
          </button>
        ))}
      </div>
      <div className="space-switches">
        {expanded && <small>ESPACIOS</small>}
        {s.spaces.map((sp) => (
          <button
            title={sp.name}
            key={sp.id}
            onClick={() => {
              setPage("home");
              void run("space", sp.id);
            }}
            className={sp.id === s.space ? "selected" : ""}
          >
            <span>{sp.icon}</span>
            {expanded && <small>{sp.name}</small>}
          </button>
        ))}
      </div>
      {s.settings.verticalTabs && (
        <div className="vertical-tabs">
          {s.tabs
            .filter((t) => t.space === s.space)
            .map((t) => (
              <button
                key={t.id}
                title={t.title}
                onClick={() => run("select", t.id)}
                className={t.id === s.active ? "selected" : ""}
              >
                <Globe size={16} />
                {expanded && <span>{t.title}</span>}
              </button>
            ))}
        </div>
      )}
      <div className="sidebar-bottom">
        <button
          className={"nav-button " + (page === "settings" ? "active" : "")}
          title="Configuración"
          onClick={() => setPage("settings")}
        >
          <SettingsIcon size={20} />
          {expanded && <span>Configuración</span>}
        </button>
        <button
          className="nav-button"
          title={expanded ? "Contraer sidebar" : "Expandir sidebar"}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <PanelLeftClose size={19} />
          ) : (
            <PanelLeftOpen size={19} />
          )}
          {expanded && <span>Contraer</span>}
        </button>
      </div>
    </aside>
  );
}
