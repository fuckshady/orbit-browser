import { useBrowser } from "../stores/browser";
import { AppearanceSettings } from "../components/AppearanceSettings";
import { WallhavenGallery } from "../components/WallhavenGallery";
import { Check, Sparkles } from "lucide-react";
export function Settings() {
  const { state: s, run } = useBrowser();
  if (!s) return null;
  const cfg = s.settings,
    sp = s.spaces.find((x) => x.id === s.space);
  return (
    <section className="library settings">
      <div className="eyebrow">HECHO A TU MEDIDA</div>
      <h1>
        Personaliza ORBIT<span>✦</span>
      </h1>
      <p>Tu navegador. Tu atmósfera.</p>
      <AppearanceSettings />
      <h3>ELIGE TU UNIVERSO</h3>
      <div className="theme-grid">
        {[
          "SATELLITE",
          "FLOW",
          "EARTH",
          "ORBIT",
          "AURORA",
          "MIDNIGHT",
          "CARBON",
          "NATURE",
          "WATERFALL",
        ].map((t) => (
          <button
            key={t}
            onClick={() => run("settings", { theme: t })}
            className={
              "theme-card " +
              (sp?.wallpaper === t.toLowerCase() ? "selected" : "")
            }
          >
            <div
              className={"theme-preview theme-" + t.toLowerCase()}
              style={
                [
                  "SATELLITE",
                  "FLOW",
                  "EARTH",
                  "ORBIT",
                  "NATURE",
                  "WATERFALL",
                ].includes(t)
                  ? {
                      backgroundImage: `url(wallpapers/${t.toLowerCase()}.jpg)`,
                    }
                  : undefined
              }
            >
              {sp?.wallpaper === t.toLowerCase() && <Check size={18} />}
            </div>
            <strong>{t}</strong>
            <small>
              {
                (
                  {
                    SATELLITE: "Orbitando la Tierra · Video 4K",
                    FLOW: "Cascada en movimiento · Video",
                    EARTH: "Un mundo por descubrir",
                    ORBIT: "Una nueva perspectiva",
                    AURORA: "Luz en movimiento",
                    MIDNIGHT: "Silencio profundo",
                    CARBON: "Lo esencial",
                    NATURE: "Respira y explora",
                    WATERFALL: "Fluye a tu ritmo",
                  } as Record<string, string>
                )[t]
              }
            </small>
          </button>
        ))}
      </div>
      <WallhavenGallery />
      <div className="setting-grid">
        <div className="setting-card glass">
          <h3>APARIENCIA</h3>
          <label>
            Color de acento
            <input
              type="color"
              value={sp?.accent ?? cfg.accent}
              onChange={(e) => run("settings", { accent: e.target.value })}
            />
          </label>
          <label>
            Opacidad de tarjetas clásicas
            <input
              type="range"
              min="30"
              max="95"
              value={cfg.opacity}
              onChange={(e) =>
                run("settings", { opacity: Number(e.target.value) })
              }
            />
          </label>
          <label>
            Animaciones
            <input
              type="checkbox"
              checked={cfg.animations}
              onChange={(e) =>
                run("settings", { animations: e.target.checked })
              }
            />
          </label>
          <label>
            Pestañas verticales
            <input
              type="checkbox"
              checked={cfg.verticalTabs}
              onChange={(e) =>
                run("settings", { verticalTabs: e.target.checked })
              }
            />
          </label>
        </div>
        <div className="setting-card glass">
          <h3>NAVEGACIÓN</h3>
          <label>
            Motor de búsqueda
            <select
              value={cfg.engine}
              onChange={(e) => run("settings", { engine: e.target.value })}
            >
              {["Google", "DuckDuckGo", "Bing"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <p>
            Los ajustes se guardan automáticamente. El fondo y el acento se
            conservan por espacio.
          </p>
          <div className="privacy-note">
            <Sparkles size={16} />
            Una experiencia con menos distracciones.
          </div>
        </div>
      </div>
      <small>ORBIT 0.1.0 · Chromium / Electron · Hecho para explorar.</small>
    </section>
  );
}
