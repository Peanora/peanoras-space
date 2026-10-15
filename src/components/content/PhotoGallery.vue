<script setup>
import ContentText from "./ContentText.vue";
defineProps({ photos: { type: Array, required: true }, blockId: String, imagePosition: String });
const emit = defineEmits(["open-photo"]);
</script>
<template>
  <div class="photo-gallery">
    <figure
      v-for="(photo, index) in photos"
      :key="photo.id"
      :class="`gallery-${photo.shape || 'landscape'}`"
      data-reveal
    >
      <button
        class="photo-button image-frame"
        :aria-label="`查看大图：${photo.alt}`"
        @click="emit('open-photo', photos, index, $event)"
      >
        <img
          :src="photo.src"
          :alt="photo.alt"
          :style="{ objectPosition: imagePosition || photo.position || 'center' }"
          loading="lazy"
          :width="photo.shape === 'portrait' ? 600 : 1000"
          :height="photo.shape === 'portrait' ? 800 : 680"
        /><span v-if="photo.isPlaceholder" class="image-label">占位素材</span
        ><span class="photo-expand" aria-hidden="true">↗</span>
      </button>
      <ContentText tag="figcaption" :value="photo.caption" :block-id="blockId" :field="`items.${photo.contentIndex ?? index}.caption`" />
    </figure>
  </div>
</template>
