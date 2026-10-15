<script setup>
import { officialEmbedUrl, useMusicPlayer } from "../../composables/useMusicPlayer";
const { loadSong } = useMusicPlayer();
defineProps({
  song: { type: Object, required: true },
  index: { type: Number, default: 0 },
});
</script>
<template>
  <article class="song-entry" data-reveal>
    <span class="song-number eyebrow">{{
      String(index + 1).padStart(2, "0")
    }}</span>
    <div class="song-cover image-frame">
      <img
        :src="song.cover"
        :alt="song.alt"
        width="600"
        height="600"
        loading="lazy"
      /><span v-if="song.coverIsPlaceholder || song.isPlaceholder" class="image-label">占位封面</span>
    </div>
    <div class="song-copy">
      <span class="eyebrow">{{ song.artist }}</span>
      <h3>{{ song.title }}</h3>
      <p v-if="song.thought" class="body-copy">{{ song.thought }}</p>
      <span v-if="song.isPlaceholder" class="muted small">歌曲信息待补充</span>
    </div>
    <div class="song-play song-actions">
    <button v-if="officialEmbedUrl(song)" class="text-link" @click="loadSong(song)">打开播放器</button>
    <a
      v-if="song.officialUrl"
      class="text-link"
      :href="song.officialUrl"
      target="_blank"
      rel="noopener noreferrer"
      >官方播放 ↗</a
    >
    </div>
  </article>
</template>
