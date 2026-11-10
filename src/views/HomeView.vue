<script setup>
import { computed, nextTick, onMounted, onUnmounted, provide, ref } from "vue";
import { contentDocument, editingContent, publishEditorEvent, selectedContentBlock } from "../content/store";
import { contentImage } from "../content/assets";
import { pageItems } from "../content/pages";
import { unityEntries } from "../content/unityNotes";
import ContentText from "../components/content/ContentText.vue";
import HomeNotes from "../components/content/HomeNotes.vue";
import ArtworkImage from "../components/ui/ArtworkImage.vue";
import "../styles/home-feed.css";

provide("content-page", "home");
const category = ref("");
const themes = computed(() => Object.fromEntries(contentDocument.value.pages.home.blocks
  .filter(block => block.type === "homeTheme" && (!block.hidden || editingContent.value))
  .map(block => [block.data.kind, { ...block.data, id: block.id }])));
const notes = computed(() => unityEntries(contentDocument.value));
const categories = computed(() => [...new Set(notes.value.map(note => note.category).filter(Boolean))]);
const categoryCounts = computed(() => Object.fromEntries(categories.value.map(name => [name, notes.value.filter(note => note.category === name).length])));
const matchingNotes = computed(() => notes.value.filter(note => !category.value || note.category === category.value));
const previewNotes = computed(() => matchingNotes.value.slice(0, 6));
const showThemes = computed(() => !category.value || editingContent.value);
const albums = computed(() => contentDocument.value.pages.music.blocks.filter(block => !block.hidden && block.type === "songs"));
const songCount = computed(() => pageItems(contentDocument.value, "music", "songs").filter(song => !song.isPlaceholder).length);
const categoryNames = {
  "Unity工作原理": "工作原理",
  "Unity脚本基础": "脚本基础",
  "Unity重要组件和Api": "组件与 API",
  "核心系统": "核心系统",
};
const directoryLink = computed(() => category.value ? { path: "/unity-notes", query: { category: category.value } } : "/unity-notes");

function selectTheme(id) {
  if (editingContent.value) publishEditorEvent({ type: "select", pageId: "home", blockId: id });
}
function noteSummary(note) {
  return note.summary || note.sections.filter(section => section.heading).slice(0, 3).map(section => section.heading).join("、");
}
function noteArtwork(index) {
  const illustrations = [themes.value.world, themes.value.little, themes.value.music].filter(theme => theme?.image);
  return illustrations.length ? illustrations[index % illustrations.length] : undefined;
}
async function editorSelect(event) {
  category.value = "";
  await nextTick();
  document.getElementById(event.detail)?.scrollIntoView({ block: "center", behavior: "auto" });
}
async function revealHomeAnchor(event) {
  const id = String(event.detail || '').slice(1);
  if (!['cover', 'world', 'music', 'little'].includes(id)) return;
  category.value = '';
  await nextTick();
  const target = id === 'cover' ? document.querySelector('#cover h1') : document.getElementById(id);
  target?.focus({ preventScroll: true });
}
onMounted(() => {
  window.addEventListener('peanora:home-anchor', revealHomeAnchor);
  if (import.meta.env.DEV) window.addEventListener("peanora:select-home", editorSelect);
});
onUnmounted(() => {
  window.removeEventListener('peanora:home-anchor', revealHomeAnchor);
  if (import.meta.env.DEV) window.removeEventListener("peanora:select-home", editorSelect);
});
</script>

