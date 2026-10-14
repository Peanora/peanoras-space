<script setup>
defineProps({ memory: { type: Object, required: true } });
const emit = defineEmits(["open-photo"]);
</script>
<template>
  <article class="memory-entry" data-reveal>
    <div class="memory-index">
      <time v-if="memory.date" :datetime="memory.date">{{ memory.date }}</time
      ><span v-else class="eyebrow">日期待补充</span>
      <p v-if="memory.location">{{ memory.location }}</p>
      <span v-else class="muted small">地点待补充</span>
    </div>
    <div class="memory-story">
      <h3>{{ memory.title }}</h3>
      <p v-if="memory.isPlaceholder" class="draft-label">内容占位</p>
      <button
        v-for="(photo, index) in memory.photos"
        :key="photo.src"
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
      <p
        v-for="paragraph in memory.paragraphs"
        :key="paragraph"
        class="body-copy memory-paragraph"
      >
        {{ paragraph }}
      </p>
      <ul v-if="memory.mementos.length" class="mementos">
        <li v-for="item in memory.mementos" :key="item">{{ item }}</li>
      </ul>
    </div>
  </article>
</template>
