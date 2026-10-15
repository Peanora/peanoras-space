<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import { contentDocument } from "../../content/store";
import { playableSongs } from "../../content/selectors";
import { officialEmbedUrl, useMusicPlayer } from "../../composables/useMusicPlayer";

const { expanded, activeSong, embedUrl, revision, loadSong, stop, retry } = useMusicPlayer();
const firstSong = computed(() => playableSongs(contentDocument.value).find((song) => officialEmbedUrl(song)));
const selected = computed(() => activeSong.value || firstSong.value);
const toggle = ref(null);
const heading = ref(null);
const status = ref("");
let timer;
watch(expanded, async (value) => {
  if (value) {
    await nextTick();
    heading.value?.focus({ preventScroll: true });
  }
});
watch([embedUrl, revision], ([url]) => {
  clearTimeout(timer);
  status.value = url ? "正在加载网易云播放器…" : "";
  if (url) timer = setTimeout(() => {
    status.value = "加载较慢，可以重试或前往网易云收听。";
  }, 10000);
});
function onFrameLoad() {
  clearTimeout(timer);
  // A cross-origin iframe load is not proof that this track can be played.
  status.value = "请在官方播放器内点击播放。";
}
function onFrameError() {
  clearTimeout(timer);
  status.value = "暂时无法加载，请重试或前往网易云收听。";
}
function show() {
  expanded.value = !expanded.value;
}
function collapse() {
  expanded.value = false;
  toggle.value?.focus();
}
function onEscape(event) {
  if (event.key === "Escape" && expanded.value) {
    event.stopPropagation();
    collapse();
  }
}
onUnmounted(() => clearTimeout(timer));
</script>
<template>
  <div v-if="firstSong" class="music-widget" @keydown="onEscape">
    <button ref="toggle" class="music-toggle" :aria-expanded="expanded"
      aria-controls="music-panel" @click="show">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
        <path d="M9 17V5l11-2v12M9 8l11-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <ellipse cx="6" cy="17.5" rx="3" ry="2.5" stroke="currentColor" stroke-width="1.5" />
        <ellipse cx="17" cy="15.5" rx="3" ry="2.5" stroke="currentColor" stroke-width="1.5" />
      </svg>
      听歌
    </button>
    <section v-show="expanded" id="music-panel" class="music-panel" aria-labelledby="music-panel-title">
      <div class="music-panel-top">
        <span class="eyebrow">A LITTLE MUSIC</span>
        <button class="music-panel-close" aria-label="收起音乐面板" @click="collapse">−</button>
      </div>
      <h2 id="music-panel-title" ref="heading" tabindex="-1">{{ selected.title }}</h2>
      <p class="music-artist">{{ selected.artist }} <span>· 网易云音乐</span></p>
      <div v-if="embedUrl" class="official-player">
        <iframe :key="`${activeSong.neteaseId}-${revision}`" :src="embedUrl"
          :title="`网易云音乐官方播放器：${activeSong.title}`"
          width="330" height="90" referrerpolicy="strict-origin-when-cross-origin"
          @load="onFrameLoad" @error="onFrameError"></iframe>
      </div>
      <button v-else class="music-load" @click="loadSong(selected)">
        加载官方播放器 <span aria-hidden="true">↗</span>
      </button>
      <p v-if="embedUrl" class="music-status" role="status">{{ status }}</p>
      <p v-else class="music-status">点击后加载，音乐不会自动播放。</p>
      <div class="music-panel-actions">
        <a :href="selected.officialUrl" target="_blank" rel="noopener noreferrer">网易云收听 ↗</a>
        <template v-if="embedUrl">
          <button @click="retry">重新加载</button>
          <button @click="stop">停止播放</button>
        </template>
      </div>
      <p class="music-footnote">收起面板或切换站内页面会保留播放器。若面板空白或无法播放，请前往官方页面。</p>
    </section>
  </div>
</template>