<template>
  <div class="home-feed">
    <nav class="space-panel home-feed-navigation home-note-filters" aria-label="按分类筛选首页笔记">
      <div class="home-category-scroll">
        <button class="home-feed-home" :aria-pressed="category === ''" aria-label="显示首页全部内容" @click="category = ''"><svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5v10a.5.5 0 0 1-.5.5H15v-7H9v7H3.5a.5.5 0 0 1-.5-.5v-10Z" /></svg></button>
        <button class="home-category-tab" :aria-pressed="category === ''" aria-label="全部笔记" @click="category = ''">全部 <span>{{ notes.length }}</span></button>
        <button v-for="item in categories" :key="item" class="home-category-tab" :aria-pressed="category === item" :aria-label="categoryNames[item] || item" :title="item" @click="category = item">{{ categoryNames[item] || item }} <span>{{ categoryCounts[item] }}</span></button>
      </div>
      <RouterLink :to="directoryLink" class="home-category-more">更多 <svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true"><path d="m8 5 5 5-5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg></RouterLink>
    </nav>

    <article v-if="showThemes && themes.world" :id="themes.world.id" class="space-panel home-post-card home-world-intro"
      :class="{ 'home-edit-selected': editingContent && selectedContentBlock === themes.world.id, 'home-post-no-image': !themes.world.image }"
      tabindex="-1" @pointerdown.capture="selectTheme(themes.world.id)">
      <div class="home-post-copy">
        <h2 class="home-post-title"><RouterLink :to="themes.world.path"><ContentText tag="span" plain :value="themes.world.title" :block-id="themes.world.id" field="title" /><span class="home-title-chevron" aria-hidden="true">›</span></RouterLink></h2>
        <div class="home-post-meta">
          <span class="home-post-badge home-post-pin"><svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true"><path d="M6 3h8M7 3v6l-3 3h12l-3-3V3M10 12v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>置顶</span>
          <span class="home-post-category"><svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true"><path d="M4 3h10a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V3Zm0 11h12M7 6h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg><ContentText tag="span" :value="themes.world.subtitle" :block-id="themes.world.id" field="subtitle" /></span>
        </div>
        <ContentText tag="p" class="home-post-summary" :value="themes.world.description" :block-id="themes.world.id" field="description" />
        <div class="home-post-footer">
          <ContentText v-for="(tag, index) in themes.world.tags?.slice(0, 1)" :key="index" tag="span" class="home-post-tag" :value="tag" :block-id="themes.world.id" :field="`tags.${index}`" plain />
          <RouterLink :to="themes.world.path" class="home-inline-link"><ContentText tag="span" plain :value="themes.world.action" :block-id="themes.world.id" field="action" /><span aria-hidden="true">›</span></RouterLink>
          <RouterLink to="/unity-notes" class="home-inline-link">Unity 学习笔记 <span aria-hidden="true">›</span></RouterLink>
        </div>
      </div>
      <RouterLink v-if="themes.world.image" :to="themes.world.path" class="home-post-image" aria-label="进入我的个人世界"><ArtworkImage :src="contentImage(themes.world.image)" sizes="(max-width: 767px) calc(100vw - 42px), 30vw" :alt="themes.world.alt" :style="{ objectPosition: themes.world.imagePosition }" /><span class="home-cover-note">插画</span></RouterLink>
    </article>

    <article v-if="showThemes && themes.music" :id="themes.music.id" class="space-panel home-post-card home-music-feature"
      :class="{ 'home-edit-selected': editingContent && selectedContentBlock === themes.music.id, 'home-post-no-image': !themes.music.image }"
      tabindex="-1" @pointerdown.capture="selectTheme(themes.music.id)">
      <div class="home-post-copy">
        <h2 class="home-post-title"><RouterLink :to="themes.music.path"><ContentText tag="span" plain :value="themes.music.title" :block-id="themes.music.id" field="title" /><span class="home-title-chevron" aria-hidden="true">›</span></RouterLink></h2>
        <div class="home-post-meta">
          <span class="home-post-badge home-post-pin"><svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true"><path d="M6 3h8M7 3v6l-3 3h12l-3-3V3M10 12v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>置顶</span>
          <span class="home-post-category"><svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true"><path d="M7 14V4l9-2v10M7 7l9-2M7 14a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm9-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" /></svg><ContentText tag="span" :value="themes.music.subtitle" :block-id="themes.music.id" field="subtitle" /></span>
        </div>
        <ContentText tag="p" class="home-post-summary" :value="themes.music.description" :block-id="themes.music.id" field="description" />
        <div class="home-post-footer"><span v-if="albums.length" class="home-post-tag">{{ albums.length }} 张专辑</span><span v-if="songCount" class="home-post-tag">{{ songCount }} 首歌曲</span><RouterLink :to="themes.music.path" class="home-inline-link"><ContentText tag="span" plain :value="themes.music.action" :block-id="themes.music.id" field="action" /><span aria-hidden="true">›</span></RouterLink></div>
      </div>
      <RouterLink v-if="themes.music.image" :to="themes.music.path" class="home-post-image" aria-label="进入音乐与回忆"><ArtworkImage :src="contentImage(themes.music.image)" sizes="(max-width: 767px) calc(100vw - 42px), 30vw" :alt="themes.music.alt" :style="{ objectPosition: themes.music.imagePosition }" loading="lazy" /><span class="home-cover-note">插画</span></RouterLink>
    </article>

    <section v-if="showThemes && themes.little" :id="themes.little.id" class="space-panel home-little-feature"
      :class="{ 'home-edit-selected': editingContent && selectedContentBlock === themes.little.id }"
      tabindex="-1" @pointerdown.capture="selectTheme(themes.little.id)">
      <header class="home-little-heading">
        <h2 class="home-post-title"><RouterLink :to="themes.little.path"><ContentText tag="span" plain :value="themes.little.title" :block-id="themes.little.id" field="title" /><span class="home-title-chevron" aria-hidden="true">›</span></RouterLink></h2>
        <ContentText tag="p" class="home-little-subtitle" :value="themes.little.subtitle" :block-id="themes.little.id" field="subtitle" />
        <ContentText tag="p" class="home-little-description" :value="themes.little.description" :block-id="themes.little.id" field="description" />
      </header>
      <HomeNotes />
      <footer class="home-little-footer"><RouterLink :to="themes.little.path" class="home-inline-link"><ContentText tag="span" plain :value="themes.little.action" :block-id="themes.little.id" field="action" /><span aria-hidden="true">›</span></RouterLink><span v-if="editingContent" class="muted small">纸条内容在 Little Things 中管理。</span></footer>
    </section>

    <section v-if="themes.world" id="home-unity-notes" class="home-notes-section" aria-label="Unity 学习笔记预览">
      <div class="home-note-results" aria-live="polite" aria-atomic="false">
        <article v-for="(note, index) in previewNotes" :key="note.id" class="space-panel home-post-card home-note-card" :class="{ 'home-post-no-image': !noteArtwork(index) }">
          <div class="home-post-copy">
            <h2 class="home-post-title"><RouterLink :to="`/unity-notes/${note.id}`">{{ note.title }}<span class="home-title-chevron" aria-hidden="true">›</span></RouterLink></h2>
            <div class="home-post-meta home-note-meta">
              <span v-if="note.date" class="home-post-date"><svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true"><path d="M5 2v4m10-4v4M3 8h14M4 4h12a1 1 0 0 1 1 1v12H3V5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg><time :datetime="note.date">{{ note.date }}</time></span>
              <RouterLink :to="{ path: '/unity-notes', query: { category: note.category } }" class="home-post-category"><svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true"><path d="M4 3h10a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V3Zm0 11h12M7 6h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ note.category || 'Unity 学习笔记' }}</RouterLink>
            </div>
            <p v-if="noteSummary(note)" class="home-post-summary home-note-summary">{{ noteSummary(note) }}</p>
            <div class="home-post-footer"><span class="home-post-tag home-note-tag">Unity</span><span class="home-post-tag">学习笔记</span><RouterLink :to="`/unity-notes/${note.id}`" class="home-inline-link home-note-read" :aria-label="`阅读${note.title}`">阅读笔记 <span aria-hidden="true">›</span></RouterLink></div>
          </div>
          <RouterLink v-if="noteArtwork(index)" :to="`/unity-notes/${note.id}`" class="home-post-image" :aria-label="`阅读${note.title}`"><ArtworkImage :src="contentImage(noteArtwork(index).image)" sizes="(max-width: 767px) calc(100vw - 42px), 30vw" alt="笔记配图插画，不是项目截图" :style="{ objectPosition: noteArtwork(index).imagePosition }" loading="lazy" /><span class="home-cover-note">插画</span></RouterLink>
        </article>
        <p v-if="!notes.length" class="space-panel home-note-empty">学习笔记正在整理，写好后会放在这里。</p>
        <p v-else-if="!matchingNotes.length" class="space-panel home-note-empty">当前分类没有可显示的笔记，试试其他分类。</p>
      </div>
      <RouterLink v-if="matchingNotes.length > previewNotes.length" :to="directoryLink" class="space-panel home-more-notes">查看{{ category ? '此分类的' : '全部' }} {{ matchingNotes.length }} 篇笔记 <span aria-hidden="true">›</span></RouterLink>
    </section>

  </div>
</template>
