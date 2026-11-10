<script setup>
import { computed, provide } from 'vue';
import { useRoute } from 'vue-router';
import { sectionPages } from '../data/site';
import { contentDocument } from '../content/store';
import { unityEntries } from '../content/unityNotes';
import ContentBlock from '../components/content/ContentBlock.vue';

const route = useRoute();
const page = computed(() => sectionPages.find(item => item.kind === route.meta.section));
const articleKinds = ['archive', 'categories', 'tags', 'series'];
const isArticleIndex = computed(() => articleKinds.includes(page.value.kind));
const articleTabs = sectionPages.filter(item => articleKinds.includes(item.kind));
const notes = computed(() => unityEntries(contentDocument.value));
const categories = computed(() => [...new Set(notes.value.map(note => note.category).filter(Boolean))].map(label => ({
  label, count: notes.value.filter(note => note.category === label).length,
})));
const selectedCategory = computed(() => typeof route.query.category === 'string' ? route.query.category : '');
const filtered = computed(() => page.value.kind === 'categories' && selectedCategory.value
  ? notes.value.filter(note => note.category === selectedCategory.value) : notes.value);
const archiveGroups = computed(() => {
  const groups = new Map();
  for (const note of filtered.value) {
    // Import dates are not publication dates. Leave undated source notes
    // together instead of assigning them the current year.
    const year = /^\d{4}-\d{2}-\d{2}$/.test(note.date || '') ? note.date.slice(0, 4) : '';
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push(note);
  }
  return [...groups].sort(([a], [b]) => b.localeCompare(a)).map(([year, items]) => ({ year, items }));
});
const collectionBlocks = computed(() => {
  const source = page.value.kind === 'projects' ? contentDocument.value.pages.world : contentDocument.value.pages.music;
  const type = page.value.kind === 'projects' ? 'projects' : page.value.kind === 'albums' ? 'gallery' : '';
  return type ? source.blocks.filter(block => block.type === type && !block.hidden) : [];
});
provide('content-page', page.value.kind === 'albums' ? 'music' : 'world');
</script>

<template>
  <div class="shell section-index-view">
    <header class="section-index-heading space-panel">
      <p class="section-index-eyebrow">{{ page.label }}</p>
      <div class="section-index-title"><h1 class="display" tabindex="-1">{{ page.title }}</h1><span v-if="isArticleIndex" class="section-index-total">{{ notes.length }} 篇文章</span></div>
      <nav v-if="isArticleIndex" class="section-index-tabs" aria-label="文章目录">
        <RouterLink v-for="tab in articleTabs" :key="tab.kind" :to="tab.path" :aria-current="page.kind === tab.kind ? 'page' : undefined">{{ tab.label }}</RouterLink>
      </nav>
    </header>

    <template v-if="page.kind === 'archive' || page.kind === 'categories'">
      <nav v-if="page.kind === 'categories'" class="section-category-list space-panel" aria-label="按文章分类筛选">
        <RouterLink to="/categories" :aria-current="!selectedCategory ? 'true' : undefined"><span>全部</span><small>{{ notes.length }}</small></RouterLink>
        <RouterLink v-for="category in categories" :key="category.label" :to="{ path: '/categories', query: { category: category.label } }" :aria-current="selectedCategory === category.label ? 'true' : undefined"><span>{{ category.label }}</span><small>{{ category.count }}</small></RouterLink>
      </nav>
      <section v-for="group in archiveGroups" :key="group.year" class="section-archive-group space-panel">
        <h2>{{ group.year || '未标注日期' }} <span>{{ group.items.length }}</span></h2>
        <ol class="section-archive-list">
          <li v-for="note in group.items" :key="note.id">
            <time v-if="note.date" :datetime="note.date">{{ note.date.slice(5) }}</time>
            <span v-else class="section-archive-dot" aria-hidden="true"></span>
            <RouterLink :to="`/unity-notes/${note.id}`">{{ note.title }}</RouterLink>
            <span class="section-archive-category">{{ note.category }}</span>
          </li>
        </ol>
      </section>
      <div v-if="!filtered.length" class="section-empty space-panel"><h2>这里还没有文章</h2><p>试试其他分类，或回到完整目录看看。</p><RouterLink class="text-link" to="/archive">查看全部文章 <span aria-hidden="true">↗</span></RouterLink></div>
    </template>

    <div v-else-if="page.kind === 'tags' || page.kind === 'series'" class="section-empty space-panel">
      <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path v-if="page.kind === 'tags'" d="M8 9h18l15 15-17 17L8 25V9Zm10 8h.1" /><path v-else d="M10 8h23v31H10V8Zm5-5h23v31M16 17h11m-11 7h11m-11 7h7" /></svg>
      <h2>{{ page.kind === 'tags' ? '暂未设置文章标签' : '系列文章正在整理' }}</h2>
      <p>已发布的学习笔记可以在归档和分类中浏览。</p>
      <RouterLink class="text-link" to="/archive">去看看文章 <span aria-hidden="true">↗</span></RouterLink>
    </div>

    <template v-else>
      <ContentBlock v-for="block in collectionBlocks" :key="block.id" :block="block" />
      <div v-if="!collectionBlocks.length" class="section-empty space-panel">
        <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M8 16h12l4-5h16v28H8V16Zm8 12h16m-16 6h10" /></svg>
        <h2>{{ page.empty }}</h2>
        <RouterLink class="text-link" to="/">回到首页 <span aria-hidden="true">↗</span></RouterLink>
      </div>
    </template>
  </div>
