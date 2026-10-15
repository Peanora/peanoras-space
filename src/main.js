import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./styles/tokens.css";
import "./styles/wenkai.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/appearance.css";
import "./styles/home.css";
import "./styles/scrapbook.css";
import "./styles/music-player.css";
import "./styles/content-blocks.css";

if (import.meta.env.DEV && /^\/__editor\/?$/.test(location.pathname)) {
  import("./editor/main.js");
} else {
  if (import.meta.env.DEV && window.parent !== window && new URLSearchParams(location.search).has("__editor_preview")) {
    const { installPreview } = await import("./editor/preview.js");
    installPreview();
  }
  createApp(App).use(router).mount("#app");
}
