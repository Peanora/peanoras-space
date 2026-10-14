<script setup>
import { nextTick, watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import SiteHeader from "./components/layout/SiteHeader.vue";
import SiteFooter from "./components/layout/SiteFooter.vue";

const route = useRoute();
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
  <a class="skip-link" href="#main-content" @click.prevent="skipToMain"
    >跳到主要内容</a
  >
  <SiteHeader />
  <main id="main-content" tabindex="-1">
    <RouterView v-slot="{ Component, route: viewRoute }">
      <Transition name="page" mode="out-in" @after-enter="focusPage">
        <component :is="Component" :key="viewRoute.path" />
      </Transition>
    </RouterView>
  </main>
  <SiteFooter />
</template>
