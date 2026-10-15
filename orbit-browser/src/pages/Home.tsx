import { useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Sparkles,
  Plus,
  ArrowUpRight,
  X,
  Globe,
  Github,
  Youtube,
} from "lucide-react";
import { useBrowser } from "../stores/browser";
export function Home({ ai }: { ai: () => void }) {
  const { state: s, run } = useBrowser();
  const [query, setQuery] = useState(""),
    [focus, setFocus] = useState(false),
    [adding, setAdding] = useState(false),
    [name, setName] = useState(""),
    [url, setUrl] = useState("");
  if (!s) return null;
  const links = s.settings.links;
  function save() {
    if (name.trim() && url.trim()) {
      void run("settings", {
        links: [
          ...links,
          { id: crypto.randomUUID(), name: name.trim(), url: url.trim() },
        ],
      });
      setAdding(false);
      setName("");
      setUrl("");
    }
  }
  return (
    <div className="home">
      <div className="home-top">
        <span>
          <i /> TU UNIVERSO, A UN CLIC
        </span>
        <span>
          {s.spaces.find((x) => x.id === s.space)?.name}{" "}
          <span className="dot-separator">/</span> NUEVA ÓRBITA
        </span>
      </div>
      <motion.div
        className="hero"
        initial={
          s.settings.animations
            ? { opacity: 0, y: 20, filter: "blur(8px)" }
            : false
        }
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8 }}
      >
        <div className="eyebrow">UN NUEVO HORIZONTE</div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
        >
          EXPLORA
          <br />
          <span>SIN LÍMITES</span>
        </motion.h1>
        <p>Un navegador para un mundo más grande.</p>
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="hero-search glass"
          onSubmit={(e) => {
            e.preventDefault();
            setFocus(false);
            void run("navigate", query);
          }}
        >
          <Search size={21} />
          <input
            aria-label="Buscar en la web"
            placeholder="Busca en la web…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setTimeout(() => setFocus(false), 150)}
          />
          <kbd>↵</kbd>
          <span className="input-divider" />
          <button type="button" title="ORBIT AI" onClick={ai}>
            <Sparkles size={20} />
          </button>
          {focus && query && (
            <div className="search-suggestions glass">
              <button type="submit">
                <Search size={16} />
                Buscar «{query}» en {s.settings.engine}
                <ArrowUpRight size={15} />
              </button>
              {[...s.bookmarks, ...s.history]
                .filter(
                  (x) =>
                    x.title.toLowerCase().includes(query.toLowerCase()) ||
                    x.url.includes(query),
                )
                .slice(0, 4)
                .map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    onMouseDown={() => {
                      void run("navigate", x.url);
                      setFocus(false);
                    }}
                  >
                    <Globe size={16} />
                    <span>{x.title}</span>
                  </button>
                ))}
            </div>
          )}
        </motion.form>
        <motion.div
          className="quick-links"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          {links.map((l, i) => (
            <div
              className="quick-wrap"
              key={l.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("link", String(i))}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const from = Number(e.dataTransfer.getData("link"));
                if (!Number.isInteger(from)) return;
                const next = [...links];
                const [item] = next.splice(from, 1);
                next.splice(i, 0, item);
                void run("settings", { links: next });
              }}
            >
              <button
                className="quick-card glass"
                title={l.url}
                onClick={() => run("new", l.url)}
              >
                {l.name === "YouTube" ? (
                  <Youtube className="youtube" />
                ) : l.name === "GitHub" ? (
                  <Github />
                ) : (
                  <span className={"brand brand-" + l.name.toLowerCase()}>
                    {l.name === "Figma" ? "◉" : l.name.charAt(0)}
                  </span>
                )}
              </button>
              <small>{l.name}</small>
              <button
                className="remove-link"
                title="Eliminar acceso"
                onClick={() =>
                  run("settings", { links: links.filter((x) => x.id !== l.id) })
                }
              >
                <X size={10} />
              </button>
            </div>
          ))}
          <div className="quick-wrap">
            <button
              className="quick-card add glass"
              title="Añadir acceso"
              onClick={() => setAdding(true)}
            >
              <Plus />
            </button>
            <small>Agregar</small>
          </div>
        </motion.div>
        <div className="home-caption">
          <span /> MENOS RUIDO. MÁS UNIVERSO. <span />
        </div>
      </motion.div>
      <footer className="home-footer">
        <div className="music-slot" />
        <div className="coordinates">
          <Globe size={16} />
          <span>
            TIERRA, SISTEMA SOLAR
            <small>Tu próximo destino está por descubrir.</small>
          </span>
        </div>
      </footer>
      {adding && (
        <div className="modal-shade">
          <form
            className="modal glass"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setAdding(false)}
            >
              <X />
            </button>
            <h2>Un nuevo destino</h2>
            <label>
              Nombre
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
              />
            </label>
            <label>
              URL
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
                required
              />
            </label>
            <button className="primary">Añadir acceso</button>
          </form>
        </div>
      )}
    </div>
  );
}
