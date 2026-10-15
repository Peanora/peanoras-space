import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    vue(),
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
          // Pages serves this document at the requested URL with HTTP 404.
          // Root-relative Vite assets let Vue render that URL without a redirect.
          this.emitFile({ type: "asset", fileName: "404.html", source: entry.source });
        },
      },
    },
  ],
  base: process.env.VITE_BASE_PATH || "/",
});
