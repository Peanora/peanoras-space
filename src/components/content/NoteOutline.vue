<script setup>
defineProps({ items: Array });
</script>
<template>
  <ol class="unity-outline">
    <li v-for="item in items" :key="item.id">
      <a :href="`#section-${item.id}`">{{ item.heading }}</a>
      <NoteOutline v-if="item.children.length" :items="item.children" />
    </li>
  </ol>
</template>
