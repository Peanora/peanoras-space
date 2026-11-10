<script setup>
import { computed, nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { contentDocument, editingContent, publishEditorEvent, selectedContentBlock } from '../../content/store';
import { contentImage } from '../../content/assets';
import { pageItems } from '../../content/pages';
import { unityEntries } from '../../content/unityNotes';
import { useAmbientMotion } from '../../composables/useAmbientMotion';
import { useThemePager } from '../../composables/useThemePager';
import ContentText from '../content/ContentText.vue';
import HomeScene from '../content/HomeScene.vue';
import '../../styles/home-themes.css';

provide('content-page', 'home');
const route = useRoute();
const { still, reduced } = useAmbientMotion();
const root = ref(null), viewport = ref(null);
const themes = computed(() => contentDocument.value.pages.home.blocks
  .filter(block => block.type === 'homeTheme' && (!block.hidden || editingContent.value))
  .map(block => ({ ...block.data, id: block.id, image: block.data.image ? contentImage(block.data.image) : '' })));
const {
  current, direction, moving, transitionDuration, goTo, finishMove,
  onWheel, onKeydown, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, onClickCapture,
} = useThemePager({
  root, viewport, count: computed(() => themes.value.length),
  getTopOffset: () => window.matchMedia('(max-width: 767px)').matches ? 78 : 88,
  onBoundary: (step, { source }) => {
    if (source !== 'keyboard') {
      const target = step > 0 ? document.getElementById('main-content') : document.querySelector('#cover h1');
      target?.focus({ preventScroll: true });
    } else if (step > 0) showFeed();
    else {
      document.getElementById('cover')?.scrollIntoView({ behavior: reduced.value ? 'auto' : 'smooth' });
      document.querySelector('#cover h1')?.focus({ preventScroll: true });
    }
  },
});
function showFeed() {
  const feed = document.getElementById('main-content');
  feed?.scrollIntoView({ block: 'start', behavior: reduced.value ? 'auto' : 'smooth' });
  feed?.focus({ preventScroll: true });
}
async function revealTheme(id) {
  const index = themes.value.findIndex(theme => theme.id === id);
  if (index < 0) return;
  goTo(index, { force: true, focus: false, align: false });
  await nextTick();
  document.getElementById(id)?.scrollTo({ top: 0 });
}
function homeAnchor(event) { revealTheme(String(event.detail || '').replace(/^#/, '')); }
function editorSelect(event) { revealTheme(event.detail); }
watch(() => route.hash, hash => revealTheme(hash.slice(1)), { immediate: true });
watch(selectedContentBlock, id => { if (editingContent.value) revealTheme(id); });
watch(current, index => {
  if (editingContent.value && themes.value[index]) publishEditorEvent({ type: 'select', pageId: 'home', blockId: themes.value[index].id });
});
onMounted(() => {
  window.addEventListener('peanora:home-anchor', homeAnchor);
  if (import.meta.env.DEV) window.addEventListener('peanora:select-home', editorSelect);
  if (editingContent.value) revealTheme(selectedContentBlock.value);
});
onUnmounted(() => {
  window.removeEventListener('peanora:home-anchor', homeAnchor);
  if (import.meta.env.DEV) window.removeEventListener('peanora:select-home', editorSelect);
});
const samples = computed(() => {
  const document = contentDocument.value;
  const note = unityEntries(document).at(-1);
  const song = pageItems(document, 'music', 'songs').find(item => !item.isPlaceholder);
  const slip = pageItems(document, 'little', 'notes').find(item => !item.rare);
  return {
    world: note && { label: 'Unity 学习笔记', text: note.title, path: `/unity-notes/${note.id}` },
    music: song && { label: song.artist, text: song.title, path: '/music#songs' },
    little: slip && { label: slip.source, text: slip.text, path: '/little-things' },
  };
});
function selectTheme(id) {
  if (editingContent.value) publishEditorEvent({ type: 'select', pageId: 'home', blockId: id });
}
</script>

<template>
  <div v-if="themes.length" ref="root" class="home-themes home-theme-pager" :class="{ 'is-still': still, 'is-single-theme': themes.length === 1 }"
    :style="{ '--theme-direction': direction }" :data-current-theme="themes[current]?.id" :data-moving="moving"
    role="region" :aria-label="themes.length > 1 ? '首页主题翻页' : '首页小角落'" :aria-roledescription="themes.length > 1 ? '主题翻页' : undefined" tabindex="0"
    @wheel="onWheel" @keydown="onKeydown" @touchstart.passive="onTouchStart" @touchmove="onTouchMove"
    @touchend.passive="onTouchEnd" @touchcancel.passive="onTouchCancel" @click.capture="onClickCapture">
    <div ref="viewport" class="home-theme-stage" :aria-busy="moving">
    <Transition v-for="(theme, index) in themes" :key="theme.id" name="theme-turn" :duration="transitionDuration" @after-enter="finishMove">
    <section v-show="index === current" :id="theme.id" class="home-theme"
      :class="[`home-theme-${theme.kind}`, { 'home-theme-selected': editingContent && selectedContentBlock === theme.id }]"
      :data-theme-active="index === current" :aria-hidden="index !== current" :inert="index !== current"
      :aria-labelledby="`home-theme-title-${theme.id}`" tabindex="-1" @pointerdown.capture="selectTheme(theme.id)">
      <div class="home-theme-copy">
        <p class="home-theme-part"><span v-if="themes.length > 1">{{ theme.number }} / </span><ContentText tag="span" plain :value="theme.subtitle" :block-id="theme.id" field="subtitle" /></p>
        <h2 :id="`home-theme-title-${theme.id}`" class="home-theme-title" tabindex="-1"><ContentText tag="span" plain :value="theme.title" :block-id="theme.id" field="title" /></h2>
        <ContentText tag="p" class="home-theme-description" :value="theme.description" :block-id="theme.id" field="description" />
        <RouterLink v-if="samples[theme.kind]" class="home-theme-excerpt" :to="samples[theme.kind].path">
          <small>{{ samples[theme.kind].label }}</small><span>{{ samples[theme.kind].text }}</span><i aria-hidden="true">↗</i>
        </RouterLink>
        <div class="home-theme-actions">
          <RouterLink :to="theme.path" class="home-theme-entry"><ContentText tag="span" plain :value="theme.action" :block-id="theme.id" field="action" /><span aria-hidden="true">↗</span></RouterLink>
          <RouterLink v-if="theme.kind === 'world'" to="/unity-notes" class="home-theme-notes-link">Unity 学习笔记 <span aria-hidden="true">↗</span></RouterLink>
        </div>
      </div>
      <HomeScene :screen="theme" />
    </section>
    </Transition>
    </div>
    <footer class="theme-pager-footer">
      <span v-if="themes.length > 1" class="theme-pager-help"><span class="theme-help-desktop">滚动翻页</span><span class="theme-help-touch">滑动翻页</span></span>
      <div v-if="themes.length > 1" class="theme-pager-controls">
        <button class="theme-pager-arrow" aria-label="上一个主题" :disabled="current === 0" @click="goTo(current - 1, { align: true })">↑</button>
        <nav class="theme-pager-index" aria-label="首页主题目录">
          <button v-for="(theme, index) in themes" :key="theme.id" :aria-current="index === current ? 'step' : undefined" :aria-controls="theme.id" :aria-label="`翻到${theme.title}`" @click="goTo(index, { align: true })"><span class="theme-pager-dot" aria-hidden="true"></span><span class="theme-label-full">{{ theme.title }}</span><span class="theme-label-short">{{ theme.shortTitle || theme.title }}</span></button>
        </nav>
        <button class="theme-pager-arrow" :aria-label="current === themes.length - 1 ? '阅读下方新内容' : '下一个主题'" @click="current === themes.length - 1 ? showFeed() : goTo(current + 1, { align: true })">↓</button>
        <span class="theme-pager-count" aria-live="polite">{{ String(current + 1).padStart(2, '0') }} / {{ String(themes.length).padStart(2, '0') }}</span>
      </div>
      <a href="#main-content" class="theme-feed-link" @click.prevent="showFeed">新内容 <span aria-hidden="true">↓</span></a>
    </footer>
  </div>
</template>
