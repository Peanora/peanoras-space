<script setup>
import { computed, onUnmounted, ref, watch } from "vue";
import { artworkFor } from "../../data/artwork";
defineOptions({ inheritAttrs: false });
const props = defineProps({
  src: { type: String, required: true },
  sizes: { type: String, default: "(max-width: 720px) 90vw, 640px" },
  thumbnail: Boolean,
  background: Boolean,
  responsive: { type: Boolean, default: true },
  loading: { type: String, default: 'lazy' },
});
const image = computed(() => artworkFor(props.src));
const fallback = ref(false);
const retrying = ref(false);
let retryTimer;
watch(() => props.src, () => {
  clearTimeout(retryTimer);
  fallback.value = false;
  retrying.value = false;
});
function recover() {
  if (props.thumbnail || fallback.value) return;
  // A tiny independent file is useful when a larger request fails on mobile.
  fallback.value = true;
  if (!retrying.value) {
    retrying.value = true;
    retryTimer = setTimeout(() => { fallback.value = false; }, 2000);
  }
}
onUnmounted(() => clearTimeout(retryTimer));
</script>
<template>
  <img
    :loading="loading"
    decoding="async"
    v-bind="$attrs"
    :sizes="thumbnail || fallback || !responsive ? undefined : sizes"
    :srcset="thumbnail || fallback || !responsive ? undefined : background ? image.backgroundSrcset : image.srcset"
    :src="thumbnail || fallback ? image.thumbnail : image.small"
    @error="recover"
  />
</template>
