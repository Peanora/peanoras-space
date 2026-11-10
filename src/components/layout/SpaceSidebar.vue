<script setup>
import { computed, provide } from 'vue';
import { useRoute } from 'vue-router';
import { site } from '../../data/site';
import { appearance } from '../../data/appearance';
import { contentDocument, editingContent } from '../../content/store';
import { contentImage } from '../../content/assets';
import { pageItems } from '../../content/pages';
import { unityEntries } from '../../content/unityNotes';
import ContentText from '../content/ContentText.vue';
import { safeLink } from '../../content/model';
defineProps({ side: { type: String, default: 'left' } });
provide('content-page', 'home');
const route = useRoute();
const cover = computed(() => contentDocument.value.pages.home.blocks.find(block => block.type === 'homeCover')?.data);
const profile = computed(() => contentDocument.value.pages.world.blocks.find(block => block.type === 'profile' && !block.hidden)?.data);
const notes = computed(() => unityEntries(contentDocument.value));
const songCount = computed(() => pageItems(contentDocument.value, 'music', 'songs').filter(song => !song.isPlaceholder).length);
const categories = computed(() => {
  const counts = new Map();
  for (const note of notes.value) if (note.category) counts.set(note.category, (counts.get(note.category) || 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count }));
});
const socials = computed(() => (profile.value?.socials || site.socials).map(link => ({ ...link, url: safeLink(link.url) })).filter(link => link.url));
const navigation = site.navigation.filter(item => item.path !== '/').map(item => ({ ...item, label: item.sidebarLabel || item.label }));
</script>
<template>
  <aside class="space-sidebar" :class="`space-sidebar-${side}`" :aria-label="side === 'left' ? '关于 Peanora' : '浏览分类'">
    <template v-if="side === 'left'">
      <section class="space-panel space-profile">
        <RouterLink to="/world" class="space-avatar-link" aria-label="认识 Peanora"><img :src="contentImage(cover?.avatar || 'artwork:avatar')" :style="{ objectPosition: appearance.avatarPosition }" alt="Peanora 使用的二次元头像" width="180" height="180" /></RouterLink>
        <ContentText v-if="editingContent && route.path === '/'" tag="h2" plain :value="cover?.portraitNote || site.nickname" block-id="cover" field="portraitNote" />
        <h2 v-else>{{ cover?.portraitNote || profile?.name || site.nickname }}</h2>
        <span class="space-profile-rule" aria-hidden="true"></span>
        <ContentText v-if="profile?.introduction" class="space-profile-intro" :value="profile.introduction" />
        <div v-if="profile?.interests?.length" class="space-profile-interests"><span v-for="interest in profile.interests" :key="interest">{{ interest }}</span></div>
        <div class="space-profile-counts"><RouterLink to="/unity-notes"><strong>{{ notes.length }}</strong><span>学习笔记</span></RouterLink><RouterLink to="/music"><strong>{{ songCount }}</strong><span>收藏歌曲</span></RouterLink></div>
        <div class="space-profile-socials"><a v-for="link in socials" :key="link.label" :href="link.url" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 19c-4.3 1.2-4.3-2-6-2.5M15 22v-3.3a3 3 0 0 0-.8-2.3c2.7-.3 5.6-1.3 5.6-6a4.7 4.7 0 0 0-1.3-3.3 4.3 4.3 0 0 0-.1-3.3s-1-.3-3.4 1.3a11.3 11.3 0 0 0-6 0C6.6 3.5 5.6 3.8 5.6 3.8a4.3 4.3 0 0 0-.1 3.3A4.7 4.7 0 0 0 4.2 10c0 4.7 2.9 5.7 5.6 6a3 3 0 0 0-.8 2.3V22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ link.label }}</a></div>
      </section>
      <nav class="space-panel space-side-nav" aria-label="空间导览"><h2 class="space-widget-title">空间导览</h2><RouterLink v-for="item in navigation" :key="item.path" :to="item.path" :class="{ 'is-active': route.path.startsWith(item.path) }"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="item.icon" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg><span>{{ item.label }}</span><span class="space-side-chevron" aria-hidden="true">›</span></RouterLink></nav>
    </template>
    <template v-else>
      <section v-if="categories.length" class="space-panel space-category-widget"><h2 class="space-widget-title">笔记分类</h2><ul><li v-for="item in categories" :key="item.name"><RouterLink :to="{ path: '/unity-notes', query: { category: item.name } }"><span>{{ item.name }}</span><span class="space-category-count">{{ item.count }}</span></RouterLink></li></ul><RouterLink to="/unity-notes" class="space-widget-more">全部笔记 <span aria-hidden="true">›</span></RouterLink></section>
      <section v-if="profile?.learning?.length" class="space-panel space-learning-widget"><h2 class="space-widget-title">正在学习</h2><ul><li v-for="item in profile.learning" :key="item.title"><span class="space-learning-dot" aria-hidden="true"></span><span>{{ item.title }}</span></li></ul><RouterLink to="/world#about" class="space-widget-more">更多关于我 <span aria-hidden="true">›</span></RouterLink></section>
      <section class="space-panel space-music-widget"><svg class="space-mini-record" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="29" fill="currentColor"/><circle cx="32" cy="32" r="20" fill="none" stroke="var(--surface)" stroke-opacity=".2"/><circle cx="32" cy="32" r="12" fill="var(--apricot)"/><circle cx="32" cy="32" r="3" fill="var(--surface)"/></svg><h2>Music & Memories</h2><p>喜欢的歌，慢慢收藏。</p><RouterLink to="/music" class="space-widget-more">去音乐角落 <span aria-hidden="true">›</span></RouterLink></section>
    </template>
  </aside>
</template>
