import { computed, ref, shallowRef } from "vue";
import publishedAudio from '../data/audio.json' with { type: 'json' };

export function officialEmbedUrl(song) {
  const qqId = String(song?.qqSongId || '');
  if (qqId) return /^\d{1,20}$/.test(qqId) && !song.neteaseId
    ? `https://i.y.qq.com/n2/m/outchain/player/index.html?songid=${qqId}&songtype=0` : null;
  const id = String(song?.neteaseId || "");
  return /^\d{1,20}$/.test(id)
    ? `https://music.163.com/outchain/player?type=2&id=${id}&auto=0&height=66`
    : null;
}
export const musicPlatformName = song => song?.qqSongId ? 'QQ 音乐' : '网易云音乐';

// One controller and one media element live outside route views.
const expanded = ref(false), activeSong = shallowRef(null), selectedSong = shallowRef(null);
const revision = ref(0), localTracks = shallowRef({});
const playing = ref(false), currentTime = ref(0), duration = ref(0), volume = ref(0.7), nativeStatus = ref('');
const repeatOne = ref(false), lastAudibleVolume = ref(0.7);
const muted = computed(() => volume.value === 0);
let audio = null, detachAudio = null, playbackVersion = 0;

export function nativeAudioUrl(song) {
  const src = localTracks.value[song?.id]?.src;
  if (typeof src === 'string' && src.startsWith('/.local-audio/') && !/[?#\\]/.test(src)) {
    try {
      const path = decodeURIComponent(src);
      if (!/[\\\u0000-\u001f]/.test(path) && !path.split('/').some(part => part === '..' || part === '.')) return src;
    } catch { /* Invalid preview paths fall back to an approved public source. */ }
  }
  const published = publishedAudio.tracks[song?.id]?.src;
  return typeof published === 'string' && /^\/audio\/hanser\/[a-z0-9-]+\.(?:flac|mp3)$/.test(published) ? published : null;
}
export function setLocalAudioCatalog(catalog) {
  localTracks.value = catalog?.tracks && typeof catalog.tracks === 'object' && !Array.isArray(catalog.tracks) ? catalog.tracks : {};
}
const nativeSource = computed(() => nativeAudioUrl(activeSong.value));
const embedUrl = computed(() => nativeSource.value ? null : officialEmbedUrl(activeSong.value));
function playable(song) { return Boolean(nativeAudioUrl(song) || officialEmbedUrl(song)); }
function resetPosition() { currentTime.value = 0; duration.value = 0; playing.value = false; }
function unloadAudio() {
  playbackVersion += 1;
  if (audio) { audio.pause(); audio.loop = false; audio.removeAttribute('src'); audio.load(); }
  resetPosition();
}
function playNative() {
  if (!audio || !nativeSource.value) { nativeStatus.value = '播放器尚未准备好，请再点一次播放。'; return; }
  if (playing.value && audio.getAttribute('src') === nativeSource.value) return;
  const version = ++playbackVersion;
  nativeStatus.value = '正在加载音频…';
  if (audio.getAttribute('src') !== nativeSource.value) {
    audio.pause(); resetPosition(); audio.setAttribute('src', nativeSource.value); audio.load();
  }
  audio.volume = volume.value;
  audio.loop = repeatOne.value;
  const pending = audio.play();
  pending?.catch(() => {
    if (version === playbackVersion) {
      playing.value = false;
      nativeStatus.value = audio.error ? '音频暂时无法播放，可以重试或前往官方页面。' : '播放未开始，请再点一次播放。';
    }
  });
}
function loadSong(song) {
  if (!playable(song)) return false;
  const source = nativeAudioUrl(song);
  const changed = activeSong.value?.id !== song.id || nativeAudioUrl(activeSong.value) !== source || officialEmbedUrl(activeSong.value) !== officialEmbedUrl(song);
  selectedSong.value = song;
  if (changed) { unloadAudio(); activeSong.value = song; }
  expanded.value = true;
  if (source) playNative();
  return true;
}
function chooseSong(song) {
  if (!playable(song)) return false;
  selectedSong.value = song;
  return activeSong.value ? loadSong(song) : true;
}
function stop() {
  unloadAudio(); activeSong.value = null; nativeStatus.value = '';
}
function pause() { audio?.pause(); }
function seek(value) {
  const seconds = Number(value);
  if (audio && nativeSource.value && duration.value > 0 && Number.isFinite(seconds)) {
    audio.currentTime = Math.max(0, Math.min(duration.value, seconds));
    currentTime.value = audio.currentTime;
  }
}
function setVolume(value) {
  const level = Number(value);
  if (!Number.isFinite(level)) return;
  volume.value = Math.max(0, Math.min(1, level));
  if (volume.value > 0) lastAudibleVolume.value = volume.value;
  if (audio) audio.volume = volume.value;
}
function toggleMute() { setVolume(muted.value ? lastAudibleVolume.value || 0.7 : 0); }
function setRepeatOne(value) {
  repeatOne.value = Boolean(value);
  if (audio) audio.loop = Boolean(nativeSource.value && repeatOne.value);
}
function toggleRepeat() { setRepeatOne(!repeatOne.value); }
function attachAudio(element) {
  detachAudio?.(); audio = element;
  if (!audio) return;
  audio.preload = 'none'; audio.volume = volume.value; audio.loop = false;
  const handlers = {
    play: () => { if (nativeSource.value) { playing.value = true; nativeStatus.value = ''; } },
    pause: () => { playing.value = false; },
    ended: () => { playing.value = false; nativeStatus.value = '播放结束'; },
    timeupdate: () => { currentTime.value = Number.isFinite(audio.currentTime) ? audio.currentTime : 0; },
    durationchange: () => { duration.value = Number.isFinite(audio.duration) ? audio.duration : 0; },
    error: () => { if (nativeSource.value) { playing.value = false; nativeStatus.value = '音频暂时无法播放，可以重试或前往官方页面。'; } },
    waiting: () => { if (nativeSource.value) nativeStatus.value = '音频缓冲中…'; },
    playing: () => { if (nativeSource.value) { playing.value = true; nativeStatus.value = ''; } },
  };
  Object.entries(handlers).forEach(([event, handler]) => audio.addEventListener(event, handler));
  detachAudio = () => { Object.entries(handlers).forEach(([event, handler]) => element.removeEventListener(event, handler)); };
}
function releaseAudio() { stop(); detachAudio?.(); detachAudio = null; audio = null; }
export function useMusicPlayer() {
  return {
    expanded, activeSong, selectedSong, embedUrl, revision, loadSong, chooseSong, stop,
    nativeSource, playing, currentTime, duration, volume, nativeStatus, muted, repeatOne,
    nativeAudioUrl, setLocalAudioCatalog, attachAudio, releaseAudio, pause, seek, setVolume, toggleMute, setRepeatOne, toggleRepeat,
    retry: () => { if (nativeSource.value) { unloadAudio(); playNative(); } else if (activeSong.value) revision.value += 1; },
  };
}
