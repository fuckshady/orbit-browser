import { Check, Droplets, RotateCcw, Sparkles } from "lucide-react";
import { useBrowser } from "../stores/browser";
import { useWallpaperTint } from "../hooks/useWallpaperTint";
import type { CSSProperties } from "react";
export function AppearanceSettings() {
  const { state: s, run } = useBrowser();
  const sp = s?.spaces.find((x) => x.id === s.space);
  const detected = useWallpaperTint(sp?.wallpaper ?? "earth", true);
  if (!s) return null;
  const cfg = s.settings,
    active = cfg.appearanceMode === "adaptive",
    color = cfg.glassColorSource === "manual" ? cfg.glassColor : detected;
  const change = (payload: Record<string, unknown>) => run("settings", payload);
  return (
    <section
      className="appearance-section glass"
      aria-label="Estilo de ventana"
    >
      <div className="appearance-heading">
        <div>
          <div className="eyebrow">UNA VENTANA CON TU ATMÓSFERA</div>
          <h2>Estilo de ventana</h2>
          <p>
            Elige el aspecto actual o un cristal translúcido que toma el color
            de tu fondo.
          </p>
        </div>
        <Droplets size={25} />
      </div>
      <div
        className="appearance-modes"
        role="group"
        aria-label="Modo de apariencia"
      >
        {(["classic", "adaptive"] as const).map((mode) => (
          <button
            key={mode}
            className={
              "appearance-mode " +
              (cfg.appearanceMode === mode ? "selected" : "")
            }
            aria-pressed={cfg.appearanceMode === mode}
            onClick={() => change({ appearanceMode: mode })}
          >
            <div
              className={
                "appearance-mini " +
                (mode === "adaptive" ? "mini-adaptive" : "")
              }
              style={
                {
                  "--preview-color": color,
                  "--preview-opacity": 1 - cfg.glassTransparency / 100,
                } as CSSProperties
              }
            >
              <span className="mini-bar">
                <i />
                <i />
                <i />
              </span>
              <span className="mini-sidebar" />
              <span className="mini-content">
                <Sparkles size={21} />
                <i />
              </span>
            </div>
            <span className="appearance-mode-label">
              <b>{mode === "classic" ? "Clásico" : "Cristal adaptativo"}</b>
              {cfg.appearanceMode === mode && <Check size={16} />}
            </span>
            <small>
              {mode === "classic"
                ? "El estilo oscuro actual de ORBIT"
                : "Color del wallpaper + cristal + luz sutil"}
            </small>
          </button>
        ))}
      </div>
      <fieldset className="glass-controls" disabled={!active}>
        <legend>Ajustes de cristal</legend>
        <div className="glass-color-controls">
          <label>
            Color de la ventana
            <select
              aria-label="Color de la ventana"
              value={cfg.glassColorSource}
              onChange={(e) => change({ glassColorSource: e.target.value })}
            >
              <option value="wallpaper">Automático · Del wallpaper</option>
              <option value="manual">Personalizado</option>
            </select>
          </label>
          <div className="glass-swatch-row">
            <span className="glass-swatch" style={{ background: color }} />
            <span>
              {cfg.glassColorSource === "wallpaper"
                ? "Color detectado"
                : "Tu color"}
              <small>{color.toUpperCase()}</small>
            </span>
            {cfg.glassColorSource === "manual" && (
              <input
                aria-label="Color personalizado del cristal"
                type="color"
                value={cfg.glassColor}
                onChange={(e) => change({ glassColor: e.target.value })}
              />
            )}
          </div>
        </div>
        <div className="glass-slider-grid">
          {[
            {
              key: "glassTransparency",
              name: "Transparencia",
              min: 0,
              max: 80,
              unit: "%",
              hint: "Más alta, más ligero el cristal.",
            },
            {
              key: "glassIntensity",
              name: "Intensidad del color",
              min: 0,
              max: 100,
              unit: "%",
              hint: "Desde un matiz sutil hasta un tono marcado.",
            },
            {
              key: "glassBlur",
              name: "Desenfoque",
              min: 12,
              max: 48,
              unit: " px",
              hint: "Suaviza la imagen detrás de las superficies.",
            },
          ].map((control) => (
            <label key={control.key}>
              <span>
                {control.name}
                <output>
                  {
                    cfg[
                      control.key as
                        "glassTransparency" | "glassIntensity" | "glassBlur"
                    ]
                  }
                  {control.unit}
                </output>
              </span>
              <input
                type="range"
                aria-label={control.name}
                min={control.min}
                max={control.max}
                value={
                  cfg[
                    control.key as
                      "glassTransparency" | "glassIntensity" | "glassBlur"
                  ]
                }
                onChange={(e) =>
                  change({ [control.key]: Number(e.target.value) })
                }
              />
              <small>{control.hint}</small>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="appearance-footer">
        <small>
          {active
            ? "La barra, el sidebar y los paneles se adaptan al fondo de cada espacio."
            : "Activa Cristal adaptativo para ajustar el color y la transparencia."}
        </small>
        <button
          disabled={!active}
          onClick={() =>
            change({
              glassColorSource: "wallpaper",
              glassTransparency: 45,
              glassIntensity: 55,
              glassBlur: 28,
            })
          }
        >
          <RotateCcw size={13} />
          Restablecer cristal
        </button>
      </div>
    </section>
  );
}
