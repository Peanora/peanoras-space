<script setup>
import { computed, provide } from "vue";
import { contentDocument } from "../content/store";
import ContentText from "../components/content/ContentText.vue";
import ContentBlock from "../components/content/ContentBlock.vue";
provide("content-page", "little");
const page = computed(() => contentDocument.value.pages.little);
</script>
<template>
  <div class="shell little-view">
    <header class="page-heading">
      <ContentText tag="p" class="eyebrow" :value="page.eyebrow" block-id="__page" field="eyebrow" />
      <ContentText tag="h1" class="display" tabindex="-1" :value="page.title" block-id="__page" field="title" />
    </header>
    <ContentBlock v-for="block in page.blocks" :key="block.id" :block="block" />
  </div>
</template>
