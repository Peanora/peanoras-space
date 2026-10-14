import { computed, ref } from "vue";
import { appearance } from "../data/appearance";

const key = "peanora:wallpaper:v1";
const selected = ref(appearance.defaultWallpaper);
const notice = ref("");
try {
  const saved = localStorage.getItem(key);
  if (appearance.wallpapers.some((item) => item.id === saved))
    selected.value = saved;
} catch {
  /* 无法读取存储时仍可使用默认壁纸。 */
}

const wallpaper = computed(
  () =>
    appearance.wallpapers.find((item) => item.id === selected.value) ||
    appearance.wallpapers[0],
);
function selectWallpaper(id) {
  if (!appearance.wallpapers.some((item) => item.id === id)) return;
  selected.value = id;
  try {
    localStorage.setItem(key, id);
    notice.value = `已换成「${wallpaper.value.name}」`;
  } catch {
    notice.value = `已换成「${wallpaper.value.name}」，本次选择未能保存。`;
  }
}

export function useAppearance() {
  return { wallpaper, selectWallpaper, notice };
}
