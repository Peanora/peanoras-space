<script setup>
import { computed, provide } from 'vue';
import { useRoute } from 'vue-router';
import { contentDocument, editingContent, publishEditorEvent } from '../../content/store';
import { useAppearance } from '../../composables/useAppearance';
import { useAmbientMotion } from '../../composables/useAmbientMotion';
import ArtworkImage from '../ui/ArtworkImage.vue';
import SignatureTypewriter from '../ui/SignatureTypewriter.vue';
import ContentText from '../content/ContentText.vue';
import { safeLink } from '../../content/model';
provide('content-page', 'home');
const route = useRoute();
const isHome = computed(() => route.path === '/');
const cover = computed(() => contentDocument.value.pages.home.blocks.find(block => block.type === 'homeCover')?.data);
const social = computed(() => cover.value?.socials.map(item => ({ ...item, url: safeLink(item.url) })).find(item => item.url));
const { wallpaper } = useAppearance();
const { still, reduced } = useAmbientMotion();
function selectCover() { if (editingContent.value && isHome.value) publishEditorEvent({ type: 'select', pageId: 'home', blockId: 'cover' }); }
</script>
<template>
  <section id="cover" class="space-banner" :class="{ 'is-still': still }" aria-label="空间封面">
    <ArtworkImage class="space-banner-art" :src="wallpaper.src" sizes="100vw" background alt="" fetchpriority="high" :style="{ objectPosition: wallpaper.position }" />
    <div class="space-banner-shade" aria-hidden="true"></div>
    <div v-if="isHome" class="space-banner-copy" @pointerdown="selectCover">
      <ContentText tag="h1" plain class="space-banner-title" tabindex="-1" :value="cover?.name" block-id="cover" field="name" />
      <ContentText tag="p" class="space-banner-welcome" :value="cover?.welcome" block-id="cover" field="welcome" />
      <ContentText v-if="editingContent && cover?.signatures?.length" tag="p" plain class="space-banner-signature" :value="cover.signatures[0]" block-id="cover" field="signatures.0" />
      <SignatureTypewriter v-else :phrases="cover?.signatures || []" :paused="still" :reduced="reduced" />
      <nav class="space-banner-socials" aria-label="封面快捷入口"><a v-if="social" :href="social.url" target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 19c-4 1-4-2-6-2M15 22v-4c0-1-.3-1.6-.8-2 3-.4 5.8-1.5 5.8-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.3s-1-.3-3.4 1.2a11 11 0 0 0-6 0C6.8 3.2 5.8 3.5 5.8 3.5a4.3 4.3 0 0 0-.1 3.3A4.6 4.6 0 0 0 4.4 10c0 4.5 2.8 5.6 5.8 6-.5.4-.8 1-.8 2v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>{{ social.label }}</a><RouterLink to="/world" aria-label="我的个人世界" title="我的个人世界"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.6" /><path d="M4 22v-3a8 8 0 0 1 16 0v3" stroke="currentColor" stroke-width="1.6" /></svg></RouterLink><RouterLink to="/music" aria-label="音乐与回忆" title="音乐与回忆"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 3 12A5.6 5.6 0 0 1 12 5a5.6 5.6 0 0 1 9 7Z" fill="currentColor" /></svg></RouterLink><RouterLink to="/little-things" aria-label="小角落" title="小角落"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 3h14v13l-5 5H5V3Zm9 18v-5h5M8 8h8M8 12h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg></RouterLink></nav>
      <a v-if="editingContent" class="space-banner-entry" href="#world"><ContentText tag="span" plain :value="cover?.entry" block-id="cover" field="entry" /></a>
    </div>
    <div class="space-banner-wave" aria-hidden="true"><svg viewBox="0 0 1440 120" preserveAspectRatio="none"><path class="space-wave-back" d="M0 24C340 45 500 135 900 94S1240 47 1440 32V120H0Z" fill="currentColor"/><path class="space-wave-front" d="M0 45C350 60 550 144 900 102S1250 70 1440 48V120H0Z" fill="currentColor"/></svg></div>
  </section>
</template>
