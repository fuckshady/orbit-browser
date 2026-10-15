import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import electron from "vite-plugin-electron/simple";
export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "orbit-dev-csp",
      transformIndexHtml(html, ctx) {
        return ctx.server
          ? html.replace(
              "script-src 'self';",
              "script-src 'self' 'unsafe-inline';",
            )
          : html;
      },
    },
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: "electron/main/index.ts",
        vite: {
          build: {
            lib: false,
            rollupOptions: {
              input: "electron/main/index.ts",
              external: ["sql.js"],
              output: {
                format: "cjs",
                entryFileNames: "main.cjs",
                chunkFileNames: "[name]-[hash].cjs",
              },
            },
          },
        },
      },
      preload: {
        input: "electron/preload/index.ts",
        vite: {
          build: {
            rollupOptions: {
              output: { format: "cjs", entryFileNames: "preload.cjs" },
            },
          },
        },
      },
    }),
  ],
  server: { host: "127.0.0.1", port: 5173, strictPort: true },
});
