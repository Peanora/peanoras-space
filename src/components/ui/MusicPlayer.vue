<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { contentDocument } from '../../content/store';
import { contentImage } from '../../content/assets';
import { safeLink } from '../../content/model';
import { musicPlatformName, officialEmbedUrl, useMusicPlayer } from '../../composables/useMusicPlayer';
import { useAmbientMotion } from '../../composables/useAmbientMotion';

const {
  expanded, activeSong, selectedSong, embedUrl, revision, loadSong, chooseSong, stop, retry,
  nativeSource, playing, currentTime, duration, volume, nativeStatus, localAudioUrl,
  setLocalAudioCatalog, attachAudio, releaseAudio, pause, seek, setVolume,
} = useMusicPlayer();
const albums = computed(() => contentDocument.value.pages.music.blocks
  .filter(block => block.type === 'songs' && !block.hidden)
  .map(block => ({ id: block.id, label: block.label, songs: block.data.items.filter(song => officialEmbedUrl(song) || localAudioUrl(song)) }))
  .filter(album => album.songs.length));
const songs = computed(() => albums.value.flatMap(album => album.songs));
const selected = computed(() => activeSong.value || selectedSong.value || songs.value.find(song => localAudioUrl(song)) || songs.value[0]);
const hasLocalAudio = computed(() => Boolean(localAudioUrl(selected.value)));
const platform = computed(() => musicPlatformName(selected.value));
const officialUrl = computed(() => safeLink(selected.value?.officialUrl));
const playlistOpen = ref(false), heading = ref(null), audioElement = ref(null), frameStatus = ref('');
const { still } = useAmbientMotion();
const nativePlaying = computed(() => Boolean(nativeSource.value && playing.value));
const playbackLabel = computed(() => hasLocalAudio.value ? nativePlaying.value ? '暂停播放' : '播放音乐' : embedUrl.value ? '停止播放' : '加载官方播放器');
let frameTimer;
function formatTime(seconds) {
  const value = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
}
function play() {
  if (hasLocalAudio.value) { if (nativePlaying.value) pause(); else loadSong(selected.value); }
  else if (embedUrl.value) stop();
  else loadSong(selected.value);
}
function step(direction) {
  if (!songs.value.length) return;
  const current = songs.value.findIndex(song => song.id === selected.value?.id);
  chooseSong(songs.value[(current + direction + songs.value.length) % songs.value.length]);
}
function collapse() {
  expanded.value = false;
  if (window.matchMedia('(max-width: 767px)').matches) document.querySelector('.space-music-toggle')?.focus();
}
function frameLoaded() {
  clearTimeout(frameTimer);
  // Cross-origin document loading cannot establish that the audio is playing.
  frameStatus.value = '请在官方播放器内点击播放。';
}
function frameFailed() {
  clearTimeout(frameTimer);
  frameStatus.value = `暂时无法加载，可以重试或前往${platform.value}收听。`;
}
watch([embedUrl, revision], ([url]) => {
  clearTimeout(frameTimer);
  frameStatus.value = url ? `正在加载${platform.value}播放器…` : '';
  if (url) frameTimer = setTimeout(() => { frameStatus.value = '加载较慢，可以重试或前往官方页面收听。'; }, 10000);
});
watch(expanded, async value => {
  if (!value) return;
  await nextTick();
  if (!window.matchMedia('(max-width: 767px)').matches) {
    document.getElementById('music-panel')?.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  heading.value?.focus({ preventScroll: true });
});
function onEscape(event) {
  if (event.key === 'Escape' && expanded.value) { event.stopPropagation(); collapse(); }
}
onMounted(async () => {
  attachAudio(audioElement.value);
  // These files live outside public/ and only the loopback Vite server serves them.
  if (import.meta.env.DEV) {
    try {
      const response = await fetch('/.local-audio/catalog.json', { cache: 'no-store' });
      if (response.ok && response.headers.get('content-type')?.includes('application/json')) setLocalAudioCatalog(await response.json());
    } catch { /* Missing local music keeps the official player available. */ }
  }
});
onUnmounted(() => { clearTimeout(frameTimer); releaseAudio(); });
</script>

<template>
  <audio ref="audioElement" class="music-audio" preload="none"></audio>
  <button v-if="expanded" class="music-mobile-backdrop" aria-label="收起音乐播放器" @click="collapse"></button>
  <section v-if="selected" id="music-panel" class="space-panel firefly-widget firefly-music music-widget" :class="{ 'is-expanded': expanded, 'has-local-audio': hasLocalAudio, 'is-still': still }" aria-labelledby="music-panel-heading" @keydown="onEscape">
    <div class="music-panel-top">
      <h2 id="music-panel-heading" ref="heading" tabindex="-1" class="space-widget-title">音乐</h2>
      <button class="music-panel-close" aria-label="收起音乐播放器" @click="collapse">×</button>
    </div>
    <div class="music-track">
      <div class="music-cover" :class="{ 'is-playing': nativePlaying }">
        <img v-if="selected.cover" :src="contentImage(selected.cover)" :alt="selected.alt || `${selected.title}封面`" width="56" height="56" loading="lazy" />
        <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18V5l11-2v12M9 8l11-2M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
      </div>
      <div class="music-track-copy">
        <h3 class="music-title">{{ selected.title }}</h3>
        <p class="music-artist">{{ selected.artist }}</p>
        <div v-if="hasLocalAudio" class="music-time-volume">
          <span class="music-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
          <label class="music-volume"><span class="sr-only">音量</span><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m11 4-5 4H2v8h4l5 4V4Zm5 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></svg><input type="range" min="0" max="1" step="0.01" :value="volume" aria-label="音量" @input="setVolume($event.target.value)" /></label>
        </div>
        <p v-else class="music-platform">{{ platform }} · 官方播放器</p>
      </div>
    </div>
    <label v-if="hasLocalAudio" class="music-progress"><span class="sr-only">播放进度</span><input type="range" min="0" :max="duration || 1" step="0.1" :value="currentTime" :disabled="!duration" aria-label="播放进度" :aria-valuetext="`${formatTime(currentTime)} / ${formatTime(duration)}`" @input="seek($event.target.value)" /></label>
    <div class="music-controls">
      <button class="music-control" aria-label="停止并卸载播放器" title="停止" :disabled="!activeSong" @click="stop"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6h12v12H6Z" /></svg></button>
      <button class="music-control music-skip" aria-label="上一首" title="上一首" @click="step(-1)"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 5h3v14H5Zm14 0v14L8 12Z" /></svg></button>
      <button class="music-play-button" :aria-label="playbackLabel" :title="playbackLabel" @click="play"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path v-if="nativePlaying" d="M6 5h4v14H6Zm8 0h4v14h-4Z" /><path v-else-if="!hasLocalAudio && embedUrl" d="M6 6h12v12H6Z" /><path v-else d="m8 4 12 8-12 8Z" /></svg></button>
      <button class="music-control music-skip" aria-label="下一首" title="下一首" @click="step(1)"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 5h3v14h-3ZM5 5l11 7-11 7Z" /></svg></button>
      <button class="music-control" aria-label="选择歌曲" title="歌单" aria-controls="music-playlist" :aria-expanded="playlistOpen" @click="playlistOpen = !playlistOpen"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 6h12M3 11h9M3 16h6m10-8v11m0-11 3-1m-3 12a3 3 0 1 1-3-3c1.7 0 3 1.3 3 3Z" /></svg></button>
    </div>
    <div v-show="playlistOpen" id="music-playlist" class="music-playlist">
      <section v-for="album in albums" :key="album.id" class="music-playlist-album">
        <h3>{{ album.label }}</h3>
        <button v-for="(song, index) in album.songs" :key="song.id" :class="{ 'is-selected': selected.id === song.id }" :aria-pressed="selected.id === song.id" @click="chooseSong(song)"><span class="music-track-number">{{ String(index + 1).padStart(2, '0') }}</span><span>{{ song.title }}</span><span v-if="selected.id === song.id" aria-hidden="true">♪</span></button>
      </section>
    </div>
    <div v-if="embedUrl" class="official-player">
      <iframe :key="`${embedUrl}-${revision}`" :src="embedUrl" :title="`${platform}官方播放器：${activeSong.title}`" width="248" height="90" referrerpolicy="strict-origin-when-cross-origin" @load="frameLoaded" @error="frameFailed"></iframe>
    </div>
    <p v-if="hasLocalAudio && nativeStatus" class="music-status" role="status">{{ nativeStatus }}</p>
    <p v-else-if="embedUrl" class="music-status" role="status">{{ frameStatus }}</p>
    <p v-else-if="!hasLocalAudio" class="music-status">点击加载后，在官方播放器内播放。</p>
    <div class="music-panel-actions">
      <a v-if="officialUrl" :href="officialUrl" target="_blank" rel="noopener noreferrer">官方收听 ↗</a>
      <button v-if="activeSong" @click="retry">重试</button>
    </div>
    <p v-if="hasLocalAudio" class="music-footnote">本机试听 · 收起或换页继续播放</p>
    <p v-else-if="selected.qqSongId" class="music-footnote">完整收听以 QQ 音乐的登录及购买权限为准。</p>
  </section>
</template>
