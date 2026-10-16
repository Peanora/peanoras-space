<script setup>
import { ref, computed, provide, onMounted, onUnmounted, watch } from "vue";
import { contentDocument, editingContent, publishEditorEvent } from "../content/store";
import { homeScreensFor } from "../content/selectors";
import { contentImage } from "../content/assets";
import ContentText from "../components/content/ContentText.vue";
import { appearance } from "../data/appearance";
provide("content-page", "home");
const homeScreens = computed(() => homeScreensFor(contentDocument.value));
const cover = computed(() => contentDocument.value.pages.home.blocks[0].data);
import WallpaperPicker from "../components/ui/WallpaperPicker.vue";
import { useScreenPager } from "../composables/useScreenPager";
import { useAmbientMotion } from "../composables/useAmbientMotion";
import HomeScene from "../components/content/HomeScene.vue";
import SignatureTypewriter from "../components/ui/SignatureTypewriter.vue";
import ArtworkImage from "../components/ui/ArtworkImage.vue";
const stage = ref(null);
const { current, direction, goTo, finishMove, transitionDuration } =
  useScreenPager(stage, 4);
const screen = computed(() => homeScreens.value[current.value]);
watch(current, () => publishEditorEvent({ type: 'select', pageId: 'home', blockId: screen.value.id }));
const brandWords = computed(() => cover.value.name.split(" "));
const social = computed(() => cover.value.socials.find((item) => item.url));
const chapters = computed(() => homeScreens.value.slice(1));
const portraitBouncing = ref(false);
const { still, reduced } = useAmbientMotion();
function editorSelect(event) {
  const id = event.detail;
  const index = homeScreens.value.findIndex((item) => item.id === id);
  if (index >= 0) current.value = index;
}
onMounted(() => { if (import.meta.env.DEV) window.addEventListener('peanora:select-home', editorSelect); });
onUnmounted(() => { if (import.meta.env.DEV) window.removeEventListener('peanora:select-home', editorSelect); });
</script>
<template>
  <div
    ref="stage"
    class="home-pager"
    :class="{ 'is-still': still }"
    :style="{ '--direction': direction }"
    role="region"
    aria-label="首页主题翻页"
  >
    <h1 class="sr-only" tabindex="-1">{{ cover.name }}</h1>
    <div class="screen-stage">
      <Transition
        name="screen"
        mode="out-in"
        :duration="transitionDuration"
        @after-enter="finishMove"
      >
        <section
          :key="screen.id"
          class="home-screen"
          :class="`screen-${screen.kind}`"
          :aria-label="screen.title"
        >
          <div
            v-if="screen.kind === 'cover'"
            class="cover-layout screen-layout shell"
          >
            <div class="cover-copy" @pointerdown="publishEditorEvent({ type: 'select', pageId: 'home', blockId: 'cover' })">
              <p
                class="home-title screen-heading"
                tabindex="-1"
                :aria-label="cover.name"
              >
                <span
                  v-for="(word, wordIndex) in brandWords"
                  :key="wordIndex"
                  class="brand-word"
                  aria-hidden="true"
                  ><span
                    v-for="(letter, index) in [...word]"
                    :key="index"
                    class="brand-letter"
                    :style="{
                      '--letter': index + wordIndex * 9,
                      '--lean': `${((index % 3) - 1) * 2}deg`,
                    }"
                    ><span class="letter-float ambient-loop">{{
                      letter
                    }}</span></span
                  ></span
                >
              </p>
              <div class="cover-rule" aria-hidden="true"></div>
              <div class="cover-message">
                <ContentText tag="p" class="cover-welcome" :value="cover.welcome" block-id="cover" field="welcome" />
                <ContentText v-if="editingContent && cover.signatures.length" tag="p" plain class="cover-signature" :value="cover.signatures[0] || ''" block-id="cover" field="signatures.0" />
                <SignatureTypewriter v-else
                  :phrases="cover.signatures"
                  :paused="still"
                  :reduced="reduced"
                />
              </div>
              <button class="screen-entry cover-entry" @click="!editingContent && goTo(1)">
                <ContentText tag="span" plain :value="cover.entry" block-id="cover" field="entry" /> <span aria-hidden="true">↓</span>
              </button>
            </div>
            <div class="cover-portrait">
              <button
                class="portrait-photo"
                :class="{ 'is-bouncing': portraitBouncing }"
                aria-label="和 Peanora 打个招呼"
                @click="portraitBouncing = !reduced"
                @animationend.self="portraitBouncing = false"
              >
                <img
                  v-if="cover.avatar"
                  :src="contentImage(cover.avatar)"
                  :style="{ objectPosition: appearance.avatarPosition }"
                  alt="Peanora 使用的二次元头像"
                  width="280"
                  height="280"
                  fetchpriority="high"
                />
                <ContentText tag="span" plain class="portrait-note" :value="cover.portraitNote" block-id="cover" field="portraitNote" />
              </button>
              <svg
                class="portrait-sun ambient-loop"
                viewBox="0 0 64 64"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="13"
                  stroke="currentColor"
                  stroke-width="3"
                />
                <path
                  d="M32 3v10m0 38v10M3 32h10m38 0h10M11 11l7 7m28 28 7 7M11 53l7-7m28-28 7-7"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                />
              </svg>
              <svg
                class="portrait-thread"
                viewBox="0 0 240 100"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M232 15C182 88 132 6 139 41S58 86 8 62m0 0 18-8M8 62l12 15"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-dasharray="4 5"
                />
              </svg>
            </div>
            <nav class="cover-bookmarks" aria-label="翻到主题介绍">
              <button
                v-for="(chapter, index) in chapters"
                :key="chapter.id"
                :class="`bookmark-${chapter.kind}`"
                :aria-label="`翻到${chapter.bookmark}主题介绍`"
                @click="goTo(index + 1)"
              >
                <ArtworkImage v-if="chapter.image" :src="chapter.image" thumbnail alt="" width="80" height="64" />
                <span
                  ><small>翻到主题 {{ chapter.number }}</small
                  ><strong>{{ chapter.bookmark }}</strong></span
                ><span class="bookmark-arrow" aria-hidden="true">↓</span>
              </button>
            </nav>
          </div>
          <div v-else class="theme-screen-layout screen-layout shell">
            <div class="screen-copy" @pointerdown="publishEditorEvent({ type: 'select', pageId: 'home', blockId: screen.id })">
              <p class="eyebrow screen-part">
                {{ screen.number }} / <ContentText tag="span" plain :value="screen.subtitle" :block-id="screen.id" field="subtitle" />
              </p>
              <h2 class="screen-heading screen-title" tabindex="-1">
                <ContentText tag="span" plain :value="screen.title" :block-id="screen.id" field="title" />
              </h2>
              <ContentText tag="p" class="screen-description" :value="screen.description" :block-id="screen.id" field="description" />
              <ContentText tag="p" plain class="screen-index" :value="screen.index" :block-id="screen.id" field="index" />
              <RouterLink :to="screen.path" class="screen-entry"
                ><ContentText tag="span" plain :value="screen.action" :block-id="screen.id" field="action" />
                <span aria-hidden="true">↗</span></RouterLink
              >
            </div>
            <HomeScene :key="screen.id" :screen="screen" />
          </div>
        </section>
      </Transition>
    </div>
    <div class="pager-bottom shell">
      <div class="pager-tools">
        <WallpaperPicker /><span class="pager-help"
          ><span class="desktop-help">滚轮翻页</span
          ><span class="touch-help">上滑翻页</span> · 顶部导航直达详情</span
        ><a
          v-if="social"
          :href="social.url"
          target="_blank"
          rel="noopener noreferrer"
          class="pager-social"
          >{{ social.label }} ↗</a
        >
      </div>
      <div class="pager-controls">
        <button
          class="pager-arrow"
          :disabled="current === 0"
          aria-label="上一屏"
          @click="goTo(current - 1)"
        >
          ↑
        </button>
        <nav class="screen-navigation" aria-label="首页翻页目录">
          <button
            v-for="(item, index) in homeScreens"
            :key="item.id"
            :aria-current="current === index ? 'step' : undefined"
            :aria-label="`翻到${index === 0 ? '首页' : item.title + '主题介绍'}`"
            @click="goTo(index)"
          >
            <span class="screen-dot" aria-hidden="true"></span
            ><span class="screen-nav-full">{{
              index === 0 ? "首页" : item.title
            }}</span
            ><span class="screen-nav-short">{{ item.shortTitle }}</span>
          </button>
        </nav>
        <button
          class="pager-arrow"
          :disabled="current === homeScreens.length - 1"
          aria-label="下一屏"
          @click="goTo(current + 1)"
        >
          ↓
        </button>
        <span class="screen-count" aria-live="polite"
          >{{ String(current + 1).padStart(2, "0") }} /
          {{ String(homeScreens.length).padStart(2, "0") }}</span
        >
      </div>
    </div>
  </div>
</template>
