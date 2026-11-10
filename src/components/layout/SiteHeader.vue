<script setup>
import { computed, nextTick, ref, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { site, headerMenuFor } from '../../data/site';
import { contentDocument } from '../../content/store';
import { unityEntries } from '../../content/unityNotes';
import WallpaperPicker from '../ui/WallpaperPicker.vue';
import { useMusicPlayer } from '../../composables/useMusicPlayer';
defineProps({ homeSidebarOpen: Boolean });
const route = useRoute(), router = useRouter();
const open = ref(false), activeMenu = ref(''), toggle = ref(null), search = ref(''), searchOpen = ref(false), softTone = ref(false);
const hoverMenu = ref('');
const { expanded: musicExpanded } = useMusicPlayer();
const notes = computed(() => unityEntries(contentDocument.value));
const categories = computed(() => [...new Set(notes.value.map(note => note.category).filter(Boolean))]);
const menus = computed(() => headerMenuFor(categories.value));
const results = computed(() => search.value.trim() ? notes.value.filter(note => `${note.title} ${note.summary} ${note.category}`.toLocaleLowerCase().includes(search.value.trim().toLocaleLowerCase())).slice(0, 6) : []);
function closeMenus() { open.value = false; activeMenu.value = ''; hoverMenu.value = ''; searchOpen.value = false; }
function showHomeSidebar() { closeMenus(); window.dispatchEvent(new CustomEvent('peanora:toggle-home-sidebar')); }
function findNotes() { closeMenus(); router.push({ path: '/unity-notes', query: search.value.trim() ? { q: search.value.trim() } : {} }); }
function scrollToContent() { document.getElementById('main-content')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
async function showMusic() {
  if (window.matchMedia(route.path === '/' ? '(max-width: 1023px)' : '(max-width: 767px)').matches) { musicExpanded.value = !musicExpanded.value; return; }
  musicExpanded.value = true;
  await nextTick();
  document.getElementById('music-panel')?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  document.getElementById('music-panel-heading')?.focus({ preventScroll: true });
}
function toggleMenu(label) { activeMenu.value = hoverMenu.value === label ? label : activeMenu.value === label ? '' : label; hoverMenu.value = ''; }
function enterMenu(label, event) { if (event.pointerType === 'mouse' && !open.value) { activeMenu.value = label; hoverMenu.value = label; } }
function leaveMenu(event) { if (event.pointerType === 'mouse' && !open.value) { activeMenu.value = ''; hoverMenu.value = ''; } }
async function focusMenu(label, last = false) {
  activeMenu.value = label; hoverMenu.value = '';
  await nextTick();
  const links = document.getElementById(`menu-${label}`)?.querySelectorAll('a');
  links?.[last ? links.length - 1 : 0]?.focus();
}
function moveMenu(event) {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
  const links = [...event.currentTarget.querySelectorAll('a')];
  const index = links.indexOf(document.activeElement);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
  event.preventDefault(); links[next]?.focus();
}
function outside(event) {
  const target = event.target;
  if (!target.closest('.space-nav-group')) { activeMenu.value = ''; hoverMenu.value = ''; }
  if (!target.closest('.space-search')) searchOpen.value = false;
}
function focusOutside(event) {
  if (event.target.closest('.space-nav-group')?.dataset.menuLabel !== activeMenu.value) { activeMenu.value = ''; hoverMenu.value = ''; }
  if (!event.target.closest('.space-search')) searchOpen.value = false;
}
function onEscape(event) {
  if (event.key !== 'Escape' || !(activeMenu.value || open.value || searchOpen.value)) return;
  const trigger = open.value ? toggle.value : activeMenu.value ? document.querySelector(`[aria-controls="menu-${activeMenu.value}"]`) : null;
  closeMenus(); trigger?.focus();
}
watch(() => route.fullPath, closeMenus);
watch(musicExpanded, value => { if (value) closeMenus(); });
watch(open, value => { if (value) musicExpanded.value = false; });
watch(softTone, value => {
  document.documentElement.dataset.warmTone = value ? 'soft' : 'light';
  try { localStorage.setItem('peanora:warm-tone:v1', value ? 'soft' : 'light'); } catch { /* Keep tone for this visit. */ }
});
onMounted(() => {
  try { softTone.value = localStorage.getItem('peanora:warm-tone:v1') === 'soft'; } catch { /* Keep default. */ }
  window.addEventListener('keydown', onEscape);
  document.addEventListener('pointerdown', outside);
  document.addEventListener('focusin', focusOutside);
});
onUnmounted(() => { window.removeEventListener('keydown', onEscape); document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', focusOutside); });
</script>
<template>
  <header class="site-header space-header">
    <RouterLink to="/" class="space-wordmark" :aria-label="`${site.name} 首页`"><svg class="space-brand-leaf" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 27C15 17 7 17 5 8c8-1 15 5 13 13M16 27c0-9 0-18 10-20 3 8-2 16-10 16M9 12l7 13m7-13-6 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg><span>{{ site.name }}</span></RouterLink>
    <button v-if="open" class="space-menu-backdrop" aria-label="关闭导航遮罩" @click="closeMenus"></button>
    <nav id="site-navigation" class="space-nav" :class="{ 'is-open': open }" aria-label="主要导航">
      <div class="space-mobile-nav-heading"><span>{{ site.name }}</span><button aria-label="关闭导航菜单" @click="closeMenus">×</button></div>
      <button v-if="route.path === '/'" class="space-nav-item space-home-sidebar-entry" :aria-expanded="homeSidebarOpen" aria-controls="home-sidebar" @click="showHomeSidebar"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>个人侧栏</button>
      <div v-for="menu in menus" :key="menu.label" class="space-nav-group" :data-menu-label="menu.label" @pointerenter="enterMenu(menu.label, $event)" @pointerleave="leaveMenu">
        <RouterLink v-if="menu.path" :to="menu.path" class="space-nav-item"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="menu.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ menu.label }}</RouterLink>
        <button v-else class="space-nav-item" :aria-expanded="activeMenu === menu.label" :aria-controls="`menu-${menu.label}`" @click="toggleMenu(menu.label)" @keydown.down.prevent="focusMenu(menu.label)" @keydown.up.prevent="focusMenu(menu.label, true)"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="menu.icon" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ menu.label }}<svg class="space-nav-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke="currentColor" stroke-width="1.5" /></svg></button>
        <div v-if="menu.children" v-show="activeMenu === menu.label" :id="`menu-${menu.label}`" class="space-nav-dropdown" @keydown="moveMenu"><template v-for="item in menu.children" :key="item.label"><a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer">{{ item.label }} <span aria-hidden="true">↗</span></a><RouterLink v-else :to="item.path" @click="closeMenus">{{ item.label }}</RouterLink></template></div>
      </div>
    </nav>
    <div class="space-header-actions">
      <form class="space-search" role="search" @submit.prevent="findNotes"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10" cy="10" r="6.5" stroke="currentColor" stroke-width="1.8" /><path d="m15 15 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg><input v-model="search" type="search" aria-label="搜索学习笔记" placeholder="搜索" @focus="searchOpen = true" @input="searchOpen = true" /><div v-if="searchOpen && search.trim()" class="space-search-results"><RouterLink v-for="note in results" :key="note.id" :to="`/unity-notes/${note.id}`"><strong>{{ note.title }}</strong><small>{{ note.category }}</small></RouterLink><p v-if="!results.length">没有找到相关笔记</p><button type="submit">查看全部搜索结果</button></div></form>
      <button class="space-icon-button space-music-toggle music-toggle" :aria-expanded="musicExpanded" aria-label="打开听歌面板" title="音乐" aria-controls="music-panel" @click="showMusic"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18V5l11-2v12M9 8l11-2M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm11-3a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg></button>
      <button class="space-icon-button space-content-jump" aria-label="浏览正文" title="浏览正文" @click="scrollToContent"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7Z" fill="currentColor" /></svg></button>
      <WallpaperPicker />
      <button class="space-icon-button space-tone-toggle" :aria-pressed="softTone" aria-label="切换柔和米黄色" title="切换米黄色深浅" @click="softTone = !softTone"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7" /><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg></button>
      <button ref="toggle" class="space-menu-toggle" :aria-expanded="open" aria-controls="site-navigation" :aria-label="open ? '关闭导航菜单' : '打开导航菜单'" @click="open = !open"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg></button>
    </div>
  </header>
</template>
