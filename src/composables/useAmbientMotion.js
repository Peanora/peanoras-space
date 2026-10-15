import { computed, onMounted, onUnmounted, ref } from "vue";

// Only decorative loops are paused here; navigation and deliberate interactions stay usable.
export function useAmbientMotion() {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = ref(preference.matches);
  const hidden = ref(document.hidden);
  const still = computed(() => reduced.value || hidden.value);
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
    reduced,
  };
}
