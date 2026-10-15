import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { localContentEditor } from "./server/contentEditor.js";

export default defineConfig({
  plugins: [
    vue(),
    localContentEditor(),
    {
      name: "github-pages-history-fallback",
      apply: "build",
      enforce: "post",
      generateBundle: {
        order: "post",
        handler(_options, bundle) {
          const entry = bundle["index.html"];
          if (!entry || entry.type !== "asset") {
            this.error("Cannot generate the Pages fallback without index.html");
          }
          // Real directory entries make the existing fixed pages return 200.
          // Keep this list aligned with the static routes in src/router/index.js.
          const entries = [
            "world/index.html",
            "music/index.html",
            "little-things/index.html",
            "404.html",
          ];
          for (const fileName of entries) {
            this.emitFile({ type: "asset", fileName, source: entry.source });
          }
        },
      },
    },
  ],
  base: process.env.VITE_BASE_PATH || "/",
});
