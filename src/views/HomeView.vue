<script setup>
import { computed, ref } from 'vue';
import OriginalHome from '../components/home/OriginalHome.vue';
import { contentDocument, editingContent } from '../content/store';
import { unityEntries } from '../content/unityNotes';

const articleFeed = ref(null);
const articles = computed(() => unityEntries(contentDocument.value)
  .sort((a, b) => (b.date || '').localeCompare(a.date || '')));

function showArticles(shouldScroll = true) {
  if (shouldScroll) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    articleFeed.value?.scrollIntoView({ block: 'start', behavior: reduced ? 'instant' : 'smooth' });
  }
  articleFeed.value?.focus({ preventScroll: true });
}
</script>

<template>
  <div class="home-page">
    <OriginalHome @show-articles="showArticles" />
    <section v-if="!editingContent" id="home-articles" ref="articleFeed" class="home-articles" aria-labelledby="home-articles-title" tabindex="-1">
      <header class="home-articles-header">
        <h2 id="home-articles-title">文章</h2>
        <RouterLink class="text-link" to="/archive">查看文章归档 <span aria-hidden="true">↗</span></RouterLink>
      </header>
      <ul v-if="articles.length" class="home-articles-list">
        <li v-for="note in articles" :key="note.id">
          <article>
            <RouterLink class="home-article-link space-panel" :to="`/unity-notes/${note.id}`" :aria-labelledby="`home-article-${note.id}`">
              <div>
                <h3 :id="`home-article-${note.id}`">{{ note.title }}</h3>
                <p v-if="note.category || note.date" class="home-article-meta">
                  <span v-if="note.category">{{ note.category }}</span>
                  <time v-if="note.date" :datetime="note.date">{{ note.date }}</time>
                </p>
                <p v-if="note.summary" class="home-article-summary">{{ note.summary }}</p>
              </div>
              <span class="home-article-arrow" aria-hidden="true">→</span>
            </RouterLink>
          </article>
        </li>
      </ul>
      <p v-else class="home-articles-empty space-panel">文章发布后会显示在这里。</p>
    </section>
  </div>
</template>

<style scoped>
.home-articles { margin-top: 16px; padding: 16px 16px 36px; }
.home-articles-header { display: flex; align-items: baseline; flex-wrap: wrap; justify-content: space-between; gap: 6px 16px; margin-bottom: 16px; }
.home-articles-header h2 { font: 700 clamp(26px, 4vw, 36px)/1.25 var(--font-display); }
.home-articles-list { display: grid; gap: 12px; margin: 0; list-style: none; }
.home-article-link { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 16px; padding: 16px 24px; border: 1px solid var(--line); transition: border-color 180ms; overflow-wrap: anywhere; }
.home-article-link h3 { font: 700 clamp(20px, 3vw, 26px)/1.35 var(--font-display); }
.home-article-link:hover, .home-article-link:focus-visible { border-color: var(--accent); }
.home-article-link:hover h3 { color: var(--accent); }
.home-article-meta { display: flex; flex-wrap: wrap; gap: 4px 12px; margin-top: 5px; color: var(--muted); font-size: 13px; }
.home-article-summary { margin-top: 6px; color: var(--text); font-size: 15px; }
.home-article-arrow { color: var(--accent); }
.home-articles-empty { padding: 20px; color: var(--muted); }

@media (max-width: 767px) {
  .home-articles { padding-inline: 8px; }
  .home-article-link { padding-inline: 16px; }
}
</style>
