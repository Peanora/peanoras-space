<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import SiteHeader from "./components/layout/SiteHeader.vue";
import SiteFooter from "./components/layout/SiteFooter.vue";
import SiteBackdrop from "./components/layout/SiteBackdrop.vue";
import SiteBanner from "./components/layout/SiteBanner.vue";
import SpaceSidebar from "./components/layout/SpaceSidebar.vue";
import './styles/original-home-shell.css';

const route = useRoute();
const isHome = computed(() => route.path === "/");
const isReading = computed(() => /^\/unity-notes\/[^/]+\/?$/.test(route.path));
const homeSidebarOpen = ref(false);
async function toggleHomeSidebar() {
  if (!isHome.value) return;
  homeSidebarOpen.value = !homeSidebarOpen.value;
  if (homeSidebarOpen.value) {
    await nextTick();
    document.querySelector('#home-sidebar a')?.focus({ preventScroll: true });
  }
}
function closeHomeSidebar(restoreFocus = false) {
  homeSidebarOpen.value = false;
  if (restoreFocus) document.querySelector('.space-menu-toggle')?.focus({ preventScroll: true });
}
function sidebarKey(event) {
  if (event.key === 'Escape' && homeSidebarOpen.value) {
    event.preventDefault(); closeHomeSidebar(true);
  }
}
function headerPointer(event) {
  if (homeSidebarOpen.value && event.target?.closest?.('.space-header')) closeHomeSidebar();
}
watch(() => route.fullPath, () => closeHomeSidebar());
onMounted(() => {
  window.addEventListener('peanora:toggle-home-sidebar', toggleHomeSidebar);
  window.addEventListener('keydown', sidebarKey);
  document.addEventListener('pointerdown', headerPointer);
});
onUnmounted(() => {
  window.removeEventListener('peanora:toggle-home-sidebar', toggleHomeSidebar);
  window.removeEventListener('keydown', sidebarKey);
  document.removeEventListener('pointerdown', headerPointer);
});
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
    <SiteHeader :home-sidebar-open="homeSidebarOpen" />
    <SiteBanner v-if="!isHome" />
    <div class="space-layout" :class="{ 'original-home-layout': isHome }">
      <button v-if="isHome && homeSidebarOpen" class="home-sidebar-backdrop" aria-label="收起个人侧栏" @click="closeHomeSidebar(true)"></button>
      <SpaceSidebar :id="isHome ? 'home-sidebar' : undefined" :compact="isHome" :class="{ 'is-open': homeSidebarOpen }" />
      <main id="main-content" class="app-main" tabindex="-1" :inert="isHome && homeSidebarOpen">
        <RouterView v-slot="{ Component, route: viewRoute }">
          <Transition name="page" mode="out-in" @after-enter="focusPage">
            <component :is="Component" :key="viewRoute.path" />
          </Transition>
        </RouterView>
      </main>
      <SpaceSidebar v-if="!isHome && !isReading" side="right" />
    </div>
    <SiteFooter v-if="!isHome" />
  </div>
</template>
