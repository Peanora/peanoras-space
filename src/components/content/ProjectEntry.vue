<script setup>
import ContentText from "./ContentText.vue";
defineProps({
  project: { type: Object, required: true },
  index: { type: Number, default: 0 },
  blockId: String,
});
</script>
<template>
  <article class="project-entry" :class="{ reverse: index % 2, 'no-cover': !project.cover }" data-reveal>
    <div v-if="project.cover" class="project-image image-frame">
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
        ><ContentText tag="span" class="status" :value="project.status" :block-id="blockId" :field="`items.${index}.status`" />
      </div>
      <ContentText tag="h3" :value="project.title" :block-id="blockId" :field="`items.${index}.title`" />
      <ContentText class="body-copy" :value="project.description" :block-id="blockId" :field="`items.${index}.description`" />
      <ul v-if="project.technologies.length" class="tags" aria-label="开发技术">
        <ContentText v-for="(tech, techIndex) in project.technologies" :key="techIndex" tag="li" :value="tech" :block-id="blockId" :field="`items.${index}.technologies.${techIndex}`" />
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
