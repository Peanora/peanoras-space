<script setup>
import ArtworkImage from '../ui/ArtworkImage.vue';
import ContentText from './ContentText.vue';
defineProps({ chapter:Object, sample:Object });
</script>
<template>
  <button class="chapter-ticket" :class="'ticket-'+chapter.kind" :aria-label="`翻到${chapter.bookmark}主题介绍`">
    <span class="ticket-stage">
      <span v-if="chapter.kind === 'music'" class="ticket-vinyl" aria-hidden="true"></span>
      <ArtworkImage v-if="chapter.image" :src="chapter.image" :thumbnail="chapter.kind !== 'world'" sizes="(max-width: 767px) 130px, (max-width: 1023px) 30vw, 320px" alt="" class="ticket-art" />
      <small v-if="chapter.kind === 'music' && chapter.image" class="sleeve-credit">主题插画</small>
      <span v-if="sample && chapter.kind !== 'world'" class="ticket-sample"><ContentText tag="span" :value="sample.text" /><small>{{ sample.label }}</small></span>
    </span>
    <span class="ticket-caption"><span class="ticket-titles"><strong>{{ chapter.title }}</strong><span>{{ chapter.bookmark }}</span></span><span class="ticket-arrow" aria-hidden="true">↓</span></span>
    <span v-if="sample && chapter.kind === 'world'" class="ticket-note">{{ sample.label }} · {{ sample.text }}</span>
    <span v-else-if="sample" class="ticket-mobile-line"><ContentText tag="span" :value="sample.text" /> · {{ sample.label }}</span>
  </button>
</template>
