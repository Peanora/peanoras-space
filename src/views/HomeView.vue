<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import OriginalHome from '../components/home/OriginalHome.vue';
import { contentDocument, editingContent } from '../content/store';
import { unityEntries } from '../content/unityNotes';

const articlesPerPage = 6;
const route = useRoute();
const articleFeed = ref(null);
const articles = computed(() => unityEntries(contentDocument.value)
  .sort((a, b) => (b.date || '').localeCompare(a.date || '')));
const pageCount = computed(() => Math.ceil(articles.value.length / articlesPerPage));
const currentPage = computed(() => {
  const requestedPage = route.query.page;
  if (typeof requestedPage !== 'string' || !/^[1-9]\d*$/.test(requestedPage)) return 1;
  return Math.min(Number(requestedPage), Math.max(1, pageCount.value));
});
const pageArticles = computed(() => {
  const start = (currentPage.value - 1) * articlesPerPage;
  return articles.value.slice(start, start + articlesPerPage);
});

function articlePageLocation(page) {
  const query = { ...route.query };
  if (page === 1) delete query.page;
  else query.page = String(page);
  return { path: '/', query, hash: '#home-articles' };
}

watch(() => route.query.page, () => {
  if (route.hash === '#home-articles') articleFeed.value?.focus({ preventScroll: true });
}, { flush: 'post' });

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
      <ul v-if="pageArticles.length" class="home-articles-list">
        <li v-for="note in pageArticles" :key="note.id">
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
      <nav v-if="pageCount > 1" class="home-articles-pagination" aria-label="文章分页">
        <RouterLink v-if="currentPage > 1" :to="articlePageLocation(currentPage - 1)" :aria-current-value="null">上一页</RouterLink>
        <button v-else type="button" disabled>上一页</button>
        <RouterLink v-for="number in pageCount" :key="number" :to="articlePageLocation(number)"
          :aria-label="`第 ${number} 页`" :aria-current-value="number === currentPage ? 'page' : null">{{ number }}</RouterLink>
        <RouterLink v-if="currentPage < pageCount" :to="articlePageLocation(currentPage + 1)" :aria-current-value="null">下一页</RouterLink>
        <button v-else type="button" disabled>下一页</button>
      </nav>
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
.home-articles-pagination { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; margin-top: 20px; }
.home-articles-pagination a, .home-articles-pagination button { display: inline-grid; place-items: center; min-width: 40px; min-height: 44px; padding: 6px 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); color: var(--accent); font-size: 14px; }
.home-articles-pagination a:hover { background: var(--accent-soft); }
.home-articles-pagination a[aria-current="page"] { border-color: var(--accent); background: var(--accent); color: var(--surface); font-weight: 700; }
.home-articles-pagination button:disabled { opacity: .55; cursor: default; }

@media (min-width: 1440px) {
  /* The last page can still align beneath the fixed header when only a few cards remain. */
  .home-articles:has(.home-articles-pagination) { min-height: calc(100dvh - 100px); }
}
@media (max-width: 767px) {
  .home-articles { padding-inline: 8px; }
  .home-article-link { padding-inline: 16px; }
  .home-articles-pagination a, .home-articles-pagination button { min-width: 36px; padding-inline: 6px; }
}
</style>
