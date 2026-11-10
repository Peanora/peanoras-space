<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { contentDocument } from '../../content/store';
import { contentImage } from '../../content/assets';
import { safeLink } from '../../content/model';
import { musicPlatformName, officialEmbedUrl, useMusicPlayer } from '../../composables/useMusicPlayer';
import { useAmbientMotion } from '../../composables/useAmbientMotion';

// Material Symbols Rounded (Google) and playlist-music (Pictogrammers), Apache-2.0.
// https://github.com/google/material-design-icons / https://github.com/Templarian/MaterialDesign
const musicIcons = {
  "repeat": "m6.85 19l.85.85q.3.3.288.7t-.288.7q-.3.3-.712.313t-.713-.288L3.7 18.7q-.15-.15-.213-.325T3.426 18t.063-.375t.212-.325l2.575-2.575q.3-.3.713-.287t.712.312q.275.3.288.7t-.288.7l-.85.85H17v-3q0-.425.288-.712T18 13t.713.288T19 14v3q0 .825-.587 1.413T17 19zm10.3-12H7v3q0 .425-.288.713T6 11t-.712-.288T5 10V7q0-.825.588-1.412T7 5h10.15l-.85-.85q-.3-.3-.288-.7t.288-.7q.3-.3.712-.312t.713.287L20.3 5.3q.15.15.213.325t.062.375t-.062.375t-.213.325l-2.575 2.575q-.3.3-.712.288T16.3 9.25q-.275-.3-.288-.7t.288-.7z",
  "repeatOne": "M11.5 10.5h-.75q-.325 0-.537-.213T10 9.75t.213-.537T10.75 9H12q.425 0 .713.288T13 10v4.25q0 .325-.213.538T12.25 15t-.537-.213t-.213-.537zM6.85 19l.85.85q.3.3.288.7t-.288.7q-.3.3-.712.313t-.713-.288L3.7 18.7q-.15-.15-.213-.325T3.426 18t.063-.375t.212-.325l2.575-2.575q.3-.3.713-.287t.712.312q.275.3.288.7t-.288.7l-.85.85H17v-3q0-.425.288-.712T18 13t.713.288T19 14v3q0 .825-.587 1.413T17 19zm10.3-12H7v3q0 .425-.288.713T6 11t-.712-.288T5 10V7q0-.825.588-1.412T7 5h10.15l-.85-.85q-.3-.3-.288-.7t.288-.7q.3-.3.712-.312t.713.287L20.3 5.3q.15.15.213.325t.062.375t-.062.375t-.213.325l-2.575 2.575q-.3.3-.712.288T16.3 9.25q-.275-.3-.288-.7t.288-.7z",
  "previous": "M5.5 17V7q0-.425.288-.712T6.5 6t.713.288T7.5 7v10q0 .425-.288.713T6.5 18t-.712-.288T5.5 17m11.45-.025l-6.2-4.15q-.225-.15-.337-.362T10.3 12t.113-.462t.337-.363l6.2-4.15q.125-.1.275-.125t.275-.025q.4 0 .7.275t.3.725v8.25q0 .45-.3.725t-.7.275q-.125 0-.275-.025t-.275-.125",
  "play": "M8 17.175V6.825q0-.425.3-.713t.7-.287q.125 0 .263.037t.262.113l8.15 5.175q.225.15.338.375t.112.475t-.112.475t-.338.375l-8.15 5.175q-.125.075-.262.113T9 18.175q-.4 0-.7-.288t-.3-.712",
  "pause": "M16 19q-.825 0-1.412-.587T14 17V7q0-.825.588-1.412T16 5t1.413.588T18 7v10q0 .825-.587 1.413T16 19m-8 0q-.825 0-1.412-.587T6 17V7q0-.825.588-1.412T8 5t1.413.588T10 7v10q0 .825-.587 1.413T8 19",
  "next": "M16.5 17V7q0-.425.288-.712T17.5 6t.713.288T18.5 7v10q0 .425-.288.713T17.5 18t-.712-.288T16.5 17m-11-.875v-8.25q0-.45.3-.725t.7-.275q.125 0 .275.025t.275.125l6.2 4.15q.225.15.338.363T13.7 12t-.112.463t-.338.362l-6.2 4.15q-.125.1-.275.125t-.275.025q-.4 0-.7-.275t-.3-.725",
  "volume": "M19 11.975q0-2.075-1.1-3.787t-2.95-2.563q-.375-.175-.55-.537t-.05-.738q.15-.4.538-.575t.787 0Q18.1 4.85 19.55 7.063T21 11.974t-1.45 4.913t-3.875 3.287q-.4.175-.788 0t-.537-.575q-.125-.375.05-.737t.55-.538q1.85-.85 2.95-2.562t1.1-3.788M7 15H4q-.425 0-.712-.288T3 14v-4q0-.425.288-.712T4 9h3l3.3-3.3q.475-.475 1.088-.213t.612.938v11.15q0 .675-.612.938T10.3 18.3zm9.5-3q0 1.05-.475 1.988t-1.25 1.537q-.25.15-.513.013T14 15.1V8.85q0-.3.263-.437t.512.012q.775.625 1.25 1.575t.475 2",
  "mute": "M16.775 19.575q-.275.175-.55.325t-.575.275q-.375.175-.762 0t-.538-.575q-.15-.375.038-.737t.562-.538q.1-.05.188-.1t.187-.1L12 14.8v2.775q0 .675-.612.938T10.3 18.3L7 15H4q-.425 0-.712-.288T3 14v-4q0-.425.288-.712T4 9h2.2L2.1 4.9q-.275-.275-.275-.7t.275-.7t.7-.275t.7.275l17 17q.275.275.275.7t-.275.7t-.7.275t-.7-.275zm2.225-7.6q0-2.075-1.1-3.787t-2.95-2.563q-.375-.175-.55-.537t-.05-.738q.15-.4.538-.575t.787 0Q18.1 4.85 19.55 7.05T21 11.975q0 .825-.15 1.638t-.425 1.562q-.2.55-.612.688t-.763.012t-.562-.45t-.013-.75q.275-.65.4-1.312T19 11.975m-4.225-3.55Q15.6 8.95 16.05 10t.45 2v.25q0 .125-.025.25q-.05.325-.35.425t-.55-.15L14.3 11.5q-.15-.15-.225-.337T14 10.775V8.85q0-.3.263-.437t.512.012M9.75 6.95Q9.6 6.8 9.6 6.6t.15-.35l.55-.55q.475-.475 1.087-.213t.613.938V8q0 .35-.3.475t-.55-.125z",
  "playlist": "M15 6H3v2h12zm0 4H3v2h12zM3 16h8v-2H3zM17 6v8.18c-.31-.11-.65-.18-1-.18a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3V8h3V6z"
};

