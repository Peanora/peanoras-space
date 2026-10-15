<script setup>
import RichField from "./RichField.vue";
import { clone, newProject } from "../content/model";
import { contentImage } from "../content/assets";
const props = defineProps({ value: Object, fields: Array, prefix: { default: "" }, images: Array });
const emit = defineEmits(["change", "upload"]);
const path = (key) => props.prefix ? `${props.prefix}.${key}` : key;
function set(key, value) { emit("change", path(key), value); }
function append(field) {
  const item = field.template ? clone(field.template) : newProject(crypto.randomUUID());
  if (field.key === "items" && !item.id) item.id = crypto.randomUUID();
  set(field.key, [...props.value[field.key], item]);
}
function remove(field, index) { set(field.key, props.value[field.key].filter((_, i) => i !== index)); }
function move(field, index, offset) {
  const items = clone(props.value[field.key]);
  [items[index], items[index + offset]] = [items[index + offset], items[index]];
  set(field.key, items);
}
</script>
<template>
  <div v-for="field in fields" :key="field.key" class="ed-field">
    <label v-if="field.type !== 'check'" :for="`field-${path(field.key)}`">{{ field.label }}</label>
    <RichField v-if="field.type === 'rich'" :value="value[field.key]" :label="field.label" :multiline="field.multiline" @change="set(field.key, $event)" />
    <input v-else-if="field.type === 'text'" :id="`field-${path(field.key)}`" :value="value[field.key]" @input="set(field.key, $event.target.value)" />
    <label v-else-if="field.type === 'check'" class="ed-checkbox"><input type="checkbox" :checked="value[field.key]" @change="set(field.key, $event.target.checked)" />{{ field.label }}</label>
    <template v-else-if="field.type === 'strings'">
      <div v-for="(item, index) in value[field.key]" :key="index" class="ed-string-row">
        <RichField :value="item" :label="`${field.label} ${index + 1}`" @change="emit('change', `${path(field.key)}.${index}`, $event)" />
        <button :aria-label="`删除${field.label} ${index + 1}`" @click="remove(field, index)">×</button>
      </div>
      <button class="ed-add" @click="set(field.key, [...value[field.key], '新条目'])">＋ 添加条目</button>
    </template>
    <template v-else-if="field.type === 'image'">
      <img v-if="value[field.key]" class="ed-image-thumb" :src="contentImage(value[field.key])" alt="当前图片预览" />
      <select :id="`field-${path(field.key)}`" :value="value[field.key]" @change="set(field.key, $event.target.value)">
        <option value="">不显示图片</option><option value="builtin:photo">占位插画</option><option value="builtin:project">占位项目封面</option>
        <option v-for="(item, index) in images" :key="item.src" :value="item.src">上传图片 {{ index + 1 }} · {{ Math.round(item.bytes / 1024) }} KB</option>
      </select>
      <label class="ed-upload">选择本地图片<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" @change="emit('upload', path(field.key), $event.target.files[0]); $event.target.value = ''" /></label>
    </template>
    <template v-else-if="field.type === 'list'">
      <details v-for="(item, index) in value[field.key]" :key="item.id || index" class="ed-item" :open="index === 0">
        <summary>{{ field.label }} {{ index + 1 }}</summary>
        <div class="ed-item-actions"><button :disabled="index === 0" aria-label="条目上移" @click="move(field, index, -1)">↑</button><button :disabled="index === value[field.key].length - 1" aria-label="条目下移" @click="move(field, index, 1)">↓</button><button @click="remove(field, index)">删除条目</button></div>
        <InspectorFields :value="item" :fields="field.fields" :prefix="`${path(field.key)}.${index}`" :images="images" @change="(key, value) => emit('change', key, value)" @upload="(key, file) => emit('upload', key, file)" />
      </details>
      <button class="ed-add" @click="append(field)">＋ 添加{{ field.label }}</button>
    </template>
  </div>
</template>
