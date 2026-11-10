<script setup>
import { computed, provide } from 'vue';
import { contentDocument } from '../../content/store';
import NotesCollection from './NotesCollection.vue';

// The same notes are shown on both pages. Home editing only changes its own theme fields.
provide('content-page', 'little');
const notes = computed(() => contentDocument.value.pages.little.blocks.find(block => block.type === 'notes' && !block.hidden));
</script>

<template>
  <div v-if="notes" class="home-notes-paper">
    <NotesCollection :data="notes.data" :block-id="notes.id" readonly />
  </div>
</template>
