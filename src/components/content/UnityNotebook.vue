<script setup>
import { computed } from 'vue';
import { contentDocument } from '../../content/store';
import { unityEntries } from '../../content/unityNotes';
import ContentText from './ContentText.vue';
defineProps({ data: Object, blockId: String });
const notes = computed(() => unityEntries(contentDocument.value));
const latest = computed(() => notes.value.reduce((current,note)=>!current || note.date >= current.date ? note : current,null));
</script>
<template>
  <div class="unity-notebook">
    <div class="unity-book-spine" aria-hidden="true"></div>
    <div class="unity-book-copy">
      <ContentText tag="h2" class="display" :value="data.heading" :block-id="blockId" field="heading" />
      <ContentText tag="p" class="unity-subtitle" :value="data.subtitle" :block-id="blockId" field="subtitle" />
      <ContentText class="body-copy" :value="data.description" :block-id="blockId" field="description" />
      <p v-if="latest" class="unity-latest">最新书页 · {{ latest.title }}</p>
      <RouterLink to="/unity-notes" class="text-link">翻开学习手册 <span aria-hidden="true">↗</span></RouterLink>
    </div>
    <div class="unity-book-art" aria-hidden="true"><span class="unity-book-tab">Unity</span><span class="unity-book-symbol">{ }</span><span class="unity-book-rule"></span><span>Notes & little discoveries</span></div>
  </div>
</template>
