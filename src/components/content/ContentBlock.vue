<script setup>
import { computed, inject, ref } from "vue";
import ContentText from "./ContentText.vue";
import ProjectEntry from "./ProjectEntry.vue";
import SongEntry from "./SongEntry.vue";
import MemoryEntry from "./MemoryEntry.vue";
import PhotoGallery from "./PhotoGallery.vue";
import NotesCollection from "./NotesCollection.vue";
import ImageLightbox from "../ui/ImageLightbox.vue";
import { contentImage } from "../../content/assets";
import { safeLink } from "../../content/model";
import { editingContent, selectedContentBlock, publishEditorEvent } from "../../content/store";
const props = defineProps({ block: { type: Object, required: true } });
const isDev = import.meta.env.DEV;
const pageId = inject('content-page', 'world');
const lightbox = ref(null);
const data = computed(() => props.block.data);
const style = computed(() => {
  const layout = props.block.layout;
  return {
    width: `${layout.width}%`, textAlign: layout.align,
    paddingBlock: layout.spacing === undefined ? undefined : `${layout.spacing}px`,
    '--content-image-width': `${layout.imageWidth || 100}%`,
    '--content-image-ratio': layout.ratio && layout.ratio !== 'original' ? layout.ratio : undefined,
    '--content-image-fit': layout.fit || 'cover',
    '--content-image-position': `${layout.imageX ?? 50}% ${layout.imageY ?? 50}%`,
  };
});
const media = computed(() => ['image', 'split'].includes(props.block.type));
const projects = computed(() => props.block.type === 'projects' ? data.value.items.map((item) => ({ ...item, cover: item.cover ? contentImage(item.cover) : '', githubUrl: safeLink(item.githubUrl), demoUrl: safeLink(item.demoUrl), detailUrl: safeLink(item.detailUrl) })) : []);
const collection = computed(() => {
  if (!['songs', 'memories', 'gallery'].includes(props.block.type)) return [];
  return data.value.items.map((item, index) => {
    if (props.block.type === 'songs') return { ...item, cover: item.cover ? contentImage(item.cover) : '', officialUrl: safeLink(item.officialUrl) };
    if (props.block.type === 'memories') return { ...item, photos: item.photos.filter((photo) => photo.src).map((photo) => ({ ...photo, src: contentImage(photo.src) })) };
    return { ...item, contentIndex: index, src: item.src ? contentImage(item.src) : '' };
  }).filter((item) => props.block.type !== 'gallery' || item.src);
});
function openPhoto(items, index, event) { if (!editingContent.value) lightbox.value?.open(items, index, event); }
function select() { if (editingContent.value) publishEditorEvent({ type: 'select', pageId, blockId: props.block.id }); }
</script>
<template>
  <section v-if="!block.hidden || editingContent" :id="block.id" class="content-block" data-reveal
    :class="[`content-${block.type}`, `layout-${block.layout.preset}`, { 'content-section': block.type !== 'notes', 'about-section': block.type === 'profile', 'editor-block': editingContent, 'editor-block-selected': editingContent && selectedContentBlock === block.id, 'editor-block-hidden': block.hidden }]"
    :style="style" :data-block-id="block.id" :data-editor-label="isDev && editingContent ? `${block.label}${block.hidden ? ' · 已隐藏' : ''}` : undefined" :data-image-ratio="block.layout.ratio && block.layout.ratio !== 'original' ? block.layout.ratio : undefined"
    tabindex="-1" @pointerdown.capture="select">
    <NotesCollection v-if="block.type === 'notes'" :data="data" :block-id="block.id" />
    <template v-else-if="['songs', 'memories', 'gallery'].includes(block.type)">
      <div class="section-heading">
        <ContentText tag="h2" class="display" :value="data.heading" :block-id="block.id" field="heading" />
        <ContentText tag="span" class="muted small" :value="data.subtitle" :block-id="block.id" field="subtitle" />
      </div>
      <div :class="`collection-${block.type}`">
        <template v-if="block.type === 'songs'"><SongEntry v-for="(song, index) in collection" :key="song.id" :song="song" :index="index" :block-id="block.id" /></template>
        <template v-else-if="block.type === 'memories'"><MemoryEntry v-for="(memory, index) in collection" :key="memory.id" :memory="memory" :index="index" :block-id="block.id" @open-photo="openPhoto" /></template>
        <PhotoGallery v-else :photos="collection" :block-id="block.id" :image-position="block.layout.imageX !== undefined || block.layout.imageY !== undefined ? style['--content-image-position'] : undefined" @open-photo="openPhoto" />
      </div>
      <ContentText v-if="!collection.length" tag="p" class="empty-note" :value="data.emptyText" :block-id="block.id" field="emptyText" />
      <ImageLightbox ref="lightbox" />
    </template>
    <template v-else-if="block.type === 'profile'">
      <div class="section-side">
        <ContentText tag="span" class="eyebrow" :value="data.eyebrow" :block-id="block.id" field="eyebrow" />
        <ContentText tag="h2" class="display" :value="data.name" :block-id="block.id" field="name" />
      </div>
      <div class="about-copy">
        <ContentText class="about-introduction" :value="data.introduction" :block-id="block.id" field="introduction" />
        <div class="about-details">
          <div>
            <ContentText tag="h3" class="eyebrow" :value="data.interestsHeading" :block-id="block.id" field="interestsHeading" />
            <ul class="about-interests">
              <ContentText v-for="(interest, index) in data.interests" :key="index" tag="li" :value="interest" :block-id="block.id" :field="`interests.${index}`" />
            </ul>
          </div>
          <div>
            <ContentText tag="h3" class="eyebrow" :value="data.learningHeading" :block-id="block.id" field="learningHeading" />
            <ul class="about-learning">
              <li v-for="(item, index) in data.learning" :key="index">
                <ContentText tag="strong" :value="item.title" :block-id="block.id" :field="`learning.${index}.title`" /><template v-if="item.description">：<ContentText tag="span" :value="item.description" :block-id="block.id" :field="`learning.${index}.description`" /></template>
              </li>
            </ul>
          </div>
        </div>
        <ContentText v-if="data.direction" class="body-copy" :value="data.direction" :block-id="block.id" field="direction" />
        <ContentText tag="h3" class="eyebrow about-find-heading" :value="data.socialHeading" :block-id="block.id" field="socialHeading" />
        <div class="entry-links">
          <a v-for="(link, index) in data.socials" :key="index" :href="safeLink(link.url) || undefined" class="text-link" target="_blank" rel="noopener noreferrer"><ContentText tag="span" :value="link.label" :block-id="block.id" :field="`socials.${index}.label`" /> ↗</a>
        </div>
      </div>
    </template>
    <template v-else-if="block.type === 'projects' || block.type === 'experience'">
      <div class="section-heading">
        <ContentText tag="h2" class="display" :value="data.heading" :block-id="block.id" field="heading" />
        <ContentText tag="span" class="muted small" :value="data.subtitle" :block-id="block.id" field="subtitle" />
      </div>
      <div v-if="block.type === 'projects'" class="projects-collection">
        <ProjectEntry v-for="(project, index) in projects" :key="project.id" :project="project" :index="index" :block-id="block.id" />
      </div>
      <template v-else>
        <ol v-if="data.items.length" class="experience-list">
          <li v-for="(item, index) in data.items" :key="item.id">
            <ContentText tag="span" class="eyebrow" :value="item.date" :block-id="block.id" :field="`items.${index}.date`" />
            <div><ContentText tag="h3" :value="item.title" :block-id="block.id" :field="`items.${index}.title`" /><ContentText class="body-copy" :value="item.description" :block-id="block.id" :field="`items.${index}.description`" /></div>
          </li>
        </ol>
        <div v-else class="empty-note"><span class="eyebrow">TO BE CONTINUED</span><ContentText tag="p" :value="data.emptyText" :block-id="block.id" field="emptyText" /></div>
      </template>
    </template>
    <template v-else-if="block.type === 'text' || media">
      <ContentText v-if="data.eyebrow !== undefined" tag="p" class="eyebrow" :value="data.eyebrow" :block-id="block.id" field="eyebrow" />
      <ContentText v-if="data.heading !== undefined" tag="h2" class="display custom-block-heading" :value="data.heading" :block-id="block.id" field="heading" />
      <div class="custom-block-body">
        <figure v-if="media && data.src" class="content-media">
          <img :src="contentImage(data.src)" :alt="data.alt" loading="lazy" width="1000" height="680" />
          <ContentText tag="figcaption" :value="data.caption" :block-id="block.id" field="caption" />
        </figure>
        <ContentText v-if="data.body !== undefined" class="body-copy rich-body" :value="data.body" :block-id="block.id" field="body" />
      </div>
    </template>
    <template v-else-if="block.type === 'links'">
      <ContentText tag="h2" class="display custom-block-heading" :value="data.heading" :block-id="block.id" field="heading" />
      <div class="entry-links"><a v-for="(link, index) in data.items" :key="index" :href="safeLink(link.url) || undefined" class="text-link"><ContentText tag="span" :value="link.label" :block-id="block.id" :field="`items.${index}.label`" /> ↗</a></div>
    </template>
    <ContentText v-else class="content-divider-caption" :value="data.caption" :block-id="block.id" field="caption" />
  </section>
</template>