const {
  expanded, activeSong, selectedSong, embedUrl, revision, loadSong, chooseSong, stop, retry,
  nativeSource, playing, currentTime, duration, volume, nativeStatus, muted, repeatOne, nativeAudioUrl,
  setLocalAudioCatalog, attachAudio, releaseAudio, pause, seek, setVolume, toggleMute, toggleRepeat,
} = useMusicPlayer();
const albums = computed(() => contentDocument.value.pages.music.blocks
  .filter(block => block.type === 'songs' && !block.hidden)
  .map(block => ({ id: block.id, label: block.label, songs: block.data.items.filter(song => officialEmbedUrl(song) || nativeAudioUrl(song)) }))
  .filter(album => album.songs.length));
const songs = computed(() => albums.value.flatMap(album => album.songs));
const selected = computed(() => activeSong.value || selectedSong.value || songs.value.find(song => nativeAudioUrl(song)) || songs.value[0]);
const hasNativeAudio = computed(() => Boolean(nativeAudioUrl(selected.value)));
const platform = computed(() => musicPlatformName(selected.value));
const officialUrl = computed(() => safeLink(selected.value?.officialUrl));
const playlistOpen = ref(false), heading = ref(null), audioElement = ref(null), frameStatus = ref('');
const { still } = useAmbientMotion();
const nativePlaying = computed(() => Boolean(nativeSource.value && playing.value));
const playbackLabel = computed(() => hasNativeAudio.value ? nativePlaying.value ? '暂停播放' : '播放音乐' : embedUrl.value ? '停止播放' : '加载官方播放器');
const repeatLabel = computed(() => repeatOne.value ? '关闭单曲循环' : '开启单曲循环');
const progressFill = computed(() => `${duration.value > 0 ? Math.min(100, Math.max(0, currentTime.value / duration.value * 100)) : 0}%`);
let frameTimer;
function formatTime(seconds) {
  const value = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
}
function play() {
  if (hasNativeAudio.value) { if (nativePlaying.value) pause(); else loadSong(selected.value); }
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
  if (smallPlayer()) document.querySelector('.space-music-toggle')?.focus();
}
function smallPlayer() { return window.matchMedia(document.querySelector('.original-home-layout') ? '(max-width: 1023px)' : '(max-width: 767px)').matches; }
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
  if (!smallPlayer()) {
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
  <section v-if="selected" id="music-panel" class="space-panel firefly-widget firefly-music music-widget" :class="{ 'is-expanded': expanded, 'has-native-audio': hasNativeAudio, 'is-still': still }" aria-labelledby="music-panel-heading" @keydown="onEscape">
    <div class="music-panel-top">
      <h2 id="music-panel-heading" ref="heading" tabindex="-1" class="space-widget-title">音乐</h2>
      <button class="music-panel-close" aria-label="收起音乐播放器" @click="collapse">×</button>
    </div>
    <div class="music-track">
      <div class="music-cover" :class="{ 'is-playing': nativePlaying }">
        <img v-if="selected.cover" :src="contentImage(selected.cover)" :alt="selected.alt || `${selected.title}封面`" width="56" height="56" loading="lazy" />
        <svg v-else viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3Z" /></svg>
      </div>
      <div class="music-track-copy">
        <h3 class="music-title">{{ selected.title }}</h3>
        <p class="music-artist">{{ selected.artist }}</p>
        <div class="music-time-volume">
          <span class="music-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</span>
          <div class="music-volume">
            <button class="music-mute-button" :aria-label="muted ? '取消静音' : '静音'" :title="muted ? '取消静音' : '静音'" :aria-pressed="muted" :disabled="!hasNativeAudio" @click="toggleMute"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path :d="muted ? musicIcons.mute : musicIcons.volume" /></svg></button>
            <input class="music-range" type="range" min="0" max="1" step="0.01" :value="volume" :style="{ '--range-fill': `${volume * 100}%` }" :disabled="!hasNativeAudio" aria-label="音量" @input="setVolume($event.target.value)" />
          </div>
        </div>
      </div>
    </div>
    <label class="music-progress"><span class="sr-only">播放进度</span><input class="music-range" type="range" min="0" :max="duration || 1" step="0.1" :value="currentTime" :style="{ '--range-fill': progressFill }" :disabled="!hasNativeAudio || !duration" aria-label="播放进度" :aria-valuetext="`${formatTime(currentTime)} / ${formatTime(duration)}`" @input="seek($event.target.value)" /></label>
    <div class="music-controls">
      <button class="music-control music-repeat" :class="{ 'is-active': repeatOne }" :aria-label="repeatLabel" :title="repeatLabel" :aria-pressed="repeatOne" :disabled="!hasNativeAudio" @click="toggleRepeat"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path :d="repeatOne ? musicIcons.repeatOne : musicIcons.repeat" /></svg></button>
      <button class="music-control music-skip" aria-label="上一首" title="上一首" @click="step(-1)"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path :d="musicIcons.previous" /></svg></button>
      <button class="music-play-button" :class="{ 'is-playing': nativePlaying }" :aria-label="playbackLabel" :title="playbackLabel" @click="play"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path v-if="nativePlaying" :d="musicIcons.pause" /><path v-else-if="!hasNativeAudio && embedUrl" d="M6 6h12v12H6Z" /><path v-else :d="musicIcons.play" /></svg></button>
      <button class="music-control music-skip" aria-label="下一首" title="下一首" @click="step(1)"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path :d="musicIcons.next" /></svg></button>
      <button class="music-control" aria-label="选择歌曲" title="歌单" aria-controls="music-playlist" :aria-expanded="playlistOpen" @click="playlistOpen = !playlistOpen"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path :d="musicIcons.playlist" /></svg></button>
    </div>
    <div v-show="playlistOpen" id="music-playlist" class="music-playlist">
      <div class="music-playlist-songs">
        <section v-for="album in albums" :key="album.id" class="music-playlist-album">
          <h3>{{ album.label }}</h3>
          <button v-for="(song, index) in album.songs" :key="song.id" :class="{ 'is-selected': selected.id === song.id }" :aria-pressed="selected.id === song.id" @click="chooseSong(song)"><span class="music-track-number">{{ String(index + 1).padStart(2, '0') }}</span><span>{{ song.title }}</span><span v-if="selected.id === song.id" aria-hidden="true">♪</span></button>
        </section>
      </div>
      <div class="music-playlist-tools">
        <div class="music-panel-actions">
          <a v-if="officialUrl" :href="officialUrl" target="_blank" rel="noopener noreferrer">官方收听 ↗</a>
          <button :disabled="!activeSong" @click="retry">重试</button>
          <button aria-label="停止并卸载播放器" :disabled="!activeSong" @click="stop">停止</button>
        </div>
        <p v-if="hasNativeAudio" class="music-footnote">收起或换页继续播放</p>
        <template v-else>
          <p class="music-footnote">{{ platform }} · 点击加载后，在官方播放器内播放。</p>
          <p v-if="selected.qqSongId" class="music-footnote">完整收听以 QQ 音乐的登录及购买权限为准。</p>
        </template>
      </div>
    </div>
    <div v-if="embedUrl" class="official-player">
      <iframe :key="`${embedUrl}-${revision}`" :src="embedUrl" :title="`${platform}官方播放器：${activeSong.title}`" width="248" height="90" referrerpolicy="strict-origin-when-cross-origin" @load="frameLoaded" @error="frameFailed"></iframe>
    </div>
    <p v-if="hasNativeAudio && nativeStatus" :class="nativeStatus === '播放结束' ? 'sr-only' : 'music-status'" role="status">{{ nativeStatus }}</p>
    <p v-else-if="embedUrl" class="music-status" role="status">{{ frameStatus }}</p>
  </section>
</template>
