<script setup>
import { computed, nextTick, onMounted, onUnmounted, provide, ref } from "vue";
import { contentDocument } from "../content/store";
import { unityEntries } from "../content/unityNotes";
import "../styles/home-feed.css";

provide("content-page", "home");
const category = ref("");
const notes = computed(() => unityEntries(contentDocument.value));
const categories = computed(() => [...new Set(notes.value.map(note => note.category).filter(Boolean))]);
const categoryCounts = computed(() => Object.fromEntries(categories.value.map(name => [name, notes.value.filter(note => note.category === name).length])));
const matchingNotes = computed(() => notes.value.filter(note => !category.value || note.category === category.value));
const previewNotes = computed(() => matchingNotes.value.slice(0, 6));
const categoryNames = {
  "Unity工作原理": "工作原理",
  "Unity脚本基础": "脚本基础",
  "Unity重要组件和Api": "组件与 API",
  "核心系统": "核心系统",
};
const directoryLink = computed(() => category.value ? { path: "/unity-notes", query: { category: category.value } } : "/unity-notes");

function noteSummary(note) {
  return note.summary || note.sections.filter(section => section.heading).slice(0, 3).map(section => section.heading).join("、");
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

    <section id="home-unity-notes" class="home-notes-section" aria-label="Unity 学习笔记预览">
      <div class="home-note-results" aria-live="polite" aria-atomic="false">
        <article v-for="note in previewNotes" :key="note.id" class="space-panel home-post-card home-note-card home-post-no-image">
          <div class="home-post-copy">
            <h2 class="home-post-title"><RouterLink :to="`/unity-notes/${note.id}`">{{ note.title }}<span class="home-title-chevron" aria-hidden="true">›</span></RouterLink></h2>
            <div class="home-post-meta home-note-meta">
              <span v-if="note.date" class="home-post-date"><svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true"><path d="M5 2v4m10-4v4M3 8h14M4 4h12a1 1 0 0 1 1 1v12H3V5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg><time :datetime="note.date">{{ note.date }}</time></span>
              <RouterLink :to="{ path: '/unity-notes', query: { category: note.category } }" class="home-post-category"><svg viewBox="0 0 20 20" fill="none" width="16" height="16" aria-hidden="true"><path d="M4 3h10a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V3Zm0 11h12M7 6h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ note.category || 'Unity 学习笔记' }}</RouterLink>
            </div>
            <p v-if="noteSummary(note)" class="home-post-summary home-note-summary">{{ noteSummary(note) }}</p>
            <div class="home-post-footer"><span class="home-post-tag home-note-tag">Unity</span><span class="home-post-tag">学习笔记</span><RouterLink :to="`/unity-notes/${note.id}`" class="home-inline-link home-note-read" :aria-label="`阅读${note.title}`">阅读笔记 <span aria-hidden="true">›</span></RouterLink></div>
          </div>
        </article>
        <p v-if="!notes.length" class="space-panel home-note-empty">学习笔记正在整理，写好后会放在这里。</p>
        <p v-else-if="!matchingNotes.length" class="space-panel home-note-empty">当前分类没有可显示的笔记，试试其他分类。</p>
      </div>
      <RouterLink v-if="matchingNotes.length > previewNotes.length" :to="directoryLink" class="space-panel home-more-notes">查看{{ category ? '此分类的' : '全部' }} {{ matchingNotes.length }} 篇笔记 <span aria-hidden="true">›</span></RouterLink>
    </section>

  </div>
</template>
