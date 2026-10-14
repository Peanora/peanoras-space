<script setup>
import { ref, watch, onUnmounted } from "vue";
import { useAppearance } from "../../composables/useAppearance";
const { wallpaper } = useAppearance();
const displayed = ref(wallpaper.value);
let request = 0;
watch(
  () => wallpaper.value.id,
  () => {
    const next = wallpaper.value;
    const token = ++request;
    const preload = new Image();
    preload.onload = () => {
      if (token === request) displayed.value = next;
    };
    preload.src = next.src;
  },
);
onUnmounted(() => {
  request += 1;
});
</script>
<template>
  <div class="site-backdrop" aria-hidden="true">
    <Transition name="wallpaper">
      <img
        :key="displayed.id"
        :src="displayed.src"
        alt=""
        :style="{ objectPosition: displayed.position }"
      />
    </Transition>
  </div>
</template>
