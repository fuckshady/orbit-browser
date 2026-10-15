# ORBIT Browser

Navegador de escritorio para macOS con Electron, React y TypeScript. Las páginas se cargan en `WebContentsView`, no en iframes ni en el DOM de React.

## Ejecutar

Requiere Node.js 22.12+ y macOS reciente (Apple Silicon recomendado).

```sh
npm install
npm run dev
```

Vite escucha únicamente en `127.0.0.1:5173`; el plugin inicia Electron. Abrir ese puerto en Safari solo muestra un aviso: la API nativa existe únicamente dentro de Electron.

```sh
npm test
npm run build:code
npm run build
```

`build` compila y genera `release/mac-arm64/ORBIT.app` (o `release/mac/ORBIT.app` en Intel). Ejecutar `npm run dist` genera un DMG para la arquitectura actual. La versión local no está firmada ni notarizada; para distribuir hay que configurar Apple Developer ID y notarización con electron-builder. No se deshabilita Gatekeeper.

## Uso

- Barra superior o búsqueda central: introduce dominio, URL HTTP(S) o búsqueda. Motor configurable.
- Pestañas: botón +, cerrar, duplicar con el icono que aparece al pasar el cursor y arrastrar para reordenar.
- Atajos: ⌘T, ⌘W, ⌘L, ⌘R, ⌘⇧T y ⌘1–9. Se capturan también cuando una página tiene el foco.
- Sidebar: inicio, búsqueda, AI, espacios, marcadores, historial, descargas y ajustes. Los símbolos de espacios permiten cambiar de contexto directamente.
- Estrella de la barra: guardar página en una carpeta del espacio actual.
- Accesos rápidos: + para añadir, × al pasar el cursor para eliminar, arrastrar para reordenar.
- Reproductor: seleccionar uno o más archivos locales; audio mantenido en memoria, máximo 100 MB por archivo. La reproducción continúa al navegar; los controles se muestran en Inicio.
- ORBIT AI: conectar endpoint HTTPS compatible con Chat Completions, modelo y clave. La clave se cifra con `safeStorage` (llavero de macOS) y nunca vuelve al renderer. Resumir, explicar o traducir transmite hasta 24.000 caracteres visibles de la página al proveedor elegido. No hay respuestas simuladas. El chat es por solicitud; no envía automáticamente su historial como contexto.

## Arquitectura y datos

- `electron/main`: ventana, coordinación del ciclo de vida y comandos.
- `electron/browser/url.ts`: resolución de entradas y restricción HTTP(S).
- `electron/preload`: puente de comandos y suscripciones con eliminación de listeners.
- `electron/storage`: SQLite real mediante sql.js/WASM. Archivo `orbit.sqlite` en `app.getPath('userData')`, con escrituras atómicas. Historial y marcadores tienen tablas dedicadas; ajustes, sesión y espacios usan registros JSON en SQLite.
- `src/stores`: estado sincronizado desde Main con Zustand.
- `src/components`: reproductor y AI; `src/pages`: inicio y administración.
- `src/App.tsx`: chrome, sidebar, pestañas y rectángulo de la vista nativa.
- `src/styles`: Tailwind v4 y estilos cinematográficos; Motion para transiciones. Respeta movimiento reducido.

Cada pestaña remota tiene un WebContentsView aislado sin preload, Node ni acceso al IPC. El renderer de ORBIT tiene contextIsolation y sandbox. Main valida emisor y frame del IPC, geometría, URLs y ajustes; rechaza comandos no reconocidos. Popups HTTP(S) se convierten en pestañas y otros protocolos se bloquean. Los permisos web se deniegan por defecto; no hay bypass de certificados. Las vistas se ocultan al consultar pantallas internas y se dimensionan mediante ResizeObserver para respetar sidebar y AI.

Sesión web compartida y persistente: conserva cookies entre reinicios. Los espacios separan pestañas, marcadores, wallpaper y acento; **no** son contenedores de cookies separados. Las pestañas restauradas se cargan al seleccionarse; las ya abiertas mantienen su proceso hasta cerrarlas. Cerrar una pestaña destruye su WebContents.

## Límites actuales

- No es un sustituto auditado de Safari para uso de alta seguridad. Electron requiere actualizaciones periódicas de Chromium.
- DRM/Widevine, sincronización, extensiones de Chrome, gestor de contraseñas, navegador predeterminado y actualizaciones automáticas no implementados.
- Cámara, micrófono, geolocalización y notificaciones se deniegan; no se ofrece dictado por voz.
- No se restauran descargas interrumpidas después de cerrar la app. Pausa/reanuda depende del servidor y de Electron durante la sesión.
- Restaurar pestaña cerrada recupera URL y espacio, no el historial completo de navegación de esa pestaña.
- Historial visible limitado a las últimas 2.000 entradas; los registros anteriores permanecen en SQLite hasta borrarlo.
- No hay edición/eliminación de espacios existentes ni cambio de sus nombres/iconos. Los espacios nuevos sí se pueden crear.
- Marcadores se pueden añadir, buscar, filtrar por carpeta y eliminar; aún no editar ni mover.
- Sugerencias de búsqueda locales (historial y marcadores), sin API externa de autocompletado.
- Los favicons pueden cargar desde el sitio original. Las imágenes provienen de los cuatro archivos aportados; no se incluyen música ni assets generados.
- Firma, notarización, icono macOS definitivo y auditoría de accesibilidad pendientes.

