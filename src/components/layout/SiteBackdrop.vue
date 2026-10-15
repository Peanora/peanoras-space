<script setup>
import ArtworkImage from "../ui/ArtworkImage.vue";
import { useAppearance } from "../../composables/useAppearance";
const { wallpaper } = useAppearance();
</script>
<template>
  <div class="site-backdrop" aria-hidden="true">
    <Transition name="wallpaper">
      <ArtworkImage
        :key="wallpaper.id"
        :src="wallpaper.src"
        sizes="100vw"
        background
        fetchpriority="low"
        alt=""
        :style="{ objectPosition: wallpaper.position }"
      />
    </Transition>
  </div>
</template>
