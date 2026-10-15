<script setup>
import { computed, provide } from "vue";
import { contentDocument } from "../content/store";
import ContentText from "../components/content/ContentText.vue";
import ContentBlock from "../components/content/ContentBlock.vue";
import SectionNavigation from "../components/ui/SectionNavigation.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
provide("content-page", "music");
const page = computed(() => contentDocument.value.pages.music);
const sections = computed(() => page.value.blocks.filter((block) => !block.hidden && block.navLabel).map((block) => ({ label: block.navLabel, hash: '#' + block.id })));
useScrollReveal();
</script>
<template>
  <div class="shell music-view">
    <header class="page-heading">
      <ContentText tag="p" class="eyebrow" :value="page.eyebrow" block-id="__page" field="eyebrow" />
      <h1 class="display" tabindex="-1">
        <ContentText tag="span" :value="page.titleFirst" block-id="__page" field="titleFirst" /><br /><ContentText tag="span" class="title-indent" :value="page.titleLast" block-id="__page" field="titleLast" />
      </h1>
      <SectionNavigation :items="sections" />
    </header>
    <ContentBlock v-for="block in page.blocks" :key="block.id" :block="block" />
    <ContentText tag="p" class="music-disclaimer" :value="page.disclaimer" block-id="__page" field="disclaimer" />
    <nav class="next-chapter" aria-label="继续浏览">
      <span class="eyebrow">NEXT / 我的个人世界</span
      ><RouterLink to="/world" class="display"
        >My World <span aria-hidden="true">↗</span></RouterLink
      >
    </nav>
  </div>
</template>
