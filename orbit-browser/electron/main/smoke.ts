import { app, type BrowserWindow, type WebContentsView } from "electron";
import { createServer } from "node:http";
import assert from "node:assert/strict";
import fs from "node:fs";
import type { State } from "../../src/types";
export async function runSmoke(
  win: BrowserWindow,
  command: (a: string, p?: unknown) => Promise<any>,
  state: () => State,
  views: Map<string, WebContentsView>,
) {
  const checks: string[] = [];
  const server = createServer((req, res) => {
    if (req.url === "/file") {
      res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": 'attachment; filename="orbit-test.txt"',
      });
      res.end("ORBIT download test");
      return;
    }
    res.writeHead(200, {
      "Content-Type": "text/html",
      "Set-Cookie": "orbit=verified; SameSite=Lax",
    });
    res.end(
      `<html><head><title>ORBIT ${req.url}</title></head><body><h1>Real WebContentsView</h1><a href="/two">Next</a><a href="/file">Download</a><script>window.remoteIsolation={node:typeof require,bridge:typeof window.orbit}</script></body></html>`,
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = (server.address() as { port: number }).port;
  const base = `http://127.0.0.1:${port}`;
  async function wait(fn: () => boolean) {
    const end = Date.now() + 15000;
    while (!fn()) {
      if (Date.now() > end) throw Error("Timeout");
      await new Promise((r) => setTimeout(r, 50));
    }
  }
  async function waitVideo(source = "flow-4k.mp4") {
    const end = Date.now() + 15000;
    while (
      !(await win.webContents.executeJavaScript(
        `(()=>{const v=document.querySelector("video.wallpaper-video");return !!v&&v.getAttribute('src')===${JSON.stringify("wallpapers/" + source)}&&v.readyState>=2&&!v.paused})()`,
      ))
    ) {
      if (Date.now() > end) throw Error("Video no pudo reproducirse");
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  try {
    await wait(() => !win.webContents.isLoading());
    await new Promise((r) => setTimeout(r, 2200));
    assert.equal(
      await win.webContents.executeJavaScript("typeof window.orbit.call"),
      "function",
    );
    assert.equal(
      await win.webContents.executeJavaScript(
        'document.querySelector("h1").innerText.includes("EXPLORA")',
      ),
      true,
    );
    fs.writeFileSync(
      "/tmp/orbit-home.png",
      (await win.webContents.capturePage()).toPNG(),
    );
    checks.push("Renderer y preload aislado cargados; inicio visible");
    if (process.platform === "darwin")
      assert.equal(win.getWindowButtonPosition()?.x, 8);
    async function checkSidebar(centered: boolean) {
      const result = await win.webContents.executeJavaScript(
        `(()=>{const rail=document.querySelector('.sidebar').getBoundingClientRect();const controls=[...document.querySelectorAll('.sidebar button')];return {inside:controls.every(button=>{const r=button.getBoundingClientRect();return r.left>=rail.left&&r.right<=rail.right&&r.top>=rail.top&&r.bottom<=rail.bottom;}),centered:controls.every(button=>{const icon=button.querySelector('svg')??button.querySelector('span');if(!icon)return true;const r=icon.getBoundingClientRect();return Math.abs((r.left+r.right)/2-(rail.left+rail.right)/2)<1.5;})};})()`,
      );
      assert.equal(result.inside, true);
      if (centered) assert.equal(result.centered, true);
    }
    await checkSidebar(true);
    await win.webContents.executeJavaScript(
      `document.querySelector('[title="Expandir sidebar"]').click()`,
    );
    await new Promise((r) => setTimeout(r, 350));
    await checkSidebar(false);
    await win.webContents.executeJavaScript(
      `document.querySelector('[title="Contraer sidebar"]').click()`,
    );
    await new Promise((r) => setTimeout(r, 350));
    await checkSidebar(true);
    checks.push(
      "Controles nativos dentro de la barra y botones centrados, sin desbordamiento al expandir o contraer",
    );

    await command("settings", { theme: "FLOW" });
    await waitVideo();
    const framing = await win.webContents.executeJavaScript(`(()=>{
      const v=document.querySelector('video.wallpaper-video');
      const box=v.getBoundingClientRect(),area=document.querySelector('.viewport').getBoundingClientRect();
      return {width:v.videoWidth,height:v.videoHeight,fit:getComputedStyle(v).objectFit,inside:Math.abs(box.x-area.x)<1&&Math.abs(box.y-area.y)<1&&Math.abs(box.width-area.width)<1&&Math.abs(box.height-area.height)<1};
    })()`);
    assert.deepEqual(framing, {
      width: 3840,
      height: 2160,
      fit: "contain",
      inside: true,
    });
    checks.push(
      "Video 4K 3840×2160, encuadre completo dentro del área de Inicio",
    );
    const before = await win.webContents.executeJavaScript(
      'document.querySelector("video.wallpaper-video").currentTime',
    );
    await new Promise((r) => setTimeout(r, 500));
    assert(
      (await win.webContents.executeJavaScript(
        'document.querySelector("video.wallpaper-video").currentTime',
      )) > before,
    );
    fs.writeFileSync(
      "/tmp/orbit-flow.png",
      (await win.webContents.capturePage()).toPNG(),
    );
    checks.push("Video de cascada decodificado y reproduciéndose en Inicio");

    await command("settings", { theme: "SATELLITE" });
    await waitVideo("satellite-4k.mp4");
    assert.deepEqual(
      await win.webContents.executeJavaScript(
        `(()=>{const v=document.querySelector('video.wallpaper-video');return {width:v.videoWidth,height:v.videoHeight,fit:getComputedStyle(v).objectFit,source:v.getAttribute('src')};})()`,
      ),
      {
        width: 3840,
        height: 2160,
        fit: "contain",
        source: "wallpapers/satellite-4k.mp4",
      },
    );
    await new Promise((r) => setTimeout(r, 1200));
    fs.writeFileSync(
      "/tmp/orbit-satellite-video.png",
      (await win.webContents.capturePage()).toPNG(),
    );
    checks.push(
      "Fondo SATELLITE 4K reproducible, seleccionable junto a FLOW y sin recortes",
    );

    await command("navigate", base + "/one");
    await wait(
      () =>
        state().tabs.find((t) => t.id === state().active)?.title ===
          "ORBIT /one" &&
        !state().tabs.find((t) => t.id === state().active)?.loading,
    );
    const first = state().active;
    const wc = views.get(first)!.webContents;
    assert.deepEqual(await wc.executeJavaScript("window.remoteIsolation"), {
      node: "undefined",
      bridge: "undefined",
    });
    checks.push(
      "Navegación real, título real y ausencia de Node/IPC en web remota",
    );
    await command("navigate", base + "/two");
    await wait(
      () => state().tabs.find((t) => t.id === first)?.title === "ORBIT /two",
    );
    await command("back");
    await wait(
      () =>
        state()
          .tabs.find((t) => t.id === first)
          ?.url.endsWith("/one") === true,
    );
    await command("forward");
    await wait(
      () =>
        state()
          .tabs.find((t) => t.id === first)
          ?.url.endsWith("/two") === true,
    );
    checks.push("Atrás y adelante independientes");
    await command("bookmark", "Pruebas");
    assert(state().bookmarks.some((b) => b.url === base + "/two"));
    assert(state().history.some((h) => h.url === base + "/one"));
    assert(
      state().history.some(
        (h) => h.url === base + "/one" && h.title === "ORBIT /one",
      ),
    );
    checks.push("Historial y marcadores en SQLite con título final");
    await command("new", base + "/one");
    const second = state().active;
    await wait(
      () => state().tabs.find((t) => t.id === second)?.title === "ORBIT /one",
    );
    await command("close", second);
    assert(!views.has(second));
    assert(!state().tabs.some((t) => t.id === second));
    checks.push("Nueva pestaña, cambio y destrucción de WebContents al cerrar");
    await command("space", "1");
    assert.equal(state().space, "1");
    assert.equal(state().tabs.find((t) => t.id === state().active)?.url, "");
    await command("space", "0");
    checks.push("Pestañas independientes por espacio");
    await command("settings", { engine: "DuckDuckGo" });
    assert.equal(state().settings.engine, "DuckDuckGo");
    await assert.rejects(command("navigate", "javascript:alert(1)"));
    await assert.rejects(command("untrusted"));
    checks.push("Validación de URL e IPC");
    await command("select", first);
    await views
      .get(first)!
      .webContents.executeJavaScript(
        `document.querySelector('a[href="/file"]').click()`,
      );
    await wait(() => state().downloads.some((d) => d.state === "completed"));
    const d = state().downloads.find((d) => d.state === "completed")!;
    assert.equal(fs.readFileSync(d.path, "utf8"), "ORBIT download test");
    checks.push("Descarga real completada y contenido verificado");
    const cookies = await views
      .get(first)!
      .webContents.session.cookies.get({ url: base });
    assert(cookies.some((c) => c.name === "orbit"));
    checks.push("Cookies de sesión real");
    await command("navigate", "https://example.com");
    await wait(
      () =>
        state().tabs.find((t) => t.id === first)?.title === "Example Domain",
    );
    checks.push("Navegación HTTPS real a example.com");
    await win.webContents.executeJavaScript(
      `document.querySelector('[title="Personaliza ORBIT"]').click()`,
    );
    await new Promise((r) => setTimeout(r, 500));
    assert(
      await win.webContents.executeJavaScript(
        'document.body.innerText.includes("Personaliza ORBIT")',
      ),
    );
    fs.writeFileSync(
      "/tmp/orbit-settings.png",
      (await win.webContents.capturePage()).toPNG(),
    );
    await assert.rejects(command("wallhavenApply", "../secret"));
    await assert.rejects(
      command("wallhavenSearch", {
        query: "space",
        page: 0,
        sort: "toplist",
        resolution: "3840x2160",
      }),
    );
    const gallery = await command("wallhavenSearch", {
      query: "space",
      page: 1,
      sort: "toplist",
      resolution: "3840x2160",
    });
    assert(gallery.items.length > 0, "La API no devolvió fondos reales");
    const chosen = gallery.items[0];
    await win.webContents.executeJavaScript(
      `document.querySelector('.wallhaven-section').scrollIntoView({block:'start'});document.querySelector('.wallhaven-search').requestSubmit()`,
    );
    const deadline = Date.now() + 20000;
    while (
      !(await win.webContents.executeJavaScript(
        `(()=>{const i=document.querySelector('.wallhaven-card img');return !!i&&i.complete&&i.naturalWidth>0;})()`,
      ))
    ) {
      if (Date.now() > deadline)
        throw Error("La galería no cargó las imágenes");
      await new Promise((r) => setTimeout(r, 100));
    }
    await new Promise((r) => setTimeout(r, 300));
    fs.writeFileSync(
      "/tmp/orbit-wallhaven.png",
      (await win.webContents.capturePage()).toPNG(),
    );
    await command("wallhavenApply", chosen.id);
    const saved = state().wallpapers.find(
      (w) => w.id === "wallhaven-" + chosen.id,
    )!;
    assert(saved);
    assert.equal(
      state().spaces.find((sp) => sp.id === state().space)?.wallpaper,
      saved.id,
    );
    const dimensions = await win.webContents.executeJavaScript(
      `new Promise(resolve=>{const i=new Image();i.onload=()=>resolve([i.naturalWidth,i.naturalHeight]);i.onerror=()=>resolve(null);i.src=${JSON.stringify(saved.src)};})`,
    );
    assert(
      Array.isArray(dimensions) &&
        dimensions[0] >= 3840 &&
        dimensions[1] >= 2160,
      "El original guardado no se pudo mostrar a resolución completa",
    );
    await command("settings", { theme: "EARTH" });
    await command("wallpaperSelect", saved.id);
    assert.equal(
      state().spaces.find((sp) => sp.id === state().space)?.wallpaper,
      saved.id,
    );
    await win.webContents.executeJavaScript(
      `document.querySelector('[title="Inicio"]').click()`,
    );
    await new Promise((r) => setTimeout(r, 900));
    async function checkImageFill() {
      const fill = await win.webContents.executeJavaScript(
        `(()=>{const image=document.querySelector('.saved-wallpaper .wallpaper');const bounds=image.getBoundingClientRect();const area=document.querySelector('.viewport').getBoundingClientRect();return {size:getComputedStyle(image).backgroundSize,covers:Math.abs(bounds.x-area.x)<1&&Math.abs(bounds.y-area.y)<1&&Math.abs(bounds.width-area.width)<1&&Math.abs(bounds.height-area.height)<1};})()`,
      );
      assert.deepEqual(fill, { size: "cover", covers: true });
    }
    await checkImageFill();
    win.setSize(1100, 760);
    await new Promise((r) => setTimeout(r, 250));
    await checkImageFill();
    win.setSize(1440, 940);
    await new Promise((r) => setTimeout(r, 400));
    await checkImageFill();
    fs.writeFileSync(
      "/tmp/orbit-wallpaper-fill.png",
      (await win.webContents.capturePage()).toPNG(),
    );
    checks.push(
      "Fondos de imagen llenan Inicio sin bandas negras en ventanas de diferentes proporciones",
    );
    await win.webContents.executeJavaScript(
      `document.querySelector('[title="Personaliza ORBIT"]').click()`,
    );
    await new Promise((r) => setTimeout(r, 200));
    checks.push(
      "Wallhaven real: búsqueda 4K, miniaturas, descarga original, protocolo local y selección persistida",
    );
    await win.webContents.executeJavaScript(
      `document.querySelector('[title="ORBIT AI"]').click()`,
    );
    await new Promise((r) => setTimeout(r, 500));
    assert(
      await win.webContents.executeJavaScript(
        'document.body.innerText.includes("Conecta tu inteligencia")',
      ),
    );
    checks.push("Pantallas de personalización y configuración AI renderizadas");
    await win.webContents.executeJavaScript(
      `document.querySelector('[title="Cerrar"]').click();document.querySelector('[title="Inicio"]').click()`,
    );

    await command("home");
    await assert.rejects(command("settings", { appearanceMode: "unknown" }));
    await assert.rejects(
      command("settings", { glassColor: "url(file:///etc/passwd)" }),
    );
    await assert.rejects(command("settings", { glassTransparency: NaN }));
    await command("settings", {
      theme: "WATERFALL",
      appearanceMode: "adaptive",
      glassColorSource: "wallpaper",
      glassTransparency: 58,
      glassIntensity: 65,
      glassBlur: 32,
    });
    const detected = await command("wallpaperTint", "waterfall");
    await new Promise((r) => setTimeout(r, 1400));
    assert.match(detected, /^#[a-f\d]{6}$/i);
    assert.equal(
      await win.webContents.executeJavaScript(
        'document.querySelector(".app").style.getPropertyValue("--tint-color")',
      ),
      detected,
    );
    assert(
      await win.webContents.executeJavaScript(
        'document.querySelector(".app").classList.contains("adaptive-glass")',
      ),
    );
    // Electron intentionally returns RGB only, omitting alpha.
    assert.equal(win.getBackgroundColor(), "#000000");
    assert.equal(
      await win.webContents.executeJavaScript(
        "getComputedStyle(document.documentElement).backgroundColor",
      ),
      "rgba(0, 0, 0, 0)",
    );
    fs.writeFileSync(
      "/tmp/orbit-adaptive-green.png",
      (await win.webContents.capturePage()).toPNG(),
    );
    const initialFill = await win.webContents.executeJavaScript(
      'getComputedStyle(document.querySelector(".sidebar")).backgroundImage',
    );
    await command("settings", { glassTransparency: 25 });
    await new Promise((r) => setTimeout(r, 100));
    assert.notEqual(
      await win.webContents.executeJavaScript(
        'getComputedStyle(document.querySelector(".sidebar")).backgroundImage',
      ),
      initialFill,
    );
    await command("settings", {
      glassColorSource: "manual",
      glassColor: "#28b46e",
      glassTransparency: 58,
    });
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(
      await win.webContents.executeJavaScript(
        'document.querySelector(".app").style.getPropertyValue("--tint-color")',
      ),
      "#28b46e",
    );
    await command("settings", { glassColorSource: "wallpaper" });
    await win.webContents.executeJavaScript(
      `document.querySelector('[title="Personaliza ORBIT"]').click()`,
    );
    await new Promise((r) => setTimeout(r, 400));
    await win.webContents.executeJavaScript(
      `document.querySelector('.appearance-section').scrollIntoView({block:'start'})`,
    );
    fs.writeFileSync(
      "/tmp/orbit-appearance-settings.png",
      (await win.webContents.capturePage()).toPNG(),
    );
    await command("settings", { appearanceMode: "classic" });
    await new Promise((r) => setTimeout(r, 100));
    assert(
      !(await win.webContents.executeJavaScript(
        'document.querySelector(".app").classList.contains("adaptive-glass")',
      )),
    );
    assert.equal(win.getBackgroundColor(), "#050816");
    checks.push(
      "Cristal adaptativo: color real del wallpaper, tinte manual, transparencia ajustable, vibrancy macOS, validación y regreso a Clásico",
    );
    await win.webContents.executeJavaScript(
      `document.querySelector('[title="Inicio"]').click()`,
    );
    await command("settings", { theme: "ORBIT" });
    await new Promise((r) => setTimeout(r, 1600));
    fs.writeFileSync(
      "/tmp/orbit-satellite.png",
      (await win.webContents.capturePage()).toPNG(),
    );
    fs.writeFileSync(
      "/tmp/orbit-smoke.json",
      JSON.stringify({ ok: true, checks }, null, 2),
    );
    console.log("ORBIT_SMOKE_OK", JSON.stringify(checks));
    server.close();
    app.exit(0);
  } catch (error) {
    fs.writeFileSync(
      "/tmp/orbit-smoke.json",
      JSON.stringify({ ok: false, checks, error: String(error) }, null, 2),
    );
    console.error(error);
    server.close();
    app.exit(1);
  }
}
