import { createRouter, createWebHistory } from "vue-router";
import { updateMetadata } from "../data/metadata.js";
import { migrateLegacyHash } from "./legacyHistory.js";

// Replace the current entry before Vue Router reads it: no reload or extra
// history entry, and ordinary section anchors remain untouched.
migrateLegacyHash(window.location, window.history);

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: () => import("../views/HomeView.vue"),
    },
    {
      path: "/world",
      component: () => import("../views/WorldView.vue"),
    },
    {
      path: "/music",
      component: () => import("../views/MusicView.vue"),
    },
    {
      path: "/little-things",
      component: () => import("../views/LittleThingsView.vue"),
    },
    {
      path: "/:pathMatch(.*)*",
      component: () => import("../views/NotFoundView.vue"),
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
  updateMetadata(to.path);
});

export default router;
