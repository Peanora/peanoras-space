<script setup>
import { site } from "../../data/site";
const socials = site.socials.filter((link) => link.url);
</script>

<template>
  <footer class="site-footer shell">
    <RouterLink to="/" class="footer-name">{{ site.name }}</RouterLink>
    <span class="footer-note">个人世界 · 音乐与回忆</span>
    <div class="footer-socials">
      <a
        v-for="link in socials"
        :key="link.label"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
        >{{ link.label }} ↗</a
      >
      <span v-if="!socials.length" class="muted">GitHub · 待添加</span>
    </div>
  </footer>
</template>
