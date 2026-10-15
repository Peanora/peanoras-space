<script setup>
import { onMounted, ref, watch } from "vue";
import { cleanRichText } from "../../content/richText";
import { contentDocument, editingContent, publishEditorEvent } from "../../content/store";
import { setField } from "../../content/model";
const props = defineProps({ value: { default: "" }, tag: { default: "div" }, blockId: String, field: String });
const isDev = import.meta.env.DEV;
const element = ref(null);
function update() {
  if (!import.meta.env.DEV) return;
  const html = cleanRichText(element.value.innerHTML);
  const page = contentDocument.value.pages.world;
  const target = props.blockId === "__page" ? page : page.blocks.find((block) => block.id === props.blockId)?.data;
  if (!target || !props.field) return;
  setField(target, props.field, html);
  publishEditorEvent({ type: "field", blockId: props.blockId, field: props.field, value: html });
}
function focus() { publishEditorEvent({ type: "select", blockId: props.blockId, field: props.field }); }
function sync() {
  if (!element.value) return;
  const html = cleanRichText(props.value);
  if (element.value.innerHTML !== html && (document.activeElement !== element.value || !document.hasFocus())) element.value.innerHTML = html;
}
onMounted(sync);
watch(() => props.value, sync);
</script>
<template>
  <component :is="tag" ref="element" :contenteditable="isDev && editingContent && field ? 'true' : undefined"
    :data-edit-field="isDev && editingContent ? field : undefined" :data-edit-block="isDev && editingContent ? blockId : undefined"
    :spellcheck="isDev && editingContent ? false : undefined" @pointerdown="focus" @keyup.tab="focus" @input="update" @blur="sync" />
</template>
