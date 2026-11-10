<script setup>
import { computed, provide } from 'vue';
import { contentDocument, editingContent, publishEditorEvent, selectedContentBlock } from '../../content/store';
import { contentImage } from '../../content/assets';
import { pageItems } from '../../content/pages';
import { unityEntries } from '../../content/unityNotes';
import { useAmbientMotion } from '../../composables/useAmbientMotion';
import ContentText from '../content/ContentText.vue';
import HomeScene from '../content/HomeScene.vue';
import '../../styles/home-themes.css';

provide('content-page', 'home');
const { still } = useAmbientMotion();
const themes = computed(() => contentDocument.value.pages.home.blocks
  .filter(block => block.type === 'homeTheme' && (!block.hidden || editingContent.value))
  .map(block => ({ ...block.data, id: block.id, image: block.data.image ? contentImage(block.data.image) : '' })));
const samples = computed(() => {
  const document = contentDocument.value;
  const note = unityEntries(document).at(-1);
  const song = pageItems(document, 'music', 'songs').find(item => !item.isPlaceholder);
  const slip = pageItems(document, 'little', 'notes').find(item => !item.rare);
  return {
    world: note && { label: 'Unity 学习笔记', text: note.title, path: `/unity-notes/${note.id}` },
    music: song && { label: song.artist, text: song.title, path: '/music#songs' },
    little: slip && { label: slip.source, text: slip.text, path: '/little-things' },
  };
});
function selectTheme(id) {
  if (editingContent.value) publishEditorEvent({ type: 'select', pageId: 'home', blockId: id });
}
</script>

<template>
  <div class="home-themes" :class="{ 'is-still': still }" aria-label="首页主题介绍">
    <section v-for="theme in themes" :id="theme.id" :key="theme.id" class="home-theme"
      :class="[`home-theme-${theme.kind}`, { 'home-theme-selected': editingContent && selectedContentBlock === theme.id }]"
      :aria-labelledby="`home-theme-title-${theme.id}`" tabindex="-1" @pointerdown.capture="selectTheme(theme.id)">
      <div class="home-theme-copy">
        <p class="home-theme-part"><span>{{ theme.number }} / </span><ContentText tag="span" plain :value="theme.subtitle" :block-id="theme.id" field="subtitle" /></p>
        <h2 :id="`home-theme-title-${theme.id}`" class="home-theme-title"><ContentText tag="span" plain :value="theme.title" :block-id="theme.id" field="title" /></h2>
        <ContentText tag="p" class="home-theme-description" :value="theme.description" :block-id="theme.id" field="description" />
        <RouterLink v-if="samples[theme.kind]" class="home-theme-excerpt" :to="samples[theme.kind].path">
          <small>{{ samples[theme.kind].label }}</small><span>{{ samples[theme.kind].text }}</span><i aria-hidden="true">↗</i>
        </RouterLink>
        <div class="home-theme-actions">
          <RouterLink :to="theme.path" class="home-theme-entry"><ContentText tag="span" plain :value="theme.action" :block-id="theme.id" field="action" /><span aria-hidden="true">↗</span></RouterLink>
          <RouterLink v-if="theme.kind === 'world'" to="/unity-notes" class="home-theme-notes-link">Unity 学习笔记 <span aria-hidden="true">↗</span></RouterLink>
        </div>
      </div>
      <HomeScene :screen="theme" />
    </section>
  </div>
</template>
