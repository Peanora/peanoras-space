<script setup>
import { site } from '../../data/site';
const socials = site.socials.filter(link => link.url);
</script>
<template>
  <footer class="site-footer space-footer">
    <div><RouterLink to="/" class="space-footer-name">{{ site.name }}</RouterLink><p>个人世界 · 音乐与回忆</p></div>
    <div class="space-footer-links"><a v-for="link in socials" :key="link.label" :href="link.url" target="_blank" rel="noopener noreferrer">{{ link.label }}</a><a href="https://github.com/CuteLeaf/Firefly" target="_blank" rel="noopener noreferrer">布局灵感：Firefly</a></div>
  </footer>
</template>
