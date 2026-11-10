<script setup>
import { computed, provide } from 'vue';
import { useRoute } from 'vue-router';
import { site } from '../../data/site';
import { appearance } from '../../data/appearance';
import { contentDocument, editingContent } from '../../content/store';
import { contentImage } from '../../content/assets';
import { pageItems } from '../../content/pages';
import { unityEntries } from '../../content/unityNotes';
import { safeLink } from '../../content/model';
import { useMusicPlayer } from '../../composables/useMusicPlayer';
import ContentText from '../content/ContentText.vue';
import SpaceCalendar from './SpaceCalendar.vue';
import MusicPlayer from '../ui/MusicPlayer.vue';
import '../../styles/home-sidebar.css';

defineProps({ side: { type: String, default: 'left' }, compact: Boolean });
provide('content-page', 'home');
const route = useRoute();
const cover = computed(() => contentDocument.value.pages.home.blocks.find(block => block.type === 'homeCover')?.data);
const profile = computed(() => contentDocument.value.pages.world.blocks.find(block => block.type === 'profile' && !block.hidden)?.data);
const notes = computed(() => unityEntries(contentDocument.value));
const songs = computed(() => pageItems(contentDocument.value, 'music', 'songs').filter(song => !song.isPlaceholder));
const albums = computed(() => contentDocument.value.pages.music.blocks.filter(block => !block.hidden && block.type === 'songs' && block.data.items.some(song => !song.isPlaceholder)));
const littleNotes = computed(() => pageItems(contentDocument.value, 'little', 'notes').filter(note => !note.rare).slice(0, 2));
const categories = computed(() => {
  const counts = new Map();
  for (const note of notes.value) if (note.category) counts.set(note.category, (counts.get(note.category) || 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count }));
});
const socials = computed(() => (cover.value?.socials || profile.value?.socials || site.socials)
  .map(link => ({ ...link, url: safeLink(link.url) })).filter(link => link.url));
const { expanded } = useMusicPlayer();
function openMusic() { expanded.value = true; }

const icons = {
  github: 'M9 19c-4.3 1.2-4.3-2-6-2.5M15 22v-3.3a3 3 0 0 0-.8-2.3c2.7-.3 5.6-1.3 5.6-6a4.7 4.7 0 0 0-1.3-3.3 4.3 4.3 0 0 0-.1-3.3s-1-.3-3.4 1.3a11.3 11.3 0 0 0-6 0C6.6 3.5 5.6 3.8 5.6 3.8a4.3 4.3 0 0 0-.1 3.3A4.7 4.7 0 0 0 4.2 10c0 4.7 2.9 5.7 5.6 6a3 3 0 0 0-.8 2.3V22',
  external: 'M14 3h7v7M21 3 10 14M10 3H3v18h18v-7',
  world: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  music: 'M9 18V5l11-2v12M9 8l11-2M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm11-3a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  note: 'M5 3h14v18H5V3Zm4 5h6M9 12h6M9 16h4',
  categories: 'M3 5h7l2 2h9v13H3V5Z',
  albums: 'M4 4h16v16H4V4Zm12 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
};
</script>

