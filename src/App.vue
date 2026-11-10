<script setup>
import { computed, nextTick, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import SiteHeader from "./components/layout/SiteHeader.vue";
import SiteFooter from "./components/layout/SiteFooter.vue";
import SiteBackdrop from "./components/layout/SiteBackdrop.vue";
import SiteBanner from "./components/layout/SiteBanner.vue";
import SpaceSidebar from "./components/layout/SpaceSidebar.vue";

const route = useRoute();
const isHome = computed(() => route.path === "/");
const isReading = computed(() => /^\/unity-notes\/[^/]+\/?$/.test(route.path));
function skipToMain() {
  document.getElementById("main-content")?.focus();
}
function focusPage() {
  const target =
    document.getElementById(route.hash.slice(1)) ||
    document.querySelector("main h1") || document.querySelector("#cover h1");
  target?.focus({ preventScroll: true });
}
watch(
  () => route.hash,
  async (hash) => {
    if (!hash) return;
    await nextTick();
    document.getElementById(hash.slice(1))?.focus({ preventScroll: true });
  },
);
</script>

<template>
  <div class="app-frame" :class="{ 'is-home': isHome, 'is-reading': isReading }">
    <SiteBackdrop />
    <a class="skip-link" href="#main-content" @click.prevent="skipToMain"
      >跳到主要内容</a
    >
    <SiteHeader />
    <SiteBanner />
    <div class="space-layout">
      <SpaceSidebar />
      <main id="main-content" class="app-main" tabindex="-1">
        <RouterView v-slot="{ Component, route: viewRoute }">
          <Transition name="page" mode="out-in" @after-enter="focusPage">
            <component :is="Component" :key="viewRoute.path" />
          </Transition>
        </RouterView>
      </main>
      <SpaceSidebar v-if="!isReading" side="right" />
    </div>
    <SiteFooter />
  </div>
</template>
