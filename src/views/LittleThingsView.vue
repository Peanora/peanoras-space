<script setup>
import { computed, defineAsyncComponent, onMounted, provide } from "vue";
import { contentDocument, isContentPreview } from "../content/store";
import { littleNotes, loadLittleNotes } from "../content/littleNotes.js";
import { useSiteAccount } from "../composables/useSiteAccount.js";
import ContentText from "../components/content/ContentText.vue";
import ContentBlock from "../components/content/ContentBlock.vue";
provide("content-page", "little");
const page = computed(() => contentDocument.value.pages.little);
const account = !isContentPreview.value && useSiteAccount().state;
const LittleNoteEditor = defineAsyncComponent(() => import('../components/content/LittleNoteEditor.vue'));
const blocks = computed(() => page.value.blocks.map(block => block.type === 'notes' && !block.hidden && !isContentPreview.value
  ? { ...block, data: { ...block.data, items: littleNotes.value } }
  : block));
const canEdit = computed(() => account?.user && account.isOwner && blocks.value.some(block => block.type === 'notes' && !block.hidden));
onMounted(loadLittleNotes);
</script>
<template>
  <div class="shell little-view">
    <header class="page-heading">
      <ContentText tag="p" class="eyebrow" :value="page.eyebrow" block-id="__page" field="eyebrow" />
      <ContentText tag="h1" class="display" tabindex="-1" :value="page.title" block-id="__page" field="title" />
    </header>
    <LittleNoteEditor v-if="canEdit" :key="account.user.id" />
    <ContentBlock v-for="block in blocks" :key="block.id" :block="block" />
  </div>
</template>