</template>

<style scoped>
.section-index-view { display: grid; gap: 16px; padding-bottom: 30px; }
.section-index-heading { padding: 28px 32px 24px; }
.section-index-eyebrow { color: var(--muted); font-size: 14px; margin-bottom: 7px; }
.section-index-title { display: flex; align-items: center; flex-wrap: wrap; gap: 12px 18px; }
.section-index-title h1 { font-size: clamp(30px, 3vw, 42px); line-height: 1.3; }
.section-index-total { padding: 4px 10px; border-radius: 8px; background: var(--accent-soft); color: var(--accent); font-size: 13px; }
.section-index-tabs { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 22px; padding-top: 14px; border-top: 1px solid var(--line); }
.section-index-tabs a { padding: 8px 18px; border-radius: 9px; color: var(--muted); min-height: 40px; }
.section-index-tabs a:hover, .section-index-tabs a[aria-current] { background: var(--accent-soft); color: var(--accent); }
.section-category-list { display: flex; gap: 8px; flex-wrap: wrap; padding: 20px 24px; }
.section-category-list a { display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 9px; font-size: 14px; }
.section-category-list a:hover, .section-category-list a[aria-current] { background: var(--accent-soft); color: var(--accent); }
.section-category-list small { color: var(--muted); font-size: 12px; }
.section-archive-group { padding: 28px 32px; }
.section-archive-group h2 { display: flex; gap: 12px; align-items: center; font: 700 24px var(--font-body); margin-bottom: 20px; }
.section-archive-group h2 span { border-radius: 7px; font-size: 13px; padding: 3px 9px; color: var(--accent); background: var(--accent-soft); }
.section-archive-list { list-style: none; padding: 0; }
.section-archive-list li { position: relative; display: grid; grid-template-columns: 12px minmax(0, 1fr); gap: 4px 16px; padding-block: 12px; }
.section-archive-list li + li { border-top: 1px dashed var(--line); }
.section-archive-list time { grid-column: 2; font-size: 12px; color: var(--muted); }
.section-archive-list a { grid-column: 2; font-size: 17px; font-weight: 600; line-height: 1.6; overflow-wrap: anywhere; }
.section-archive-list a:hover { color: var(--accent); }
.section-archive-dot { position: absolute; top: 23px; left: 1px; width: 7px; height: 7px; border-radius: 50%; background: var(--apricot); }
.section-archive-category { grid-column: 2; font-size: 12px; color: var(--muted); }
.section-empty { padding: 52px 28px; text-align: center; }
.section-empty > svg { width: 60px; height: 60px; margin: 0 auto 20px; color: var(--accent); stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.section-empty h2 { font: 600 22px/1.6 var(--font-body); }
.section-empty p { color: var(--muted); font-size: 15px; line-height: 1.9; margin-top: 12px; }
.section-empty .text-link { display: inline-flex; gap: 14px; align-items: center; min-height: 44px; margin-top: 24px; color: var(--accent); font-size: 15px; }
@media (max-width: 540px) {
  .section-index-heading, .section-archive-group { padding: 24px 22px; }
  .section-category-list { padding: 16px; gap: 4px; }
  .section-index-tabs a { padding-inline: 15px; }
  .section-archive-list li { column-gap: 9px; }
  .section-archive-list a { font-size: 16px; }
  .section-empty { padding: 44px 24px; }
  .section-empty h2 { font-size: 20px; }
}
</style>
