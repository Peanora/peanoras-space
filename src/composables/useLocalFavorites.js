import { ref, watch } from "vue";

const STORAGE_KEY = "peanora:little-favorites:v1";
export function useLocalFavorites(validIds) {
  const favorites = ref([]);
  const storageNotice = ref("");
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(stored)) throw new Error("Invalid favorites");
    favorites.value = [
      ...new Set(stored.filter((id) => validIds.includes(id))),
    ];
  } catch {
    storageNotice.value = "收藏记录暂时无法读取，本次仍可以收藏。";
  }
  watch(
    favorites,
    (items) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        storageNotice.value = "";
      } catch {
        storageNotice.value = "浏览器未能保存收藏；本次操作仅在当前页面有效。";
      }
    },
    { deep: true, flush: "sync" },
  );
  function toggle(id) {
    if (!validIds.includes(id)) return;
    favorites.value = favorites.value.includes(id)
      ? favorites.value.filter((item) => item !== id)
      : [...favorites.value, id];
  }
  return { favorites, toggle, storageNotice };
}
