import { useRef, useState, useEffect } from "react";
import {
  Search,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import { useBrowser } from "../stores/browser";
import type { WallhavenSearch, WallhavenResult } from "../types";
export function WallhavenGallery() {
  const { state: s, run } = useBrowser();
  const [query, setQuery] = useState("space"),
    [sort, setSort] = useState("toplist"),
    [resolution, setResolution] = useState("3840x2160");
  const [result, setResult] = useState<WallhavenSearch | null>(null),
    [busy, setBusy] = useState(false),
    [applying, setApplying] = useState(""),
    [error, setError] = useState(""),
    [preview, setPreview] = useState<WallhavenResult | null>(null),
    [notice, setNotice] = useState("");
  const mounted = useRef(true),
    last = useRef({ query: "space", sort: "toplist", resolution: "3840x2160" });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  if (!s) return null;
  const selected = s.spaces.find((sp) => sp.id === s.space)?.wallpaper;
  async function search(page = 1, newSearch = false) {
    if (busy || applying) return;
    setBusy(true);
    setError("");
    setNotice("");
    const filters = newSearch ? { query, sort, resolution } : last.current;
    if (newSearch) last.current = filters;
    try {
      const data: WallhavenSearch = await window.orbit.call("wallhavenSearch", {
        ...filters,
        page,
        seed: newSearch ? undefined : result?.seed,
      });
      if (mounted.current) {
        setResult(data);
        setPreview(null);
      }
    } catch (e) {
      if (mounted.current)
        setError(
          String(e)
            .replace(/^Error:.*?Error: /, "")
            .replace(/^Error: /, ""),
        );
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function apply(item: WallhavenResult) {
    if (applying || busy) return;
    setApplying(item.id);
    setError("");
    const response = await run("wallhavenApply", item.id);
    if (mounted.current) {
      setApplying("");
      if (response) {
        setNotice("Fondo aplicado y guardado para usarlo sin conexión.");
        setPreview(null);
      } else setError(useBrowser.getState().error);
    }
  }
  return (
    <section className="wallhaven-section" aria-label="Fondos de Wallhaven">
      <div className="wallhaven-heading">
        <div>
          <div className="eyebrow">UN MUNDO DE POSIBILIDADES</div>
          <h2>
            Wallhaven<span>↗</span>
          </h2>
          <p>Encuentra tu próximo horizonte. Se guarda en tu espacio actual.</p>
        </div>
        <button
          className="wallhaven-open"
          onClick={() => run("new", "https://wallhaven.cc")}
        >
          Visitar Wallhaven
          <ArrowUpRight size={15} />
        </button>
      </div>
      <form
        className="wallhaven-search glass"
        onSubmit={(e) => {
          e.preventDefault();
          void search(1, true);
        }}
      >
        <div className="wallhaven-query">
          <Search size={17} />
          <input
            aria-label="Buscar en Wallhaven"
            value={query}
            maxLength={150}
            placeholder="Espacio, naturaleza, arquitectura…"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="Resolución mínima"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        >
          <option value="">Cualquier resolución</option>
          <option value="1920x1080">Full HD+</option>
          <option value="2560x1440">2K+</option>
          <option value="3840x2160">4K+</option>
        </select>
        <select
          aria-label="Ordenar fondos"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="toplist">Populares</option>
          <option value="relevance">Relevancia</option>
          <option value="date_added">Recientes</option>
          <option value="random">Aleatorios</option>
        </select>
        <button className="primary" disabled={busy || !!applying}>
          {busy ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <Search size={16} />
          )}
          Buscar
        </button>
      </form>
      <div className="wallhaven-meta">
        <span>Catálogo público · SFW · Sin clave API</span>
        <span>
          {result
            ? `${result.total.toLocaleString("es")} fondos · Página ${result.page} de ${result.pages}`
            : "Busca para explorar fondos reales de Wallhaven"}
        </span>
      </div>
      {error && (
        <div className="wallhaven-error" role="alert">
          <p>{error}</p>
          <button onClick={() => search(result?.page ?? 1)}>
            Volver a intentar
          </button>
        </div>
      )}
      {notice && (
        <p className="wallhaven-notice" role="status">
          <Check size={15} />
          {notice}
        </p>
      )}
      {busy ? (
        <div className="wallhaven-grid" aria-busy="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div className="wallhaven-skeleton" key={i} />
          ))}
        </div>
      ) : result ? (
        <>
          <div className="wallhaven-grid">
            {result.items.map((item) => (
              <article
                className={
                  "wallhaven-card " +
                  (selected === "wallhaven-" + item.id ? "selected" : "")
                }
                key={item.id}
              >
                <button
                  className="wallhaven-thumbnail"
                  title="Ver opciones del fondo"
                  onClick={() => setPreview(item)}
                >
                  <img
                    src={item.thumbnail}
                    alt={`Fondo Wallhaven ${item.id}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <span className="wallhaven-resolution">
                    {item.resolution}
                  </span>
                  {selected === "wallhaven-" + item.id && (
                    <span className="wallhaven-check">
                      <Check size={15} />
                    </span>
                  )}
                </button>
                <div className="wallhaven-card-footer">
                  <button onClick={() => setPreview(item)}>
                    Ver fondo
                    <ArrowUpRight size={13} />
                  </button>
                  <button
                    className="apply-wallpaper"
                    disabled={!!applying}
                    onClick={() => apply(item)}
                  >
                    {applying === item.id ? (
                      <LoaderCircle size={14} className="spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    Aplicar
                  </button>
                </div>
              </article>
            ))}
          </div>
          {result.items.length === 0 && (
            <div className="empty">
              <ImageIcon />
              <h2>No encontramos fondos con estos filtros</h2>
              <p>Prueba otras palabras o una resolución menor.</p>
            </div>
          )}
          <div className="wallhaven-pagination">
            <button
              disabled={result.page <= 1 || !!applying}
              onClick={() => search(result.page - 1)}
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <small>
              {result.page} / {result.pages}
            </small>
            <button
              disabled={result.page >= result.pages || !!applying}
              onClick={() => search(result.page + 1)}
            >
              Siguiente
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      ) : (
        <div className="wallhaven-intro">
          <ImageIcon size={30} />
          <h3>Elige tu siguiente destino</h3>
          <p>
            Busca por tema y resolución. Aplica cualquier fondo del catálogo
            público.
          </p>
        </div>
      )}
      {s.wallpapers.length > 0 && (
        <div className="saved-wallpapers">
          <h3>TUS FONDOS GUARDADOS</h3>
          <div className="wallhaven-grid">
            {s.wallpapers.map((w) => (
              <article
                className={
                  "wallhaven-card " + (selected === w.id ? "selected" : "")
                }
                key={w.id}
              >
                <button
                  className="wallhaven-thumbnail"
                  title="Seleccionar fondo guardado"
                  onClick={() => run("wallpaperSelect", w.id)}
                >
                  <img src={w.src} alt={w.name} loading="lazy" />
                  <span className="wallhaven-resolution">{w.resolution}</span>
                  {selected === w.id && (
                    <span className="wallhaven-check">
                      <Check size={15} />
                    </span>
                  )}
                </button>
                <div className="wallhaven-card-footer">
                  <small>{w.name}</small>
                  <button
                    title="Ver fuente en Wallhaven"
                    onClick={() => run("new", w.page)}
                  >
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
      {preview && (
        <div className="wallhaven-preview glass">
          <img
            src={preview.thumbnail}
            alt={`Vista previa de Wallhaven ${preview.id}`}
          />
          <div>
            <small>VISTA PREVIA · {preview.resolution}</small>
            <h3>Wallhaven · {preview.id}</h3>
            <p>Se descargará la imagen original a su resolución completa.</p>
            <div className="wallhaven-preview-actions">
              <button
                className="primary"
                disabled={!!applying}
                onClick={() => apply(preview)}
              >
                {applying ? (
                  <LoaderCircle className="spin" size={15} />
                ) : (
                  <Check size={15} />
                )}
                Aplicar fondo
              </button>
              <button onClick={() => run("new", preview.page)}>
                Ver original
                <ArrowUpRight size={14} />
              </button>
              <button onClick={() => setPreview(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
