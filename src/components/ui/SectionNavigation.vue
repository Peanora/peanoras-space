<script setup>
defineProps({ items: { type: Array, required: true } });
</script>
<template>
  <nav class="section-navigation" aria-label="页面章节">
    <RouterLink v-for="item in items" :key="item.hash" :to="{ hash: item.hash }"
      >{{ item.label }} <span aria-hidden="true">↓</span></RouterLink
    >
  </nav>
</template>
