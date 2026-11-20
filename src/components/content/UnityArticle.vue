<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import ContentText from './ContentText.vue';
import NoteCode from './NoteCode.vue';
import ImageLightbox from '../ui/ImageLightbox.vue';
import { contentImage } from '../../content/assets';
import { noteOutline, sectionHeadingLevel } from '../../content/unityNotes';
import NoteOutline from './NoteOutline.vue';
const props = defineProps({ note: Object });
const lightbox = ref(null);
const tocDetails = ref(null);
const compactToc = window.matchMedia('(width < 1100px)');
const toc = computed(() => noteOutline(props.note.sections));
const field = (index,key) => `items.${props.note.contentIndex}.sections.${index}.${key}`;
function photo(section,event) { lightbox.value.open([{src:contentImage(section.image),alt:section.alt,caption:section.caption}],0,event); }

function closeToc(restoreFocus = false) {
  if (!compactToc.matches || !tocDetails.value?.open) return;
  tocDetails.value.open = false;
  if (restoreFocus) tocDetails.value.querySelector('summary').focus({ preventScroll: true });
}

function updateTocLayout() {
  if (compactToc.matches) {
    closeToc(tocDetails.value?.contains(document.activeElement));
  } else if (tocDetails.value) {
    tocDetails.value.open = true;
  }
}

function dismissTocOutside(event) {
  if (tocDetails.value && !tocDetails.value.contains(event.target)) closeToc();
}

function dismissTocOnEscape(event) {
  if (!compactToc.matches || !tocDetails.value?.open) return;
  event.preventDefault();
  event.stopPropagation();
  closeToc(true);
}

function followTocLink(event) {
  if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.target.closest('a[href]')) closeToc();
}

onMounted(() => {
  compactToc.addEventListener('change', updateTocLayout);
  document.addEventListener('pointerdown', dismissTocOutside);
  document.addEventListener('focusin', dismissTocOutside);
});

onUnmounted(() => {
  compactToc.removeEventListener('change', updateTocLayout);
  document.removeEventListener('pointerdown', dismissTocOutside);
  document.removeEventListener('focusin', dismissTocOutside);
});
</script>
<template>
  <div class="unity-reading-layout">
    <details v-if="toc.length" ref="tocDetails" class="unity-toc" :open="!compactToc.matches" @keydown.esc="dismissTocOnEscape">
      <summary>
        <span class="unity-toc-desktop-label">这一页的目录</span>
        <span class="unity-toc-compact-label">目录</span>
      </summary>
      <nav aria-label="笔记章节目录" @click="followTocLink"><NoteOutline :items="toc" /></nav>
    </details>
    <article class="unity-article">
      <p v-if="note.draft" class="unity-draft">草稿预览 · 正式构建不包含此篇</p>
      <div class="unity-article-meta"><span v-if="note.category">{{ note.category }}</span><time v-if="note.date" :datetime="note.date">更新于 {{ note.date }}</time></div>
      <ContentText tag="h1" tabindex="-1" class="display" plain :value="note.title" :block-id="note.blockId" :field="`items.${note.contentIndex}.title`" />
      <ContentText v-if="note.summary" class="unity-article-summary" plain :value="note.summary" :block-id="note.blockId" :field="`items.${note.contentIndex}.summary`" />
      <p v-if="!note.sections.length" class="unity-empty">这一页还没有正文。</p>
      <section v-for="(section,index) in note.sections" :key="section.id" :id="`section-${section.id}`" class="unity-article-section" tabindex="-1">
        <ContentText v-if="section.heading" :tag="`h${sectionHeadingLevel(section)}`" plain :value="section.heading" :block-id="note.blockId" :field="field(index,'heading')" />
        <ContentText v-if="section.body" class="rich-body body-copy" :value="section.body" :block-id="note.blockId" :field="field(index,'body')" />
        <ContentText v-if="section.callout" class="unity-callout rich-body" :value="section.callout" :block-id="note.blockId" :field="field(index,'callout')" />
        <NoteCode v-if="section.code" :code="section.code" :language="section.language" />
        <figure v-if="section.image" class="unity-screenshot"><button :aria-label="`查看大图：${section.alt || section.caption || '笔记截图'}`" @click="photo(section,$event)"><img :src="contentImage(section.image)" :alt="section.alt" loading="lazy" /></button><ContentText tag="figcaption" :value="section.caption" :block-id="note.blockId" :field="field(index,'caption')" /></figure>
      </section>
    </article>
    <ImageLightbox ref="lightbox" />
  </div>
</template>
