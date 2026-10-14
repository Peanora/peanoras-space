<script setup>
import { ref, nextTick, onBeforeUnmount } from "vue";

const dialog = ref(null);
const photos = ref([]);
const index = ref(0);
let opener = null;
let oldOverflow = "";
let locked = false;
async function open(items, startIndex = 0, event) {
  if (!items.length) return;
  photos.value = items;
  index.value = startIndex;
  opener = event?.currentTarget || document.activeElement;
  await nextTick();
  oldOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  locked = true;
  dialog.value.showModal();
}
function restore() {
  if (!locked) return;
  document.body.style.overflow = oldOverflow;
  locked = false;
  opener?.focus({ preventScroll: true });
}
function close() {
  dialog.value?.close();
}
function move(direction) {
  index.value =
    (index.value + direction + photos.value.length) % photos.value.length;
}
function keydown(event) {
  if (event.key === "Tab") {
    const controls = [
      ...dialog.value.querySelectorAll(
        "button:not([disabled]), a[href], [tabindex='0']",
      ),
    ];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
    return;
  }
  if (photos.value.length < 2) return;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    move(1);
  }
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    move(-1);
  }
}
onBeforeUnmount(restore);
defineExpose({ open });
</script>
<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="lightbox"
      aria-label="照片大图"
      @close="restore"
      @keydown="keydown"
      @click="$event.target === dialog && close()"
    >
      <div class="lightbox-toolbar">
        <span class="eyebrow"
          >{{ String(index + 1).padStart(2, "0") }} /
          {{ String(photos.length).padStart(2, "0") }}</span
        ><button class="lightbox-close" autofocus @click="close">
          关闭 <span aria-hidden="true">×</span>
        </button>
      </div>
      <figure v-if="photos[index]" class="lightbox-figure">
        <img
          :key="photos[index].src"
          :src="photos[index].src"
          :alt="photos[index].alt"
        />
        <figcaption aria-live="polite">
          {{ photos[index].caption || photos[index].alt }}
        </figcaption>
      </figure>
      <div v-if="photos.length > 1" class="lightbox-controls">
        <button class="plain-button" @click="move(-1)">← 上一张</button
        ><button class="plain-button" @click="move(1)">下一张 →</button>
      </div>
    </dialog>
  </Teleport>
</template>
