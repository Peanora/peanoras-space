<script setup>
defineProps({
  project: { type: Object, required: true },
  index: { type: Number, default: 0 },
});
</script>
<template>
  <article class="project-entry" :class="{ reverse: index % 2 }" data-reveal>
    <div class="project-image image-frame">
      <img
        :src="project.cover"
        :alt="project.alt"
        width="1000"
        height="640"
        loading="lazy"
      /><span v-if="project.isPlaceholder" class="image-label">占位素材</span>
    </div>
    <div class="project-copy">
      <div class="entry-meta">
        <span class="eyebrow"
          >PROJECT {{ String(index + 1).padStart(2, "0") }}</span
        ><span class="status">{{ project.status }}</span>
      </div>
      <h3>{{ project.title }}</h3>
      <p class="body-copy">{{ project.description }}</p>
      <ul v-if="project.technologies.length" class="tags" aria-label="开发技术">
        <li v-for="tech in project.technologies" :key="tech">{{ tech }}</li>
      </ul>
      <div class="entry-links">
        <a
          v-if="project.githubUrl"
          class="text-link"
          :href="project.githubUrl"
          target="_blank"
          rel="noopener noreferrer"
          >GitHub ↗</a
        >
        <a
          v-if="project.demoUrl"
          class="text-link"
          :href="project.demoUrl"
          target="_blank"
          rel="noopener noreferrer"
          >查看演示 ↗</a
        >
        <a v-if="project.detailUrl" class="text-link" :href="project.detailUrl"
          >项目详情 ↗</a
        >
      </div>
    </div>
  </article>
</template>
