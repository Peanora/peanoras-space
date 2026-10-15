<script setup>
import { ref, computed } from "vue";
import ContentText from "./ContentText.vue";
import { isContentPreview } from "../../content/store";
const props = defineProps({ data: Object, blockId: String });
const littleThings = computed(() => props.data.items);
import { useLocalFavorites } from "../../composables/useLocalFavorites";

const currentId = ref(littleThings.value[0]?.id);
const current = computed(() => littleThings.value.find((item) => item.id === currentId.value) || littleThings.value[0]);
const currentIndex = computed(() => littleThings.value.indexOf(current.value));
const announcement = ref("");
const noteOpen = ref(false);
const { favorites, toggle, storageNotice } = useLocalFavorites(
  () => littleThings.value.map((item) => item.id),
  { persist: !isContentPreview.value },
);
const saved = computed(() =>
  favorites.value
    .map((id) => littleThings.value.find((item) => item.id === id))
    .filter(Boolean),
);
const isSaved = computed(
  () => !!current.value && favorites.value.includes(current.value.id),
);
function nextText() {
  const candidates = littleThings.value.filter(
    (item) =>
      item.id !== current.value?.id && (!item.rare || Math.random() < 0.04),
  );
  currentId.value = (candidates[Math.floor(Math.random() * candidates.length)] || current.value)?.id;
  announcement.value = "";
}
function toggleCurrent() {
  if (!current.value) return;
  const wasSaved = isSaved.value;
  toggle(current.value.id);
  announcement.value = wasSaved ? "已取消收藏。" : "已加入收藏。";
}
function removeSaved(id) {
  toggle(id);
  announcement.value = "已移除这条收藏。";
}
</script>
<template>
  <div>
    <section v-if="current" class="little-paper" aria-label="随机文字">
      <ContentText tag="span" class="eyebrow" :value="data.eyebrow" :block-id="blockId" field="eyebrow" />
      <div class="quote-area" aria-live="polite" aria-atomic="true">
        <Transition name="quote" mode="out-in"
          ><ContentText tag="blockquote" :key="current.id" :value="current.text" :block-id="blockId" :field="`items.${currentIndex}.text`" /></Transition
        >
      </div>
      <ContentText tag="span" class="quote-source" :value="current.source" :block-id="blockId" :field="`items.${currentIndex}.source`" />
      <div class="little-actions">
        <button class="plain-button" @click="nextText">
          {{ data.nextLabel }} <span aria-hidden="true">↻</span></button
        ><button
          class="plain-button save-button"
          :aria-pressed="isSaved"
          @click="toggleCurrent"
        >
          <span aria-hidden="true">{{ isSaved ? "−" : "+" }}</span>
          {{ isSaved ? data.savedLabel : data.saveLabel }}
        </button>
      </div>
    </section>
    <ContentText v-else tag="p" class="empty-note" :value="data.emptyText" :block-id="blockId" field="emptyText" />
    <p class="action-notice" role="status">
      {{ storageNotice || announcement }}
    </p>
    <section class="favorites-section" :aria-labelledby="`${blockId}-favorites-title`">
      <div class="section-heading">
        <ContentText tag="h2" :id="`${blockId}-favorites-title`" class="display" :value="data.favoritesHeading" :block-id="blockId" field="favoritesHeading" />
        <span class="muted small">{{ data.favoritesLabel }} / {{ saved.length }}</span>
      </div>
      <ContentText tag="p" class="small muted" :value="data.favoritesHint" :block-id="blockId" field="favoritesHint" />
      <ul v-if="saved.length" class="favorites-list">
        <li v-for="item in saved" :key="item.id">
          <ContentText tag="p" :value="item.text" :block-id="blockId" :field="`items.${littleThings.indexOf(item)}.text`" />
          <button
            class="remove-favorite"
            :aria-label="`移除收藏：${item.text}`"
            @click="removeSaved(item.id)"
          >
            移除 <span aria-hidden="true">×</span>
          </button>
        </li>
      </ul>
      <ContentText v-else tag="p" class="empty-note" :value="data.emptyFavorites" :block-id="blockId" field="emptyFavorites" />
    </section>
    <div class="margin-note">
      <button
        class="margin-note-toggle"
        :aria-expanded="noteOpen"
        aria-controls="margin-note-content"
        @click="noteOpen = !noteOpen"
      >
        {{ data.marginLabel }} <span aria-hidden="true">{{ noteOpen ? "−" : "+" }}</span>
      </button>
      <ContentText v-if="noteOpen" tag="p" id="margin-note-content" :value="data.marginText" :block-id="blockId" field="marginText" />
    </div>
  </div>
</template>