La API WebContentsView sigue la [documentación oficial de Electron](https://www.electronjs.org/docs/latest/api/web-contents-view).

## Prueba de integración

`npm run test:integration` abre Electron con un perfil temporal y un servidor HTTP local. Comprueba aislamiento remoto, navegación, pestañas, espacios, cookies, SQLite y una descarga real. Guarda el informe en `/tmp/orbit-smoke.json` y capturas en `/tmp/orbit-home.png` y `/tmp/orbit-satellite.png`. Requiere una sesión gráfica macOS.

## Validación de esta entrega

Compilación TypeScript/Vite, siete pruebas de paleta de color, resolución y bloqueo de URLs y prueba de integración en Electron, desde Vite y desde ORBIT.app empaquetada. La prueba de integración comprueba dieciocho grupos de comportamientos, incluida navegación HTTPS a example.com y descarga local real. No se ha probado un proveedor AI porque no se suministraron credenciales. `npm audit --omit=dev` no reportó vulnerabilidades; permanecen ocho avisos moderados transitivos en las herramientas de empaquetado (`sprintf-js` / `electron-builder`), fuera de las dependencias distribuidas.

## Fondo de video FLOW

El video suministrado de la cascada, ampliado desde Full HD mediante Lanczos y nitidez adaptativa suave (sin inventar detalle mediante IA), está disponible en Personalización → FLOW y se activa una sola vez en el espacio PERSONAL al instalar esta revisión. Se reproduce en bucle y silenciado, en 4K (3840×2160), con encuadre `contain` sin recortes dentro del área útil de Inicio. Se pausa al salir de Inicio, ocultar la ventana o activar movimiento reducido/desactivar animaciones. Incluye una imagen de respaldo si el video no puede decodificarse. Las elecciones posteriores de wallpaper se conservan.

## Fondo de video SATELLITE

El segundo clip suministrado se encuentra en Personalización → SATELLITE. Se amplió de Full HD a 3840×2160 con el mismo proceso de FLOW, conserva todo el encuadre y se reproduce silenciado en bucle. Se activa una vez en PERSONAL al instalar esta revisión. FLOW y los demás fondos siguen disponibles.

## Wallhaven

Personalización incluye una galería conectada a la [API oficial de Wallhaven](https://www.whvn.cc/help/api): búsqueda por texto, resolución mínima (cualquiera/Full HD/2K/4K), populares, relevancia, recientes y aleatorios, con paginación. El acceso público usa el catálogo SFW y no necesita una clave. Las miniaturas son reales, no datos de muestra.

Aplicar descarga el original (máximo 35 MB), valida que sea una imagen y lo almacena en el directorio privado de ORBIT. La biblioteca y la selección por espacio se guardan en SQLite. La imagen permanece disponible sin conexión y llena el área de Inicio sin bandas negras, con recorte centrado proporcional. Un protocolo aislado sirve exclusivamente los fondos registrados; las páginas externas no tienen acceso a este protocolo ni al IPC. Las peticiones se hacen desde Main, con caché de búsquedas durante cinco minutos, controles de parámetros y manejo de errores y límites HTTP 429. El enlace de cada fondo abre su fuente en Wallhaven. No se añadió ningún selector de imágenes o videos del Mac.

## Cristal adaptativo

En Personalización → Estilo de ventana se puede elegir Clásico (predeterminado, conserva la interfaz anterior) o Cristal adaptativo. El segundo toma un color representativo del wallpaper para el sidebar, barra superior, pestañas, tarjetas y panel AI; los fondos de Wallhaven también funcionan. Permite elegir color manual, transparencia de 0–80%, intensidad de 0–100% y desenfoque de 12–48 px. Los cambios se guardan automáticamente y se pueden restablecer.

La paleta se calcula a partir de una miniatura de 64×64 y se conserva en caché; se ignoran bordes negros y luces casi blancas. Los videos usan su imagen de portada para evitar análisis continuo de cada fotograma. Cada espacio mantiene su wallpaper; el cristal se adapta al cambiar entre ellos. En macOS el modo activa vibrancy `under-window` y fondo nativo transparente; las superficies de React usan el tinte y el desenfoque elegidos. El contenido de las páginas web mantiene su propio estilo.

Los controles nativos de macOS quedan contenidos en el sidebar compacto. Los iconos y los indicadores de selección se alinean dentro de la barra en ambos modos.
