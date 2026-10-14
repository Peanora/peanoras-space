<script setup>
import { ref, computed } from "vue";
import { littleThings } from "../data/littleThings";
import { useLocalFavorites } from "../composables/useLocalFavorites";

const current = ref(littleThings[0]);
const announcement = ref("");
const noteOpen = ref(false);
const { favorites, toggle, storageNotice } = useLocalFavorites(
  littleThings.map((item) => item.id),
);
const saved = computed(() =>
  favorites.value
    .map((id) => littleThings.find((item) => item.id === id))
    .filter(Boolean),
);
const isSaved = computed(
  () => !!current.value && favorites.value.includes(current.value.id),
);
function nextText() {
  const candidates = littleThings.filter(
    (item) =>
      item.id !== current.value.id && (!item.rare || Math.random() < 0.04),
  );
  current.value =
    candidates[Math.floor(Math.random() * candidates.length)] || current.value;
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
  <div class="shell little-view">
    <header class="page-heading">
      <p class="eyebrow">03 / 个人小角落</p>
      <h1 class="display" tabindex="-1">Little Things</h1>
    </header>
    <section v-if="current" class="little-paper" aria-label="随机文字">
      <span class="eyebrow">A SMALL NOTE</span>
      <div class="quote-area" aria-live="polite" aria-atomic="true">
        <Transition name="quote" mode="out-in"
          ><blockquote :key="current.id">
            {{ current.text }}
          </blockquote></Transition
        >
      </div>
      <span class="quote-source">{{ current.source }}</span>
      <div class="little-actions">
        <button class="plain-button" @click="nextText">
          换一句 <span aria-hidden="true">↻</span></button
        ><button
          class="plain-button save-button"
          :aria-pressed="isSaved"
          @click="toggleCurrent"
        >
          <span aria-hidden="true">{{ isSaved ? "−" : "+" }}</span>
          {{ isSaved ? "已收藏" : "收藏这句" }}
        </button>
      </div>
    </section>
    <p v-else class="empty-note">小纸条正在整理。</p>
    <p class="action-notice" role="status">
      {{ storageNotice || announcement }}
    </p>
    <section class="favorites-section" aria-labelledby="favorites-title">
      <div class="section-heading">
        <h2 id="favorites-title" class="display">Kept Here</h2>
        <span class="muted small">我的收藏 / {{ saved.length }}</span>
      </div>
      <p class="small muted">收藏保存在当前浏览器中，不会同步到其他设备。</p>
      <ul v-if="saved.length" class="favorites-list">
        <li v-for="item in saved" :key="item.id">
          <p>{{ item.text }}</p>
          <button
            class="remove-favorite"
            :aria-label="`移除收藏：${item.text}`"
            @click="removeSaved(item.id)"
          >
            移除 <span aria-hidden="true">×</span>
          </button>
        </li>
      </ul>
      <p v-else class="empty-note">
        还没有收藏。遇到喜欢的句子，可以把它留在这里。
      </p>
    </section>
    <div class="margin-note">
      <button
        class="margin-note-toggle"
        :aria-expanded="noteOpen"
        aria-controls="margin-note-content"
        @click="noteOpen = !noteOpen"
      >
        页边小记 <span aria-hidden="true">{{ noteOpen ? "−" : "+" }}</span>
      </button>
      <p v-if="noteOpen" id="margin-note-content">
        你翻到了页边。这里留一小块空白，给以后的小惊喜。
      </p>
    </div>
  </div>
</template>
