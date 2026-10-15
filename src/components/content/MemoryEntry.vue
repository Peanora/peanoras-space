<script setup>
import ContentText from "./ContentText.vue";
defineProps({ memory: { type: Object, required: true }, blockId: String, index: Number });
const emit = defineEmits(["open-photo"]);
</script>
<template>
  <article class="memory-entry" data-reveal>
    <div class="memory-index">
      <time v-if="memory.date" :datetime="memory.date">{{ memory.date }}</time
      ><span v-else class="eyebrow">日期待补充</span>
      <ContentText v-if="memory.location" tag="p" :value="memory.location" :block-id="blockId" :field="`items.${index}.location`" />
      <span v-else class="muted small">地点待补充</span>
    </div>
    <div class="memory-story">
      <ContentText tag="h3" :value="memory.title" :block-id="blockId" :field="`items.${index}.title`" />
      <p v-if="memory.isPlaceholder" class="draft-label">内容占位</p>
      <button
        v-for="(photo, index) in memory.photos"
        :key="index"
        class="photo-button image-frame memory-photo"
        :aria-label="`查看大图：${photo.alt}`"
        @click="emit('open-photo', memory.photos, index, $event)"
      >
        <img
          :src="photo.src"
          :alt="photo.alt"
          width="1000"
          height="680"
          loading="lazy"
        /><span v-if="photo.isPlaceholder" class="image-label"
          >占位素材 · 点击查看</span
        >
      </button>
      <ContentText
        v-for="(paragraph, paragraphIndex) in memory.paragraphs"
        :key="paragraphIndex"
        class="body-copy memory-paragraph"
        :value="paragraph" :block-id="blockId" :field="`items.${index}.paragraphs.${paragraphIndex}`" />
      <ul v-if="memory.mementos.length" class="mementos">
        <ContentText v-for="(item, itemIndex) in memory.mementos" :key="itemIndex" tag="li" :value="item" :block-id="blockId" :field="`items.${index}.mementos.${itemIndex}`" />
      </ul>
    </div>
  </article>
</template>
