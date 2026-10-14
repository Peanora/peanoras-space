<script setup>
import { ref } from "vue";
import { appearance } from "../../data/appearance";
import { useAppearance } from "../../composables/useAppearance";
const open = ref(false);
const toggle = ref(null);
const { wallpaper, selectWallpaper, notice } = useAppearance();
function close(event) {
  if (event.key === "Escape" && open.value) {
    event.stopPropagation();
    open.value = false;
    toggle.value?.focus();
  }
}
</script>
<template>
  <div class="wallpaper-picker" @keydown="close">
    <button
      ref="toggle"
      class="wallpaper-toggle"
      :aria-expanded="open"
      aria-controls="wallpaper-options"
      @click="open = !open"
    >
      <span
        class="wallpaper-swatch"
        :style="{ background: wallpaper.color }"
        aria-hidden="true"
      ></span>
      {{ wallpaper.name }} <span class="wallpaper-toggle-label">换张壁纸</span
      ><span aria-hidden="true">{{ open ? "−" : "+" }}</span>
    </button>
    <div
      v-if="open"
      id="wallpaper-options"
      class="wallpaper-options"
      role="group"
      aria-label="选择壁纸"
    >
      <p class="wallpaper-hint">选一张喜欢的画面。壁纸始终保持浅淡。</p>
      <div class="wallpaper-choices">
        <button
          v-for="item in appearance.wallpapers"
          :key="item.id"
          :aria-pressed="wallpaper.id === item.id"
          @click="selectWallpaper(item.id)"
        >
          <span
            class="wallpaper-swatch"
            :style="{ background: item.color }"
            aria-hidden="true"
          ></span
          >{{ item.name
          }}<span
            v-if="wallpaper.id === item.id"
            class="wallpaper-check"
            aria-hidden="true"
            >✓</span
          >
        </button>
      </div>
      <p class="wallpaper-feedback" role="status">
        {{ notice || "选择保存在当前浏览器。" }}
      </p>
    </div>
  </div>
</template>
