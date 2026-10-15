<script setup>
import { ref, computed } from "vue";
import { contentDocument } from "../../content/store";
import { pageItems } from "../../content/selectors";
import ContentText from "./ContentText.vue";
import ArtworkImage from "../ui/ArtworkImage.vue";
defineProps({ screen: { type: Object, required: true } });
const noteOpen = ref(false);
const note = computed(() => pageItems(contentDocument.value, "little", "notes")[0] || { text: "", source: "" });
</script>

<template>
  <div class="home-scene" :class="`scene-${screen.kind}`">
    <template v-if="screen.kind === 'world'">
      <span class="scene-handnote" aria-hidden="true"
        >a little work in progress</span
      >
      <figure class="notebook-art scene-paper">
        <div class="notebook-top">
          <span>MY WORLD</span><span>01 / NOTEBOOK</span>
        </div>
        <RouterLink
          :to="screen.path"
          :aria-label="screen.action"
          class="scene-image-link"
        >
          <ArtworkImage
            v-if="screen.image"
            :src="screen.image"
            :alt="screen.alt"
            :style="{ objectPosition: screen.imagePosition }"
            width="1000"
            height="640"
          />
          <span class="artwork-open" aria-hidden="true">↗</span>
        </RouterLink>
        <figcaption>
          <span>{{ screen.artworkNote }} · 插画壁纸</span
          ><span>↳ 个人世界</span>
        </figcaption>
      </figure>
      <div class="notebook-tabs" aria-label="个人世界内容">
        <span v-for="(tag, index) in screen.tags" :key="index">{{ tag }}</span>
      </div>
    </template>
    <template v-else-if="screen.kind === 'music'">
      <div class="record-sleeve" aria-hidden="true">
        <div class="vinyl-disc ambient-loop">
          <div class="vinyl-label">
            <ArtworkImage v-if="screen.image" :src="screen.image" thumbnail alt="" /><span></span>
          </div>
        </div>
      </div>
      <figure class="music-photo scene-paper">
        <div class="artwork-tape" aria-hidden="true"></div>
        <RouterLink
          :to="screen.path"
          :aria-label="screen.action"
          class="scene-image-link"
        >
          <ArtworkImage
            v-if="screen.image"
            :src="screen.image"
            :alt="screen.alt"
            :style="{ objectPosition: screen.imagePosition }"
            width="1000"
            height="640"
          />
          <span class="artwork-open" aria-hidden="true">↗</span>
        </RouterLink>
        <figcaption>
          <span>{{ screen.artworkNote }}</span
          ><span>插画壁纸</span>
        </figcaption>
      </figure>
      <p class="music-handnote">Music, kept close.</p>
      <p class="scene-material-note">唱片造型 · 插画素材，无音频播放</p>
    </template>
    <template v-else>
      <figure class="little-photo scene-paper">
        <ArtworkImage v-if="screen.image" :src="screen.image" :alt="screen.alt" width="1000" height="640" />
        <figcaption>{{ screen.artworkNote }} · 插画壁纸</figcaption>
      </figure>
      <button
        class="note-sheet"
        :class="{ 'is-open': noteOpen }"
        :aria-pressed="noteOpen"
        @click="noteOpen = !noteOpen"
      >
        <span class="note-pin" aria-hidden="true"></span>
        <span class="note-number">A LITTLE NOTE / 01</span>
        <Transition name="note" mode="out-in">
          <span v-if="noteOpen" key="open" class="note-content"
            ><ContentText tag="span" class="note-quote" :value="note.text" />
            <ContentText tag="span" class="note-source" :value="note.source" /></span
          >
          <span v-else key="closed" class="note-content"
            ><span class="note-doodle" aria-hidden="true">✳</span
            ><span class="note-invitation">有一张纸条，留在这里。</span></span
          >
        </Transition>
        <span class="note-action"
          >{{ noteOpen ? "收好纸条" : "翻开看看" }}
          <span aria-hidden="true">↗</span></span
        >
      </button>
      <span class="little-handnote" aria-hidden="true"
        >small things, soft days.</span
      >
    </template>
  </div>
</template>
