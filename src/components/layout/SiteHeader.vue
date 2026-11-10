<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { site } from '../../data/site';
import { contentDocument } from '../../content/store';
import { contentImage } from '../../content/assets';
import { appearance } from '../../data/appearance';
import MusicPlayer from '../ui/MusicPlayer.vue';
import WallpaperPicker from '../ui/WallpaperPicker.vue';
import { useMusicPlayer } from '../../composables/useMusicPlayer';
const route = useRoute(), open = ref(false), toggle = ref(null);
const avatar = computed(() => contentImage(contentDocument.value.pages.home.blocks[0].data.avatar || 'artwork:avatar'));
const { expanded: musicExpanded } = useMusicPlayer();
const navigation = site.navigation;
watch(musicExpanded, value => { if (value) open.value = false; });
watch(open, value => { if (value) musicExpanded.value = false; });
watch(() => route.fullPath, () => { open.value = false; });
function onEscape(event) { if (event.key === 'Escape' && open.value) { open.value = false; toggle.value?.focus(); } }
onMounted(() => window.addEventListener('keydown', onEscape));
onUnmounted(() => window.removeEventListener('keydown', onEscape));
</script>
<template>
  <header class="site-header space-header">
    <RouterLink to="/" class="space-wordmark" :aria-label="`${site.name} 首页`">
      <img class="space-brand-avatar" :src="avatar" :style="{ objectPosition: appearance.avatarPosition }" alt="" width="28" height="28" />
      <svg class="space-brand-leaf" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 27C15 17 7 17 5 8c8-1 15 5 13 13M16 27c0-9 0-18 10-20 3 8-2 16-10 16M9 12l7 13m7-13-6 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
      <span>{{ site.name }}</span>
    </RouterLink>
    <nav id="site-navigation" class="space-nav" :class="{ 'is-open': open }" aria-label="主要导航">
      <RouterLink v-for="item in navigation" :key="item.path" :to="item.path" :class="{ 'is-active': item.path === '/' ? route.path === '/' : route.path.startsWith(item.path) }">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="item.icon" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg><span>{{ item.label }}</span>
      </RouterLink>
    </nav>
    <div class="space-header-actions">
      <WallpaperPicker /><MusicPlayer />
      <button ref="toggle" class="space-menu-toggle" :aria-expanded="open" aria-controls="site-navigation" :aria-label="open ? '关闭导航菜单' : '打开导航菜单'" @click="open = !open"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="open ? 'm6 6 12 12M6 18 18 6' : 'M4 6h16M4 12h16M4 18h16'" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg></button>
    </div>
  </header>
</template>
