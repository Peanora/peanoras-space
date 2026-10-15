<script setup>
import { computed } from "vue";
import { contentDocument } from "../content/store";
import ContentBlock from "../components/content/ContentBlock.vue";
import ContentText from "../components/content/ContentText.vue";
import SectionNavigation from "../components/ui/SectionNavigation.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
useScrollReveal();
const page = computed(() => contentDocument.value.pages.world);
const sections = computed(() => page.value.blocks.filter((block) => !block.hidden && block.navLabel).map((block) => ({ label: block.navLabel, hash: `#${block.id}` })));
</script>
<template>
  <div class="shell world-view">
    <header class="page-heading">
      <ContentText tag="p" class="eyebrow" :value="page.eyebrow" block-id="__page" field="eyebrow" />
      <ContentText tag="h1" class="display" tabindex="-1" :value="page.title" block-id="__page" field="title" />
      <SectionNavigation :items="sections" />
    </header>
    <ContentBlock v-for="block in page.blocks" :key="block.id" :block="block" />
    <nav class="next-chapter" aria-label="继续浏览">
      <span class="eyebrow">NEXT / 音乐与回忆</span
      ><RouterLink to="/music" class="display"
        >Music & Memories <span aria-hidden="true">↗</span></RouterLink
      >
    </nav>
  </div>
</template>
