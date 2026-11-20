import { computed, ref, shallowRef } from "vue";
import publishedAudio from '../data/audio.json' with { type: 'json' };
import { contentDocument } from '../content/store.js';
import { preloadAudio } from './preloadAudio.js';

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

const expanded = ref(false), activeSong = shallowRef(null), selectedSong = shallowRef(null);
const revision = ref(0), localTracks = shallowRef({});
const playing = ref(false), currentTime = ref(0), duration = ref(0), volume = ref(0.7), nativeStatus = ref('');
const repeatModes = ['list', 'one', 'shuffle'];
const repeatMode = ref('list'), lastAudibleVolume = ref(0.7);
const muted = computed(() => volume.value === 0);
let audio = null, detachAudio = null, preloader = null, playbackVersion = 0;

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
const albums = computed(() => contentDocument.value.pages.music.blocks
  .filter(block => block.type === 'songs' && !block.hidden)
  .map(block => ({ id: block.id, label: block.label, songs: block.data.items.filter(playable) }))
  .filter(album => album.songs.length));
const songs = computed(() => albums.value.flatMap(album => album.songs));
function playable(song) { return Boolean(nativeAudioUrl(song) || officialEmbedUrl(song)); }
function resetPosition() { currentTime.value = 0; duration.value = 0; playing.value = false; }
function unloadAudio() {
  playbackVersion += 1;
  if (audio) { audio.pause(); audio.loop = false; audio.removeAttribute('src'); audio.load(); }
  resetPosition();
}
function preloadSongs() {
  if (!audio || preloader || globalThis.navigator?.connection?.saveData) return;
  const sources = songs.value.map(nativeAudioUrl).filter(src => src && src !== audio.getAttribute('src'));
  if (sources.length) preloader = preloadAudio(sources);
}
function playNative(reuseElement = false) {
  const source = nativeSource.value;
  if (!audio || !source) { nativeStatus.value = '播放器尚未准备好，请再点一次播放。'; return; }
  if (playing.value && audio.getAttribute('src') === source) return;
  const version = ++playbackVersion;
  nativeStatus.value = '正在加载音频…';
  if (audio.getAttribute('src') !== source) {
    const prepared = preloader?.take(source);
    if (prepared && !reuseElement) {
      audio.replaceWith(prepared);
      attachAudio(prepared);
    } else {
      if (prepared) { prepared.removeAttribute('src'); prepared.load(); }
      audio.pause(); resetPosition(); audio.setAttribute('src', source); audio.load();
    }
  }
  audio.volume = volume.value;
  audio.loop = repeatMode.value === 'one';
  const pending = audio.play();
  pending?.catch(() => {
    if (version === playbackVersion) {
      playing.value = false;
      nativeStatus.value = audio.error ? '音频暂时无法播放，可以重试或前往官方页面。' : '播放未开始，请再点一次播放。';
    }
  });
}
function loadSong(song, automatic = false) {
  if (!playable(song)) return false;
  const source = nativeAudioUrl(song);
  const changed = activeSong.value?.id !== song.id || nativeAudioUrl(activeSong.value) !== source || officialEmbedUrl(activeSong.value) !== officialEmbedUrl(song);
  selectedSong.value = song;
  if (changed) { unloadAudio(); activeSong.value = song; }
  if (!automatic) expanded.value = true;
  if (source) playNative(automatic);
  return true;
}
function chooseSong(song) {
  if (!playable(song)) return false;
  selectedSong.value = song;
  return activeSong.value ? loadSong(song) : true;
}
function nextSong(playlist, current, direction = 1) {
  if (!playlist.length) return null;
  if (repeatMode.value === 'shuffle' && direction === 1) {
    const alternatives = playlist.filter(song => song.id !== current?.id);
    return alternatives.length ? alternatives[Math.floor(Math.random() * alternatives.length)] : playlist[0];
  }
  const index = playlist.findIndex(song => song.id === current?.id);
  return index === -1 ? playlist[0] : playlist[(index + direction + playlist.length) % playlist.length];
}
function stepSong(current, direction) {
  const playlist = repeatMode.value === 'shuffle' && direction === 1 && nativeAudioUrl(current)
    ? songs.value.filter(nativeAudioUrl)
    : songs.value;
  const song = nextSong(playlist, current, direction);
  if (song) chooseSong(song);
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
function toggleRepeat() {
  repeatMode.value = repeatModes[(repeatModes.indexOf(repeatMode.value) + 1) % repeatModes.length];
  if (audio) audio.loop = Boolean(nativeSource.value && repeatMode.value === 'one');
}
function onEnded() {
  if (!nativeSource.value) return;
  playing.value = false;
  nativeStatus.value = '播放结束';
  if (repeatMode.value === 'one') return;
  const next = nextSong(songs.value.filter(nativeAudioUrl), activeSong.value);
  if (!next) return;
  if (next.id === activeSong.value.id) audio.currentTime = 0;
  loadSong(next, true);
}
function attachAudio(element) {
  detachAudio?.(); audio = element;
  if (!audio) return;
  if (!audio.getAttribute('src')) audio.preload = 'none';
  audio.volume = volume.value; audio.loop = false;
  duration.value = Number.isFinite(audio.duration) ? audio.duration : 0;
  const handlers = {
    play: () => { if (nativeSource.value) { playing.value = true; nativeStatus.value = ''; } },
    pause: () => { playing.value = false; },
    ended: onEnded,
    timeupdate: () => { currentTime.value = Number.isFinite(audio.currentTime) ? audio.currentTime : 0; },
    durationchange: () => { duration.value = Number.isFinite(audio.duration) ? audio.duration : 0; },
    error: () => { if (nativeSource.value) { playing.value = false; nativeStatus.value = '音频暂时无法播放，可以重试或前往官方页面。'; } },
    waiting: () => { if (nativeSource.value) nativeStatus.value = '音频缓冲中…'; },
    playing: () => { if (nativeSource.value) { playing.value = true; nativeStatus.value = ''; } },
  };
  Object.entries(handlers).forEach(([event, handler]) => audio.addEventListener(event, handler));
  detachAudio = () => { Object.entries(handlers).forEach(([event, handler]) => element.removeEventListener(event, handler)); };
}
function releaseAudio() {
  preloader?.dispose(); preloader = null;
  stop(); detachAudio?.(); detachAudio = null; audio = null;
}
export function useMusicPlayer() {
  return {
    expanded, activeSong, selectedSong, albums, songs, embedUrl, revision, loadSong, chooseSong, stepSong, stop,
    nativeSource, playing, currentTime, duration, volume, nativeStatus, muted, repeatMode,
    nativeAudioUrl, setLocalAudioCatalog, attachAudio, releaseAudio, preloadSongs, pause, seek, setVolume, toggleMute, toggleRepeat,
    retry: () => { if (nativeSource.value) { unloadAudio(); playNative(); } else if (activeSong.value) revision.value += 1; },
  };
}
