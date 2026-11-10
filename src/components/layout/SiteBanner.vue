<script setup>
import { computed, provide } from 'vue';
import { useRoute } from 'vue-router';
import { contentDocument, editingContent, publishEditorEvent } from '../../content/store';
import { useAppearance } from '../../composables/useAppearance';
import { useAmbientMotion } from '../../composables/useAmbientMotion';
import ArtworkImage from '../ui/ArtworkImage.vue';
import SignatureTypewriter from '../ui/SignatureTypewriter.vue';
import ContentText from '../content/ContentText.vue';
provide('content-page', 'home');
const route = useRoute();
const isHome = computed(() => route.path === '/');
const cover = computed(() => contentDocument.value.pages.home.blocks.find(block => block.type === 'homeCover')?.data);
const { wallpaper } = useAppearance();
const { still, reduced } = useAmbientMotion();
function selectCover() { if (isHome.value) publishEditorEvent({ type: 'select', pageId: 'home', blockId: 'cover' }); }
</script>
<template>
  <section id="cover" class="space-banner" :class="{ 'is-still': still }" aria-label="空间封面">
    <ArtworkImage class="space-banner-art" :src="wallpaper.src" sizes="100vw" background alt="" fetchpriority="high" :style="{ objectPosition: wallpaper.position }" />
    <div class="space-banner-shade" aria-hidden="true"></div>
    <div class="space-banner-copy" @pointerdown="selectCover">
      <ContentText v-if="isHome" tag="h1" plain class="space-banner-title" tabindex="-1" :value="cover?.name" block-id="cover" field="name" />
      <p v-else class="space-banner-title">{{ cover?.name }}</p>
      <ContentText v-if="isHome" tag="p" class="space-banner-welcome" :value="cover?.welcome" block-id="cover" field="welcome" />
      <ContentText v-else tag="p" class="space-banner-welcome" :value="cover?.welcome" />
      <ContentText v-if="editingContent && isHome && cover?.signatures?.length" tag="p" plain class="space-banner-signature" :value="cover.signatures[0]" block-id="cover" field="signatures.0" />
      <SignatureTypewriter v-else :phrases="cover?.signatures || []" :paused="still" :reduced="reduced" />
      <a v-if="isHome" class="space-banner-entry" href="#world"><ContentText tag="span" plain :value="cover?.entry" block-id="cover" field="entry" /><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg></a>
    </div>
    <div class="space-banner-wave" aria-hidden="true"><svg viewBox="0 0 1440 64" preserveAspectRatio="none"><path d="M0 30C230 73 330 5 590 29S1110 70 1440 12V64H0Z" fill="currentColor" /></svg></div>
  </section>
</template>
