<script setup>
import { ref, computed } from "vue";
import { site } from "../data/site";
import { appearance } from "../data/appearance";
import { homeScreens } from "../data/home";
import WallpaperPicker from "../components/ui/WallpaperPicker.vue";
import { useScreenPager } from "../composables/useScreenPager";
const stage = ref(null);
const { current, direction, goTo, finishMove, transitionDuration } =
  useScreenPager(stage, homeScreens.length);
const screen = computed(() => homeScreens[current.value]);
const brandWords = site.name.split(" ");
const social = site.socials.find((item) => item.url);
</script>
<template>
  <div
    ref="stage"
    class="home-pager"
    :style="{ '--direction': direction }"
    role="region"
    aria-label="首页主题翻页"
  >
    <h1 class="sr-only" tabindex="-1">{{ site.name }}</h1>
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
            <div class="cover-copy">
              <p
                class="home-title screen-heading"
                tabindex="-1"
                :aria-label="site.name"
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
                    >{{ letter }}</span
                  ></span
                >
              </p>
              <div class="cover-rule" aria-hidden="true"></div>
              <button class="screen-entry" @click="goTo(1)">
                翻开我的空间 <span aria-hidden="true">↓</span>
              </button>
            </div>
            <div class="cover-portrait">
              <div class="portrait-photo">
                <img
                  :src="appearance.avatar"
                  :style="{ objectPosition: appearance.avatarPosition }"
                  alt="Peanora 使用的二次元头像"
                  width="280"
                  height="280"
                  fetchpriority="high"
                />
              </div>
              <svg
                class="portrait-sun"
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
              <span class="portrait-note">Peanora</span>
            </div>
          </div>
          <div v-else class="theme-screen-layout screen-layout shell">
            <div class="screen-copy">
              <p class="eyebrow screen-part">
                {{ screen.number }} / {{ screen.subtitle }}
              </p>
              <h2 class="screen-heading screen-title" tabindex="-1">
                {{ screen.title }}
              </h2>
              <p class="screen-description">{{ screen.description }}</p>
              <p class="screen-index">{{ screen.index }}</p>
              <RouterLink :to="screen.path" class="screen-entry"
                >{{ screen.action }}
                <span aria-hidden="true">↗</span></RouterLink
              >
            </div>
            <figure class="screen-artwork">
              <div class="artwork-tape" aria-hidden="true"></div>
              <RouterLink
                :to="screen.path"
                :aria-label="screen.action"
                class="screen-art-link"
                ><img
                  :src="screen.image"
                  :alt="screen.alt"
                  :style="{ objectPosition: screen.imagePosition }"
                  width="1000"
                  height="640"
                  draggable="false"
                /><span class="artwork-open" aria-hidden="true"
                  >↗</span
                ></RouterLink
              >
              <figcaption>
                <span>{{ screen.artworkNote }}</span
                ><span>插画壁纸</span>
              </figcaption>
            </figure>
          </div>
        </section>
      </Transition>
    </div>
    <div class="pager-bottom shell">
      <div class="pager-tools">
        <WallpaperPicker /><span class="pager-help"
          ><span class="desktop-help">滚轮翻页</span
          ><span class="touch-help">上滑翻页</span> · 点击目录也可以</span
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
        <nav class="screen-navigation" aria-label="首页屏幕目录">
          <button
            v-for="(item, index) in homeScreens"
            :key="item.id"
            :aria-current="current === index ? 'step' : undefined"
            :aria-label="`切换到${item.title}`"
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
