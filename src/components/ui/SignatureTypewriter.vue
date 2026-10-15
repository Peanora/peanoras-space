<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { createTypewriter, splitGraphemes } from "../../utils/typewriter";
const props = defineProps({
  phrases: { type: Array, default: () => [] },
  paused: Boolean,
  reduced: Boolean,
});
const lines = computed(() =>
  props.phrases.filter((line) => typeof line === "string" && line.trim()),
);
let writer = createTypewriter(lines.value);
const frame = ref({ text: "", delay: 450, phase: "typing" });
const characters = computed(() =>
  splitGraphemes(props.reduced ? lines.value[0] || "" : frame.value.text),
);
let timer;
let mounted = false;
function schedule() {
  clearTimeout(timer);
  if (
    !mounted ||
    props.paused ||
    props.reduced ||
    !lines.value.length ||
    frame.value.delay === null
  )
    return;
  timer = setTimeout(() => {
    frame.value = writer.next();
    schedule();
  }, frame.value.delay);
}
watch(() => [props.paused, props.reduced], schedule);
watch(lines, () => {
  writer = createTypewriter(lines.value);
  frame.value = { text: "", delay: 450, phase: "typing" };
  schedule();
});
onMounted(() => {
  mounted = true;
  schedule();
});
onUnmounted(() => {
  mounted = false;
  clearTimeout(timer);
});
</script>
<template>
  <p
    v-if="lines.length"
    class="cover-signature"
    :class="{ 'signature-paused': paused, 'signature-static': reduced }"
    :data-phase="reduced ? 'static' : frame.phase"
  >
    <span class="sr-only">个性签名：{{ lines.join("；") }}</span>
    <span class="signature-reserve" aria-hidden="true"
      ><span v-for="(line, index) in lines" :key="index">{{ line }}</span></span
    >
    <span class="signature-visual" aria-hidden="true"
      ><span
        v-for="(character, index) in characters"
        :key="index"
        class="signature-character"
        >{{ character }}</span
      ><span class="signature-cursor ambient-loop"></span
    ></span>
  </p>
</template>
