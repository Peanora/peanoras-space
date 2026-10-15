import { computed, ref, shallowRef } from "vue";

export function officialEmbedUrl(song) {
  const id = String(song?.neteaseId || "");
  return /^\d{1,20}$/.test(id)
    ? `https://music.163.com/outchain/player?type=2&id=${id}&auto=0&height=66`
    : null;
}

// Shared outside route views so navigating the site never remounts the iframe.
const expanded = ref(false);
const activeSong = shallowRef(null);
const revision = ref(0);
const embedUrl = computed(() => officialEmbedUrl(activeSong.value));
function loadSong(song) {
  if (!officialEmbedUrl(song)) return false;
  if (activeSong.value?.neteaseId !== song.neteaseId) activeSong.value = song;
  expanded.value = true;
  return true;
}
function stop() {
  activeSong.value = null;
}
export function useMusicPlayer() {
  return {
    expanded, activeSong, embedUrl, revision, loadSong, stop,
    retry: () => { if (activeSong.value) revision.value += 1; },
  };
}
