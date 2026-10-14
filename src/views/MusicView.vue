<script setup>
import { ref } from "vue";
import { songs } from "../data/songs";
import { memories } from "../data/memories";
import { gallery } from "../data/gallery";
import SongEntry from "../components/content/SongEntry.vue";
import MemoryEntry from "../components/content/MemoryEntry.vue";
import PhotoGallery from "../components/content/PhotoGallery.vue";
import ImageLightbox from "../components/ui/ImageLightbox.vue";
import SectionNavigation from "../components/ui/SectionNavigation.vue";
import { useScrollReveal } from "../composables/useScrollReveal";
const lightbox = ref(null);
const sections = [
  { label: "Songs", hash: "#songs" },
  { label: "Live", hash: "#live" },
  { label: "Photographs", hash: "#photographs" },
];
function openPhoto(items, index, event) {
  lightbox.value.open(items, index, event);
}
useScrollReveal();
</script>
<template>
  <div class="shell music-view">
    <header class="page-heading">
      <p class="eyebrow">02 / 音乐与回忆</p>
      <h1 class="display" tabindex="-1">
        Music &<br /><span class="title-indent">Memories</span>
      </h1>
      <SectionNavigation :items="sections" />
    </header>
    <section id="songs" class="content-section" tabindex="-1">
      <div class="section-heading">
        <h2 class="display">On Repeat</h2>
        <span class="muted small">喜欢的歌曲 / hanser</span>
      </div>
      <SongEntry
        v-for="(song, index) in songs"
        :key="song.id"
        :song="song"
        :index="index"
      />
      <p v-if="!songs.length" class="empty-note">歌曲收藏正在整理。</p>
    </section>
    <section id="live" class="content-section" tabindex="-1">
      <div class="section-heading">
        <h2 class="display">Live, Remembered</h2>
        <span class="muted small">演唱会回忆</span>
      </div>
      <MemoryEntry
        v-for="memory in memories"
        :key="memory.id"
        :memory="memory"
        @open-photo="openPhoto"
      />
      <p v-if="!memories.length" class="empty-note">现场回忆正在整理。</p>
    </section>
    <section id="photographs" class="content-section" tabindex="-1">
      <div class="section-heading">
        <h2 class="display">Fragments</h2>
        <span class="muted small">照片与纪念</span>
      </div>
      <PhotoGallery :photos="gallery" @open-photo="openPhoto" />
      <p v-if="!gallery.length" class="empty-note">照片等待添加。</p>
    </section>
    <p class="music-disclaimer">
      非官方个人音乐与回忆空间。当前歌曲封面与回忆照片为占位素材；插画背景由本人提供，正式音乐内容将使用原创、授权素材或官方平台链接。
    </p>
    <nav class="next-chapter" aria-label="继续浏览">
      <span class="eyebrow">NEXT / 我的个人世界</span
      ><RouterLink to="/world" class="display"
        >My World <span aria-hidden="true">↗</span></RouterLink
      >
    </nav>
    <ImageLightbox ref="lightbox" />
  </div>
</template>
