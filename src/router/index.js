import { createRouter, createWebHistory } from "vue-router";
import { site } from "../data/site";
import { legacyHistoryPath } from "./legacyHistory.js";

// Replace the current entry before Vue Router reads it: no reload or extra
// history entry, and ordinary section anchors remain untouched.
const legacyPath = legacyHistoryPath(window.location.href);
if (legacyPath !== null) {
  window.history.replaceState(window.history.state, "", legacyPath);
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: () => import("../views/HomeView.vue"),
      meta: { title: "" },
    },
    {
      path: "/world",
      component: () => import("../views/WorldView.vue"),
      meta: { title: "My World" },
    },
    {
      path: "/music",
      component: () => import("../views/MusicView.vue"),
      meta: { title: "Music & Memories" },
    },
    {
      path: "/little-things",
      component: () => import("../views/LittleThingsView.vue"),
      meta: { title: "Little Things" },
    },
    {
      path: "/:pathMatch(.*)*",
      component: () => import("../views/NotFoundView.vue"),
      meta: { title: "页面未找到" },
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    // 等待 180ms 的离场完成，避免旧页面高度影响返回位置和章节定位。
    return new Promise((resolve) =>
      setTimeout(() => {
        if (savedPosition) resolve(savedPosition);
        else if (to.hash) resolve({ el: to.hash, top: 30, behavior: "auto" });
        else resolve({ top: 0 });
      }, 220),
    );
  },
});

router.afterEach((to) => {
  document.title = to.meta.title
    ? `${to.meta.title} — ${site.name}`
    : site.name;
});

export default router;
