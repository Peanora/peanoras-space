<script setup>
import { ref, watch, onUnmounted } from "vue";
import { useRoute } from "vue-router";
import { site } from "../../data/site";
import MusicPlayer from "../ui/MusicPlayer.vue";
import { useMusicPlayer } from "../../composables/useMusicPlayer";

const open = ref(false);
const toggle = ref(null);
const route = useRoute();
const { expanded: musicExpanded } = useMusicPlayer();
watch(musicExpanded, (value) => { if (value) open.value = false; });
watch(open, (value) => { if (value) musicExpanded.value = false; });
watch(
  () => route.fullPath,
  () => {
    open.value = false;
  },
);
function onEscape(event) {
  if (event.key === "Escape" && open.value) {
    open.value = false;
    toggle.value?.focus();
  }
}
window.addEventListener("keydown", onEscape);
onUnmounted(() => window.removeEventListener("keydown", onEscape));
</script>

<template>
  <header class="site-header shell">
    <RouterLink to="/" class="wordmark" aria-label="Peanora's Space 首页"
      ><span class="wordmark-initial">P.</span
      ><span>{{ site.name }}</span></RouterLink
    >
    <button
      ref="toggle"
      class="menu-toggle"
      :aria-expanded="open"
      aria-controls="site-navigation"
      @click="open = !open"
    >
      {{ open ? "关闭" : "菜单"
      }}<span class="menu-mark" aria-hidden="true">{{ open ? "−" : "+" }}</span>
    </button>
    <nav
      id="site-navigation"
      class="site-navigation"
      :class="{ 'is-open': open }"
      aria-label="主要导航"
    >
      <RouterLink
        v-for="item in site.navigation"
        :key="item.path"
        :to="item.path"
        >{{ item.label }}</RouterLink
      >
    </nav>
    <MusicPlayer />
  </header>
</template>
