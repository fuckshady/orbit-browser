import { useState } from "react";
import {
  Search,
  ArrowUpRight,
  Trash2,
  Plus,
  Folder,
  Pause,
  Play,
  X,
  Download as DownloadIcon,
} from "lucide-react";
import { useBrowser } from "../stores/browser";
export function Library({ page }: { page: string }) {
  const { state: s, run } = useBrowser();
  const [filter, setFilter] = useState(""),
    [folder, setFolder] = useState(""),
    [name, setName] = useState("");
  if (!s) return null;
  const titles: Record<string, string> = {
    spaces: "Tus espacios",
    history: "Tu recorrido",
    bookmarks: "Lugares que importan",
    downloads: "Tus descargas",
  };
  const records =
    page === "history"
      ? s.history
      : s.bookmarks.filter((x) => x.space === s.space);
  return (
    <section className="library">
      <div className="eyebrow">TU UNIVERSO ORGANIZADO</div>
      <h1>{titles[page]}</h1>
      <p>
        {page === "spaces"
          ? "Un contexto para cada parte de tu mundo."
          : "Todo en su lugar. Siempre a tu alcance."}
      </p>
      {page === "spaces" ? (
        <>
          <div className="space-grid">
            {s.spaces.map((sp) => (
              <button
                key={sp.id}
                className={
                  "space-card glass " + (sp.id === s.space ? "selected" : "")
                }
                onClick={() => run("space", sp.id)}
                style={{
                  backgroundImage:
                    sp.wallpaper === "earth" || sp.wallpaper === "orbit"
                      ? `linear-gradient(0deg,#050816dd,transparent),url(wallpapers/${sp.wallpaper}.jpg)`
                      : undefined,
                }}
              >
                <span>{sp.icon}</span>
                <h2>{sp.name}</h2>
                <small>
                  {s.tabs.filter((t) => t.space === sp.id).length} pestañas ·{" "}
                  {s.bookmarks.filter((b) => b.space === sp.id).length}{" "}
                  marcadores
                </small>
              </button>
            ))}
          </div>
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                void run("addSpace", name);
                setName("");
              }
            }}
          >
            <input
              placeholder="Nombre del nuevo espacio"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
            />
            <button className="primary">
              <Plus size={16} />
              Crear espacio
            </button>
          </form>
        </>
      ) : page === "downloads" ? (
        <div className="record-list">
          {s.downloads.length === 0 && (
            <div className="empty">
              <DownloadIcon />
              <h2>Sin descargas todavía</h2>
              <p>Los archivos que descargues en la web aparecerán aquí.</p>
            </div>
          )}
          {s.downloads.map((d) => (
            <div className="record glass" key={d.id}>
              <DownloadIcon />
              <div>
                <strong>{d.name}</strong>
                <small>
                  {d.state} · {(d.received / 1048576).toFixed(1)} /{" "}
                  {(d.total / 1048576).toFixed(1)} MB ·{" "}
                  {(d.speed / 1024).toFixed(0)} KB/s
                </small>
                <progress value={d.received} max={d.total || 1} />
                <small>{d.path}</small>
              </div>
              {d.state === "progressing" && (
                <>
                  <button
                    title={d.paused ? "Reanudar" : "Pausar"}
                    onClick={() =>
                      run("download", {
                        id: d.id,
                        action: d.paused ? "resume" : "pause",
                      })
                    }
                  >
                    {d.paused ? <Play size={17} /> : <Pause size={17} />}
                  </button>
                  <button
                    title="Cancelar"
                    onClick={() =>
                      run("download", { id: d.id, action: "cancel" })
                    }
                  >
                    <X size={17} />
                  </button>
                </>
              )}
              {d.path && (
                <button
                  title="Mostrar en Finder"
                  onClick={() => run("download", { id: d.id, action: "show" })}
                >
                  <Folder size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="filter-row">
            <div className="filter-input glass">
              <Search size={17} />
              <input
                placeholder="Buscar por nombre o dirección…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
            {page === "history" ? (
              <button onClick={() => run("clearHistory")}>
                <Trash2 size={16} />
                Borrar historial
              </button>
            ) : (
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
              >
                <option value="">Todas las carpetas</option>
                {[...new Set(records.map((r) => r.folder))].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            )}
          </div>
          <div className="record-list">
            {records
              .filter(
                (r) =>
                  (!folder || r.folder === folder) &&
                  `${r.title} ${r.url}`
                    .toLowerCase()
                    .includes(filter.toLowerCase()),
              )
              .map((r) => (
                <div className="record glass" key={r.id}>
                  <div className="record-icon">
                    {r.favicon ? (
                      <img src={r.favicon} alt="" />
                    ) : (
                      <Folder size={18} />
                    )}
                  </div>
                  <button
                    className="record-text"
                    onClick={() => run("new", r.url)}
                  >
                    <strong>{r.title}</strong>
                    <small>{r.url}</small>
                  </button>
                  <small>
                    {page === "history"
                      ? new Date(r.date).toLocaleString("es")
                      : r.folder}
                  </small>
                  <button title="Abrir" onClick={() => run("new", r.url)}>
                    <ArrowUpRight size={17} />
                  </button>
                  {page === "bookmarks" && (
                    <button
                      title="Eliminar"
                      onClick={() => run("deleteBookmark", r.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            {!records.length && (
              <div className="empty">
                <Folder />
                <h2>Aún no hay nada aquí</h2>
                <p>
                  {page === "history"
                    ? "Visita una página para empezar tu recorrido."
                    : "Guarda una página con la estrella de la barra de direcciones."}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
