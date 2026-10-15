<script setup>
import { onMounted, ref, watch } from "vue";
import { cleanRichText } from "../content/richText";
const props = defineProps({ value: String, label: String, multiline: Boolean });
const emit = defineEmits(["change"]);
const root = ref(null);
function sync() {
  const html = cleanRichText(props.value || "");
  if (root.value && document.activeElement !== root.value && root.value.innerHTML !== html) root.value.innerHTML = html;
}
function change() { emit("change", cleanRichText(root.value.innerHTML)); }
function paste(event) { event.preventDefault(); document.execCommand("insertText", false, event.clipboardData.getData("text/plain")); }
onMounted(sync); watch(() => props.value, sync);
</script>
<template>
  <div ref="root" class="ed-rich" :class="{ 'ed-rich-multiline': multiline }" role="textbox" :aria-label="label" :aria-multiline="multiline" contenteditable="true" @input="change" @paste="paste" @blur="sync" />
</template>
