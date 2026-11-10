<script setup>
import { computed, nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { contentDocument, editingContent, publishEditorEvent, selectedContentBlock } from '../../content/store';
import { homeScreensFor, pageItems } from '../../content/selectors';
import { contentImage } from '../../content/assets';
import { unityEntries } from '../../content/unityNotes';
import { safeLink } from '../../content/model';
import { appearance } from '../../data/appearance';
import { useAppearance } from '../../composables/useAppearance';
import { useAmbientMotion } from '../../composables/useAmbientMotion';
import { useThemePager } from '../../composables/useThemePager';
import ContentText from '../content/ContentText.vue';
import HomeScene from '../content/HomeScene.vue';
import ChapterTicket from '../content/ChapterTicket.vue';
import ArtworkImage from '../ui/ArtworkImage.vue';
import SignatureTypewriter from '../ui/SignatureTypewriter.vue';
import '../../styles/original-home.css';

provide('content-page', 'home');
const route = useRoute();
const root = ref(null), viewport = ref(null), portraitBouncing = ref(false);
const { wallpaper } = useAppearance();
const { still, reduced } = useAmbientMotion();
const screens = computed(() => homeScreensFor(contentDocument.value).filter(screen => editingContent.value || !contentDocument.value.pages.home.blocks.find(block => block.id === screen.id)?.hidden));
const cover = computed(() => contentDocument.value.pages.home.blocks.find(block => block.type === 'homeCover').data);
const chapters = computed(() => screens.value.filter(screen => screen.kind !== 'cover'));
const brandWords = computed(() => {
  let index = 0;
  return String(cover.value.name).split(/\s+/).filter(Boolean).map(word => Array.from(word, letter => ({ letter, index: index++ })));
});
const social = computed(() => cover.value.socials.map(item => ({ ...item, url: safeLink(item.url) })).find(item => item.url));
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
const {
  current, direction, moving, transitionDuration, goTo, finishMove,
  onWheel, onKeydown, onTouchStart, onTouchMove, onTouchEnd, onTouchCancel, onClickCapture,
} = useThemePager({
  root, viewport, count: computed(() => screens.value.length),
  getTopOffset: () => window.matchMedia('(max-width: 767px)').matches ? 78 : 88,
  onBoundary: (_step, { source }) => {
    if (source !== 'keyboard') root.value?.focus({ preventScroll: true });
  },
});
function select(id) {
  if (editingContent.value) publishEditorEvent({ type: 'select', pageId: 'home', blockId: id });
}
async function reveal(id, focus = false) {
  const index = screens.value.findIndex(screen => screen.id === id);
  if (index < 0) return;
  goTo(index, { force: true, align: false, focus });
  await nextTick();
  const panel = document.getElementById(id);
  if (panel) panel.scrollTop = 0;
}
function homeAnchor(event) { reveal(String(event.detail || '').replace(/^#/, '')); }
function editorSelect(event) { reveal(event.detail); }
watch(() => route.hash, hash => reveal(hash.slice(1)), { immediate: true });
watch(selectedContentBlock, id => { if (editingContent.value) reveal(id); });
watch(current, index => { if (editingContent.value && screens.value[index]) select(screens.value[index].id); });
onMounted(() => {
  window.addEventListener('peanora:home-anchor', homeAnchor);
  if (import.meta.env.DEV) window.addEventListener('peanora:select-home', editorSelect);
  if (editingContent.value) reveal(selectedContentBlock.value);
});
onUnmounted(() => {
  window.removeEventListener('peanora:home-anchor', homeAnchor);
  if (import.meta.env.DEV) window.removeEventListener('peanora:select-home', editorSelect);
});
</script>

<template>
  <div ref="root" class="original-home" :class="{ 'is-still': still }" :style="{ '--direction': direction }"
    :data-current-screen="screens[current]?.id" :data-moving="moving" role="region" aria-label="首页四屏主题" tabindex="0"
    @wheel="onWheel" @keydown="onKeydown" @touchstart.passive="onTouchStart" @touchmove="onTouchMove"
    @touchend.passive="onTouchEnd" @touchcancel.passive="onTouchCancel" @click.capture="onClickCapture">
    <div ref="viewport" class="original-stage" :aria-busy="moving">
      <Transition v-for="(screen, index) in screens" :key="screen.id" name="original-screen" :duration="transitionDuration" @after-enter="finishMove">
        <section v-show="index === current" :id="screen.id" class="home-theme original-screen" :class="`screen-${screen.kind}`"
          :data-theme-active="index === current" :aria-hidden="index !== current" :inert="index !== current"
          :aria-label="screen.title" tabindex="-1" @pointerdown.capture="select(screen.id)">
          <div v-if="screen.kind === 'cover'" class="cover-layout original-screen-layout">
            <div class="cover-copy">
              <ContentText v-if="editingContent" tag="h1" plain class="home-title home-theme-title" tabindex="-1" :value="cover.name" block-id="cover" field="name" />
              <h1 v-else class="home-title home-theme-title" tabindex="-1" :aria-label="cover.name"><span aria-hidden="true"><span v-for="(word, wordIndex) in brandWords" :key="wordIndex" class="brand-word"><span v-for="letter in word" :key="letter.index" class="brand-letter" :style="{ '--letter': letter.index, '--lean': `${((letter.index % 3) - 1) * 2}deg` }"><span class="letter-float ambient-loop">{{ letter.letter }}</span></span></span></span></h1>
              <div class="cover-rule" aria-hidden="true"></div>
              <div class="cover-message">
                <ContentText tag="p" class="cover-welcome" :value="cover.welcome" block-id="cover" field="welcome" />
                <ContentText v-if="editingContent && cover.signatures.length" tag="p" plain class="cover-signature" :value="cover.signatures[0]" block-id="cover" field="signatures.0" />
                <SignatureTypewriter v-else :phrases="cover.signatures" :paused="still || current !== 0" :reduced="reduced" />
              </div>
              <button class="screen-entry cover-entry" @click="!editingContent && goTo(1, { align: false })"><ContentText tag="span" plain :value="cover.entry" block-id="cover" field="entry" /><span aria-hidden="true">↓</span></button>
            </div>
            <div class="cover-portrait">
              <figure class="cover-print"><ArtworkImage :src="wallpaper.src" sizes="(max-width: 720px) 40vw, 460px" alt="" :style="{ objectPosition: wallpaper.position }" /><figcaption>{{ wallpaper.name }}</figcaption></figure>
              <button class="portrait-photo" :class="{ 'is-bouncing': portraitBouncing }" aria-label="和 Peanora 打个招呼" @click="portraitBouncing = !reduced" @animationend.self="portraitBouncing = false">
                <img v-if="cover.avatar" :src="contentImage(cover.avatar)" :style="{ objectPosition: appearance.avatarPosition }" alt="Peanora 使用的二次元头像" width="280" height="280" fetchpriority="high" />
                <ContentText tag="span" plain class="portrait-note" :value="cover.portraitNote" block-id="cover" field="portraitNote" />
              </button>
              <svg class="portrait-sun ambient-loop" viewBox="0 0 64 64" fill="none" aria-hidden="true"><circle cx="32" cy="32" r="13" stroke="currentColor" stroke-width="3" /><path d="M32 3v10m0 38v10M3 32h10m38 0h10M11 11l7 7m28 28 7 7M11 53l7-7m28-28 7-7" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
              <svg class="portrait-thread" viewBox="0 0 240 100" fill="none" aria-hidden="true"><path d="M232 15C182 88 132 6 139 41S58 86 8 62m0 0 18-8M8 62l12 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="4 5" /></svg>
            </div>
            <nav class="chapter-shelf" aria-label="翻到主题介绍"><ChapterTicket v-for="chapter in chapters" :key="chapter.id" :chapter="chapter" :sample="samples[chapter.kind]" @click="goTo(screens.findIndex(screen => screen.id === chapter.id), { align: false })" /></nav>
          </div>
          <div v-else class="theme-screen-layout original-screen-layout">
            <div class="screen-copy">
              <p class="screen-part">{{ screen.number }} / <ContentText tag="span" plain :value="screen.subtitle" :block-id="screen.id" field="subtitle" /></p>
              <h2 class="screen-title home-theme-title" tabindex="-1"><ContentText tag="span" plain :value="screen.title" :block-id="screen.id" field="title" /></h2>
              <ContentText tag="p" class="screen-description" :value="screen.description" :block-id="screen.id" field="description" />
              <RouterLink v-if="samples[screen.kind]" class="chapter-excerpt" :to="samples[screen.kind].path"><small>{{ samples[screen.kind].label }}</small><span>{{ samples[screen.kind].text }}</span><i aria-hidden="true">↗</i></RouterLink>
              <RouterLink :to="screen.path" class="screen-entry"><ContentText tag="span" plain :value="screen.action" :block-id="screen.id" field="action" /><span aria-hidden="true">↗</span></RouterLink>
            </div>
            <HomeScene :screen="screen" />
          </div>
        </section>
      </Transition>
    </div>
    <footer class="original-pager-footer pager-bottom">
      <div class="pager-tools"><span class="pager-help"><span class="desktop-help">滚轮翻页</span><span class="touch-help">上滑翻页</span> · 顶部导航直达详情</span><a href="https://github.com/CuteLeaf/Firefly" target="_blank" rel="noopener noreferrer" class="pager-social" aria-label="顶栏与侧栏布局参考 Firefly">Firefly</a><a v-if="social" :href="social.url" target="_blank" rel="noopener noreferrer" class="pager-social">{{ social.label }} ↗</a></div>
      <div class="pager-controls">
        <button class="pager-arrow" aria-label="上一屏" :disabled="current === 0" @click="goTo(current - 1, { align: false })">↑</button>
        <nav class="screen-navigation" aria-label="首页翻页目录"><button v-for="(screen, index) in screens" :key="screen.id" :aria-current="current === index ? 'step' : undefined" :aria-controls="screen.id" :aria-label="`翻到${index === 0 ? '首页' : screen.title + '主题介绍'}`" @click="goTo(index, { align: false })"><span class="screen-dot" aria-hidden="true"></span><span class="screen-nav-full">{{ index === 0 ? '首页' : screen.title }}</span><span class="screen-nav-short">{{ index === 0 ? '首页' : screen.shortTitle }}</span></button></nav>
        <button class="pager-arrow" aria-label="下一屏" :disabled="current === screens.length - 1" @click="goTo(current + 1, { align: false })">↓</button>
        <span class="screen-count" aria-live="polite">{{ String(current + 1).padStart(2, '0') }} / {{ String(screens.length).padStart(2, '0') }}</span>
      </div>
    </footer>
  </div>
</template>
