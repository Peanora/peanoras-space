<script setup>
import { computed, nextTick, onMounted, onUnmounted, provide, ref } from "vue";
import { contentDocument, editingContent, publishEditorEvent, selectedContentBlock } from "../content/store";
import { contentImage } from "../content/assets";
import { pageItems } from "../content/pages";
import { unityEntries } from "../content/unityNotes";
import ContentText from "../components/content/ContentText.vue";
import ArtworkImage from "../components/ui/ArtworkImage.vue";
import "../styles/home-feed.css";

provide("content-page", "home");
const category = ref("");
const themes = computed(() => Object.fromEntries(contentDocument.value.pages.home.blocks
  .filter(block => block.type === "homeTheme" && (!block.hidden || editingContent.value))
  .map(block => [block.data.kind, { ...block.data, id: block.id }])));
const notes = computed(() => unityEntries(contentDocument.value));
const categories = computed(() => [...new Set(notes.value.map(note => note.category).filter(Boolean))]);
const matchingNotes = computed(() => notes.value.filter(note => !category.value || note.category === category.value));
const previewNotes = computed(() => matchingNotes.value.slice(0, 6));
const albums = computed(() => contentDocument.value.pages.music.blocks
  .filter(block => !block.hidden && block.type === "songs")
  .map(block => ({ ...block, cover: block.data.items.find(song => song.cover), artist: block.data.items.find(song => song.artist)?.artist })));
const quote = computed(() => pageItems(contentDocument.value, "little", "notes").find(note => !note.rare));
const categoryNames = {
  "Unity工作原理": "工作原理",
  "Unity脚本基础": "脚本基础",
  "Unity重要组件和Api": "组件与 API",
  "核心系统": "核心系统",
};

function selectTheme(id) {
  if (editingContent.value) publishEditorEvent({ type: "select", pageId: "home", blockId: id });
}
function noteSummary(note) {
  return note.summary || note.sections.filter(section => section.heading).slice(0, 3).map(section => section.heading).join("、");
}
async function editorSelect(event) {
  await nextTick();
  document.getElementById(event.detail)?.scrollIntoView({ block: "center", behavior: "auto" });
}
onMounted(() => {
  if (import.meta.env.DEV) window.addEventListener("peanora:select-home", editorSelect);
});
onUnmounted(() => {
  if (import.meta.env.DEV) window.removeEventListener("peanora:select-home", editorSelect);
});
</script>

