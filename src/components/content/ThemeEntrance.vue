<script setup>
defineProps({ theme: { type: Object, required: true } });
</script>
<template>
  <article class="theme-entrance" :class="`theme-${theme.kind}`" data-reveal>
    <div class="theme-meta">
      <span class="eyebrow">{{ theme.number }} / {{ theme.subtitle }}</span
      ><span class="entry-dot" aria-hidden="true"></span>
    </div>
    <RouterLink :to="theme.path" class="theme-title-link"
      ><h2 class="display theme-title">{{ theme.title }}</h2>
      <span class="theme-arrow" aria-hidden="true">↗</span></RouterLink
    >
    <p class="theme-index">{{ theme.index }}</p>
    <RouterLink
      :to="theme.path"
      class="theme-image-link"
      :aria-label="theme.action"
      ><img
        :src="theme.image"
        :alt="theme.alt"
        width="1000"
        height="640"
      /><span class="image-label">占位素材</span></RouterLink
    >
    <RouterLink :to="theme.path" class="text-link theme-action"
      >{{ theme.action }} <span aria-hidden="true">↗</span></RouterLink
    >
  </article>
</template>
