<script setup>
import { computed, nextTick, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import SiteHeader from "./components/layout/SiteHeader.vue";
import SiteFooter from "./components/layout/SiteFooter.vue";
import SiteBackdrop from "./components/layout/SiteBackdrop.vue";

const route = useRoute();
const isHome = computed(() => route.path === "/");
function skipToMain() {
  document.getElementById("main-content")?.focus();
}
function focusPage() {
  const target =
    document.getElementById(route.hash.slice(1)) ||
    document.querySelector("main h1");
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
  <div class="app-frame" :class="{ 'is-home': isHome }">
    <SiteBackdrop />
    <a class="skip-link" href="#main-content" @click.prevent="skipToMain"
      >跳到主要内容</a
    >
    <SiteHeader />
    <main id="main-content" class="app-main" tabindex="-1">
      <RouterView v-slot="{ Component, route: viewRoute }">
        <Transition name="page" mode="out-in" @after-enter="focusPage">
          <component :is="Component" :key="viewRoute.path" />
        </Transition>
      </RouterView>
    </main>
    <SiteFooter v-if="!isHome" />
  </div>
</template>