<template>
  <div class="home-feed">
    <nav class="space-panel home-feed-navigation" aria-label="首页内容导航">
      <a v-if="themes.world" href="#world">个人世界</a>
      <a v-if="themes.music" href="#music">音乐与回忆</a>
      <a v-if="themes.world && notes.length" href="#home-unity-notes">学习笔记 <span>{{ notes.length }}</span></a>
      <a v-if="themes.little" href="#little">小角落</a>
    </nav>

    <section v-if="themes.world" :id="themes.world.id" class="space-panel home-world-intro"
      :class="{ 'home-edit-selected': editingContent && selectedContentBlock === themes.world.id }"
      tabindex="-1" @pointerdown.capture="selectTheme(themes.world.id)">
      <div class="home-world-copy">
        <ContentText tag="p" class="home-section-subtitle" :value="themes.world.subtitle" :block-id="themes.world.id" field="subtitle" />
        <ContentText tag="h2" class="home-section-title" :value="themes.world.title" :block-id="themes.world.id" field="title" plain />
        <ContentText tag="p" class="home-section-description" :value="themes.world.description" :block-id="themes.world.id" field="description" />
        <RouterLink :to="themes.world.path" class="home-inline-link">
          <ContentText tag="span" :value="themes.world.action" :block-id="themes.world.id" field="action" />
          <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true"><path d="m8 5 5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </RouterLink>
      </div>
      <figure v-if="themes.world.image" class="home-world-art">
        <ArtworkImage :src="contentImage(themes.world.image)" sizes="(max-width: 600px) 120px, 230px" :alt="themes.world.alt" :style="{ objectPosition: themes.world.imagePosition }" loading="lazy" />
        <figcaption>主题插画</figcaption>
      </figure>
    </section>

    <section v-if="themes.music" :id="themes.music.id" class="space-panel home-music-feature"
      :class="{ 'home-edit-selected': editingContent && selectedContentBlock === themes.music.id }"
      tabindex="-1" @pointerdown.capture="selectTheme(themes.music.id)">
      <header class="home-section-header">
        <div>
          <ContentText tag="p" class="home-section-subtitle" :value="themes.music.subtitle" :block-id="themes.music.id" field="subtitle" />
          <ContentText tag="h2" class="home-section-title" :value="themes.music.title" :block-id="themes.music.id" field="title" plain />
        </div>
        <svg class="home-music-mark" viewBox="0 0 32 32" width="32" height="32" fill="none" aria-hidden="true"><path d="M12 23V8l15-3v15M12 12l15-3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /><ellipse cx="7.5" cy="24" rx="4.5" ry="3.5" stroke="currentColor" stroke-width="1.7" /><ellipse cx="22.5" cy="21" rx="4.5" ry="3.5" stroke="currentColor" stroke-width="1.7" /></svg>
      </header>
      <ContentText tag="p" class="home-section-description" :value="themes.music.description" :block-id="themes.music.id" field="description" />
      <div v-if="albums.length" class="home-albums">
        <RouterLink v-for="album in albums" :key="album.id" :to="`/music#${album.id}`" class="home-album">
          <img v-if="album.cover" :src="contentImage(album.cover.cover)" :alt="album.cover.alt" width="160" height="160" loading="lazy" />
          <div class="home-album-copy">
            <p v-if="album.artist" class="home-album-artist">{{ album.artist }}</p>
            <ContentText tag="h3" :value="album.data.heading" />
            <p class="home-album-count">{{ album.data.items.length }} 首歌曲</p>
            <span class="home-album-action">查看专辑 <span aria-hidden="true">›</span></span>
          </div>
        </RouterLink>
      </div>
      <RouterLink :to="themes.music.path" class="home-inline-link home-music-link">
        <ContentText tag="span" :value="themes.music.action" :block-id="themes.music.id" field="action" />
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true"><path d="m8 5 5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </RouterLink>
    </section>

    <section v-if="themes.world" id="home-unity-notes" class="home-notes-section" aria-labelledby="home-notes-title">
      <header class="home-notes-heading">
        <div><h2 id="home-notes-title">Unity Notes</h2><p>Unity 学习笔记</p></div>
        <RouterLink to="/unity-notes" class="home-inline-link">全部 {{ notes.length }} 篇 <span aria-hidden="true">›</span></RouterLink>
      </header>
      <div v-if="notes.length" class="space-panel home-note-filters" role="group" aria-label="按分类筛选首页笔记">
        <button :aria-pressed="category === ''" @click="category = ''">全部</button>
        <button v-for="item in categories" :key="item" :aria-pressed="category === item" :title="item" @click="category = item">{{ categoryNames[item] || item }}</button>
      </div>
      <div class="home-note-results" aria-live="polite" aria-atomic="false">
        <article v-for="note in previewNotes" :key="note.id" class="space-panel home-note-card">
          <div class="home-note-meta"><span>{{ note.category || 'Unity 学习笔记' }}</span><time v-if="note.date" :datetime="note.date">{{ note.date }}</time></div>
          <h3><RouterLink :to="`/unity-notes/${note.id}`">{{ note.title }}</RouterLink></h3>
          <p v-if="noteSummary(note)" class="home-note-summary">{{ noteSummary(note) }}</p>
          <div class="home-note-footer"><span class="home-note-tag">Unity</span><RouterLink :to="`/unity-notes/${note.id}`" class="home-note-read" :aria-label="`阅读${note.title}`">阅读笔记 <span aria-hidden="true">›</span></RouterLink></div>
        </article>
        <p v-if="!notes.length" class="space-panel home-note-empty">学习笔记正在整理，写好后会放在这里。</p>
      </div>
      <RouterLink v-if="matchingNotes.length > previewNotes.length" to="/unity-notes" class="space-panel home-more-notes">前往笔记目录，查看全部 {{ notes.length }} 篇 <span aria-hidden="true">›</span></RouterLink>
    </section>

    <section v-if="themes.little" :id="themes.little.id" class="space-panel home-little-feature"
      :class="{ 'home-edit-selected': editingContent && selectedContentBlock === themes.little.id }"
      tabindex="-1" @pointerdown.capture="selectTheme(themes.little.id)">
      <div class="home-section-header">
        <div><ContentText tag="p" class="home-section-subtitle" :value="themes.little.subtitle" :block-id="themes.little.id" field="subtitle" /><ContentText tag="h2" class="home-section-title" :value="themes.little.title" :block-id="themes.little.id" field="title" plain /></div>
        <svg class="home-little-mark" viewBox="0 0 32 32" width="32" height="32" fill="none" aria-hidden="true"><path d="M7 5h18v17l-7 5H7V5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" /><path d="M18 27v-6h7M11 11h10M11 16h7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </div>
      <figure v-if="quote" class="home-little-quote"><blockquote><ContentText tag="p" :value="quote.text" /></blockquote><figcaption v-if="quote.source">{{ quote.source }}</figcaption></figure>
      <ContentText tag="p" class="home-section-description" :value="themes.little.description" :block-id="themes.little.id" field="description" />
      <RouterLink :to="themes.little.path" class="home-inline-link"><ContentText tag="span" :value="themes.little.action" :block-id="themes.little.id" field="action" /><svg viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true"><path d="m8 5 5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg></RouterLink>
    </section>
  </div>
</template>
