import { useState } from "react";
import { Sparkles, X, ArrowUp, KeyRound } from "lucide-react";
import { useBrowser } from "../stores/browser";
export function AIChat({ close }: { close: () => void }) {
  const { state: s, run } = useBrowser();
  const [messages, setMessages] = useState<{ role: string; text: string }[]>(
      [],
    ),
    [text, setText] = useState(""),
    [busy, setBusy] = useState(false),
    [key, setKey] = useState(""),
    [config, setConfig] = useState(false);
  if (!s) return null;
  async function ask(prompt: string, page = false) {
    if (!prompt.trim() || busy) return;
    setMessages((m) => [...m, { role: "user", text: prompt }]);
    setText("");
    setBusy(true);
    const reply = await run("ai", { prompt, page });
    setBusy(false);
    if (reply)
      setMessages((m) => [...m, { role: "assistant", text: String(reply) }]);
  }
  return (
    <aside className="ai-panel glass">
      <header>
        <Sparkles size={18} />
        <b>ORBIT AI</b>
        <span className="badge">ASSISTANT</span>
        <button onClick={close} title="Cerrar">
          <X size={17} />
        </button>
      </header>
      {!s.aiConfigured || config ? (
        <div className="ai-config">
          <KeyRound size={28} />
          <h2>Conecta tu inteligencia.</h2>
          <p>
            Configura una API compatible con Chat Completions. La clave se cifra
            con el llavero de macOS.
          </p>
          <label>
            Endpoint HTTPS
            <input
              defaultValue={s.settings.aiEndpoint}
              onBlur={(e) => run("settings", { aiEndpoint: e.target.value })}
            />
          </label>
          <label>
            Modelo
            <input
              defaultValue={s.settings.aiModel}
              placeholder="Nombre del modelo"
              onBlur={(e) => run("settings", { aiModel: e.target.value })}
            />
          </label>
          <label>
            Clave API
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            className="primary"
            onClick={async () => {
              if (key) {
                await run("aiKey", key);
                setKey("");
                setConfig(false);
              }
            }}
          >
            Guardar conexión
          </button>
          <small>Sin proveedor no se generan respuestas.</small>
        </div>
      ) : (
        <>
          <div className="chat-scroll">
            {messages.length === 0 && (
              <div className="ai-welcome">
                <div className="ai-orb">
                  <Sparkles />
                </div>
                <h2>Una nueva perspectiva.</h2>
                <p>
                  Pregunta, explora y comprende.
                  <br />
                  Tu copiloto para la web.
                </p>
                {[
                  "Resume esta página",
                  "Explica el contenido de esta página",
                  "Traduce esta página al español",
                ].map((t) => (
                  <button
                    className="suggestion"
                    key={t}
                    onClick={() => ask(t, true)}
                  >
                    {t} <ArrowUp size={14} />
                  </button>
                ))}
                <small>
                  Estas acciones envían texto de la página al proveedor
                  configurado.
                </small>
              </div>
            )}
            {messages.map((m, i) => (
              <div className={"message " + m.role} key={i}>
                <small>{m.role === "user" ? "TÚ" : "ORBIT AI"}</small>
                <p>{m.text}</p>
              </div>
            ))}
            {busy && <div className="skeleton">Consultando proveedor…</div>}
          </div>
          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(text);
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Pregunta a ORBIT…"
            />
            <button className="primary" disabled={busy || !text.trim()}>
              <ArrowUp size={18} />
            </button>
          </form>
          <button className="subtle" onClick={() => setConfig(true)}>
            Configurar proveedor
          </button>
        </>
      )}
    </aside>
  );
}
