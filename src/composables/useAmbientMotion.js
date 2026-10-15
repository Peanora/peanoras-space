import { computed, onMounted, onUnmounted, ref } from "vue";

// Only decorative loops are paused here; navigation and deliberate interactions stay usable.
export function useAmbientMotion() {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = ref(preference.matches);
  const paused = ref(false);
  const hidden = ref(document.hidden);
  const still = computed(() => paused.value || reduced.value || hidden.value);
  const label = computed(() =>
    reduced.value ? "减少动态" : paused.value ? "开启动效" : "暂停动态",
  );
  const updatePreference = () => {
    reduced.value = preference.matches;
  };
  const updateVisibility = () => {
    hidden.value = document.hidden;
  };
  onMounted(() => {
    preference.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);
  });
  onUnmounted(() => {
    preference.removeEventListener("change", updatePreference);
    document.removeEventListener("visibilitychange", updateVisibility);
  });
  return {
    still,
    label,
    reduced,
    paused,
    toggle: () => {
      paused.value = !paused.value;
    },
  };
}