<template>
  <aside class="space-sidebar firefly-sidebar" :class="[`space-sidebar-${side}`, { 'space-sidebar-home': compact && side === 'left' }]" :aria-label="side === 'left' ? compact ? 'Peanora、公告、音乐、分类与标签' : '关于 Peanora 与笔记分类' : '小角落与内容统计'">
    <template v-if="side === 'left'">
      <section class="space-panel space-profile firefly-profile">
        <RouterLink to="/world" class="space-avatar-link" aria-label="认识 Peanora">
          <img :src="contentImage(cover?.avatar || 'artwork:avatar')" :style="{ objectPosition: appearance.avatarPosition }" alt="Peanora 使用的二次元头像" width="248" height="248" decoding="async" />
        </RouterLink>
        <ContentText v-if="editingContent && route.path === '/'" tag="h2" plain :value="cover?.portraitNote || site.nickname" block-id="cover" field="portraitNote" />
        <h2 v-else>{{ cover?.portraitNote || profile?.name || site.nickname }}</h2>
        <span class="space-profile-rule" aria-hidden="true"></span>
        <ContentText class="firefly-profile-bio" :value="cover?.welcome || ''" />
        <div class="space-profile-socials firefly-socials">
          <a v-for="link in socials" :key="link.url" :href="link.url" target="_blank" rel="noopener noreferrer" :aria-label="link.label" :title="link.label">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="link.url.includes('github.com') ? icons.github : icons.external" /></svg>
          </a>
          <RouterLink to="/world" aria-label="我的个人世界" title="我的个人世界"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="icons.world" /></svg></RouterLink>
          <button v-if="songs.length" type="button" aria-label="打开听歌面板" title="打开听歌面板" @click="openMusic"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="icons.music" /></svg></button>
          <RouterLink to="/little-things" aria-label="小角落" title="小角落"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="icons.note" /></svg></RouterLink>
        </div>
      </section>

      <section class="space-panel firefly-widget firefly-announcement">
        <h2 class="space-widget-title">公告</h2>
        <ContentText tag="p" class="firefly-announcement-welcome" :value="cover?.welcome || ''" />
        <p v-if="cover?.signatures?.length" class="firefly-announcement-signature">{{ cover.signatures[0] }}</p>
        <RouterLink to="/world" class="space-widget-more">了解更多 <span aria-hidden="true">›</span></RouterLink>
      </section>

      <MusicPlayer />

      <div class="firefly-sidebar-sticky">
      <section v-if="categories.length" class="space-panel firefly-widget space-category-widget">
        <h2 class="space-widget-title">分类</h2>
        <ul><li v-for="item in categories" :key="item.name"><RouterLink :to="{ path: '/unity-notes', query: { category: item.name } }"><span>{{ item.name }}</span><span class="space-category-count">{{ item.count }}</span></RouterLink></li></ul>
        <RouterLink to="/unity-notes" class="space-widget-more">全部分类 <span aria-hidden="true">›</span></RouterLink>
      </section>

      <section v-if="profile?.interests?.length" class="space-panel firefly-widget firefly-tags">
        <h2 class="space-widget-title">标签</h2>
        <div class="firefly-tag-list"><RouterLink v-for="interest in profile.interests" :key="interest" to="/world#about">{{ interest }}</RouterLink></div>
      </section>
      </div>
    </template>

    <template v-else>
      <section v-if="littleNotes.length" class="space-panel firefly-widget firefly-moments">
        <h2 class="space-widget-title">小角落</h2>
        <div class="firefly-moment-list">
          <article v-for="note in littleNotes" :key="note.id" class="firefly-moment">
            <p v-if="note.source" class="firefly-moment-source"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="icons.note" /></svg>{{ note.source }}</p>
            <ContentText tag="p" class="firefly-moment-text" :value="note.text" />
          </article>
        </div>
        <RouterLink to="/little-things" class="space-widget-more"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="icons.note" /></svg>更多纸条 <span aria-hidden="true">›</span></RouterLink>
      </section>

      <section class="space-panel firefly-widget firefly-stats">
        <h2 class="space-widget-title">内容统计</h2>
        <dl>
          <div><dt><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="icons.note" /></svg>笔记</dt><dd>{{ notes.length }}</dd></div>
          <div><dt><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="icons.categories" /></svg>分类</dt><dd>{{ categories.length }}</dd></div>
          <div><dt><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="icons.music" /></svg>歌曲</dt><dd>{{ songs.length }}</dd></div>
          <div><dt><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path :d="icons.albums" /></svg>专辑</dt><dd>{{ albums.length }}</dd></div>
        </dl>
      </section>

      <section v-if="profile?.learning?.length" class="space-panel firefly-widget space-learning-widget">
        <h2 class="space-widget-title">正在学习</h2>
        <ul><li v-for="item in profile.learning" :key="item.title"><span class="space-learning-dot" aria-hidden="true"></span><span>{{ item.title }}</span></li></ul>
        <RouterLink to="/world#about" class="space-widget-more">更多关于我 <span aria-hidden="true">›</span></RouterLink>
      </section>
      <SpaceCalendar />
    </template>
  </aside>
</template>
