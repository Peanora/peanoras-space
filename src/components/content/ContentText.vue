<script setup>
import { inject, onMounted, ref, watch } from "vue";
import { cleanRichText } from "../../content/richText";
import { contentDocument, editingContent, publishEditorEvent } from "../../content/store";
import { setField } from "../../content/model";
import { contentTarget } from "../../content/pages";
const props = defineProps({ value: { default: "" }, tag: { default: "div" }, blockId: String, field: String, plain: Boolean });
const pageId = inject("content-page", "world");
const isDev = import.meta.env.DEV;
const element = ref(null);
function update() {
  if (!import.meta.env.DEV) return;
  const html = props.plain ? element.value.innerText : cleanRichText(element.value.innerHTML);
  const target = contentTarget(contentDocument.value, pageId, props.blockId);
  if (!target || !props.field) return;
  setField(target, props.field, html);
  publishEditorEvent({ type: "field", pageId, blockId: props.blockId, field: props.field, value: html });
}
function focus() {
  if (!import.meta.env.DEV || !editingContent.value || !props.field) return;
  publishEditorEvent({ type: "select", pageId, blockId: props.blockId, field: props.field });
}
function sync() {
  if (!element.value) return;
  const key = props.plain ? 'textContent' : 'innerHTML';
  const html = props.plain ? String(props.value || '') : cleanRichText(props.value);
  if (element.value[key] !== html && (document.activeElement !== element.value || !document.hasFocus())) element.value[key] = html;
}
onMounted(sync);
watch(() => props.value, sync);
</script>
<template>
  <component :is="tag" ref="element" :contenteditable="isDev && editingContent && field ? 'true' : undefined"
    :data-edit-field="isDev && editingContent ? field : undefined" :data-edit-block="isDev && editingContent ? blockId : undefined"
    :data-edit-plain="isDev && editingContent && plain ? 'true' : undefined"
    :spellcheck="isDev && editingContent ? false : undefined" @pointerdown="focus" @keyup.tab="focus" @input="update" @blur="sync" />
</template>
