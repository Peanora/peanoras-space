<script setup>
import { computed, ref } from 'vue';
import ContentText from './ContentText.vue';
import SongEntry from './SongEntry.vue';
import { editingContent } from '../../content/store';

const props = defineProps({ songs: Array, data: Object, blockId: String, collapsible: Boolean });
const expanded = ref(false);
const cover = computed(() => props.songs.find(song => song.cover));
function toggle(event) { expanded.value = event.target.open; }
function summaryClick(event) { if (editingContent.value) event.preventDefault(); }
</script>
<template>
  <component :is="collapsible ? 'details' : 'div'" :class="{ 'album-disclosure': collapsible }"
    :open="collapsible ? editingContent || expanded : undefined" @toggle="toggle">
    <component :is="collapsible ? 'summary' : 'div'" :class="{ 'album-summary': collapsible }" @click="summaryClick">
      <img v-if="collapsible && cover" class="album-cover" :src="cover.cover" :alt="cover.alt" width="230" height="230" loading="lazy" />
      <div :class="collapsible ? 'album-heading' : 'section-heading'">
        <ContentText tag="h2" class="display" :value="data.heading" :block-id="blockId" field="heading" />
        <ContentText tag="span" class="muted small" :value="data.subtitle" :block-id="blockId" field="subtitle" />
      </div>
      <span v-if="collapsible" class="album-toggle" aria-hidden="true">
        <span class="album-expand">展开 {{ songs.length }} 首</span><span class="album-collapse">收起曲目</span>
        <svg viewBox="0 0 20 20" width="20" height="20" fill="none"><path d="m5 8 5 5 5-5" stroke="currentColor" stroke-width="1.5" /></svg>
      </span>
    </component>
    <div class="collection-songs" :class="{ 'album-tracks': collapsible }">
      <SongEntry v-for="(song, index) in songs" :key="song.id" :song="song" :index="index" :block-id="blockId" />
    </div>
    <ContentText v-if="!songs.length" tag="p" class="empty-note" :value="data.emptyText" :block-id="blockId" field="emptyText" />
  </component>
</template>
