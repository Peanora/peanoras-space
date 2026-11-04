import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { localContentEditor } from "./server/contentEditor.js";
import { renderMetadata, staticContentPaths } from "./src/data/metadata.js";
import { readFileSync } from 'node:fs';
import { publishedDocument } from './src/content/unityNotes.js';

const withMetadata = (html, path, content) => html.replace(
  /<!-- page-metadata:start -->[\s\S]*?<!-- page-metadata:end -->/,
  `<!-- page-metadata:start -->\n    ${renderMetadata(path, content)}\n    <!-- page-metadata:end -->`,
);

export default defineConfig({
  plugins: [
    {
      name:'exclude-unity-drafts', apply:'build', enforce:'pre',
      transform(source,id) {
        if (id.replaceAll('\\','/').endsWith('/src/data/content.json')) return {code:JSON.stringify(publishedDocument(JSON.parse(source))),map:null};
      },
    },
    vue(),
    localContentEditor(),
    {
      name: "github-pages-history-fallback",
      transformIndexHtml(html) { return withMetadata(html, "/"); },
    },
    {
      name: "github-pages-route-entries",
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
          // Keep pageMetadata aligned with static routes in src/router/index.js.
          const content = JSON.parse(readFileSync(new URL('./src/data/content.json', import.meta.url),'utf8'));
          for (const path of staticContentPaths(content).filter((path) => path !== "/")) {
            this.emitFile({ type: "asset", fileName: `${path.slice(1)}/index.html`, source: withMetadata(entry.source, path, content) });
          }
          this.emitFile({ type: "asset", fileName: "404.html", source: withMetadata(entry.source, "/404") });
        },
      },
    },
  ],
  base: process.env.VITE_BASE_PATH || "/",
});
