import { computed, ref, shallowRef } from "vue";

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

// Shared outside route views so navigating the site never remounts the iframe.
const expanded = ref(false);
const activeSong = shallowRef(null);
const selectedSong = shallowRef(null);
const revision = ref(0);
const embedUrl = computed(() => officialEmbedUrl(activeSong.value));
function loadSong(song) {
  if (!officialEmbedUrl(song)) return false;
  selectedSong.value = song;
  if (officialEmbedUrl(activeSong.value) !== officialEmbedUrl(song)) activeSong.value = song;
  expanded.value = true;
  return true;
}
function chooseSong(song) {
  if (!officialEmbedUrl(song)) return false;
  selectedSong.value = song;
  return activeSong.value ? loadSong(song) : true;
}
function stop() {
  activeSong.value = null;
}
export function useMusicPlayer() {
  return {
    expanded, activeSong, selectedSong, embedUrl, revision, loadSong, chooseSong, stop,
    retry: () => { if (activeSong.value) revision.value += 1; },
  };
}
