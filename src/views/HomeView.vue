<script setup>
import { site } from "../data/site";
import ThemeEntrance from "../components/content/ThemeEntrance.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
useScrollReveal();
</script>
<template>
  <div class="home-view shell">
    <section class="home-hero" aria-label="Peanora">
      <h1 class="display hero-name" tabindex="-1">{{ site.nickname }}</h1>
      <RouterLink
        :to="{ hash: '#chapters' }"
        class="hero-scroll"
        aria-label="浏览两个主题"
        ><span aria-hidden="true">↓</span></RouterLink
      >
    </section>
    <section
      id="chapters"
      class="home-chapters"
      tabindex="-1"
      aria-label="个人世界与音乐回忆"
    >
      <ThemeEntrance
        v-for="theme in site.themes"
        :key="theme.path"
        :theme="theme"
      />
    </section>
    <section class="home-little" data-reveal>
      <span class="eyebrow">03 / 个人小角落</span
      ><RouterLink to="/little-things" class="home-little-link"
        ><span class="display">Little Things</span
        ><span aria-hidden="true">↗</span></RouterLink
      >
      <p class="muted">一些文字，一点收藏。</p>
    </section>
  </div>
</template>
