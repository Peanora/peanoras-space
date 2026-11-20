<script setup>
import { nextTick, ref, shallowRef } from 'vue';
import { littleNotes, littleNotesStatus, loadLittleNotes, saveLittleNote } from '../../content/littleNotes.js';
import { cleanRichText } from '../../content/richText.js';
import { getTodoClient } from '../../todo/client.js';
import ContentText from './ContentText.vue';
import '../../styles/little-note-editor.css';

const draft = ref(null), saving = ref(false), conflict = ref(false);
const message = ref(''), error = ref('');
const textarea = ref(null), summary = ref(null);
const editorTrigger = shallowRef(null);

function originalText(value) {
  const content = document.createElement('template');
  content.innerHTML = cleanRichText(value);
  content.content.querySelectorAll('br').forEach(line => line.replaceWith('\n'));
  content.content.querySelectorAll('div, p, li').forEach(line => line.after('\n'));
  return content.content.textContent.trim();
}

async function edit(note, event) {
  if (draft.value || littleNotesStatus.value !== 'ready') return;
  error.value = '';
  message.value = '';
  conflict.value = false;
  editorTrigger.value = event.currentTarget;
  draft.value = note ? {
    ...note,
    text: note.revision ? note.text : originalText(note.text),
    source: note.revision ? note.source : originalText(note.source),
  } : { id: `note-${crypto.randomUUID()}`, text: '', source: '', rare: false };
  await nextTick();
  textarea.value?.focus();
}

async function close() {
  draft.value = null;
  error.value = '';
  await nextTick();
  const target = editorTrigger.value;
  if (target?.isConnected && !target.disabled) target.focus();
  else summary.value?.focus();
  editorTrigger.value = null;
}

async function save() {
  if (!draft.value || saving.value || conflict.value || littleNotesStatus.value !== 'ready') return;
  const note = { ...draft.value, text: draft.value.text.trim(), source: draft.value.source.trim() };
  if (!note.text || [...note.text].length > 600 || [...note.source].length > 80) {
    error.value = '正文需要 1–600 个字符，来源最多 80 个字符。';
    return;
  }
  saving.value = true;
  error.value = '';
  try {
    await saveLittleNote(getTodoClient(), note);
    saving.value = false;
    await close();
    message.value = '纸条已保存。';
  } catch (failure) {
    if (failure?.message === 'little_note_conflict') {
      conflict.value = true;
      await loadLittleNotes();
      error.value = '这张纸条已有新版本。你输入的内容仍在表单里，可复制后重新打开编辑。';
    } else {
      error.value = '保存失败，输入已保留。请重试。';
    }
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <details class="little-editor">
    <summary ref="summary">管理纸条</summary>
    <div class="little-editor-content">
      <p v-if="littleNotesStatus === 'loading' && !draft" role="status">正在读取纸条…</p>
      <div v-if="littleNotesStatus === 'error'" class="little-editor-actions">
        <p role="alert">暂时无法读取线上纸条。</p>
        <button type="button" class="plain-button" @click="loadLittleNotes">重试</button>
      </div>
      <template v-if="littleNotesStatus === 'ready' || draft">
        <form v-if="draft" class="little-editor-form" @submit.prevent="save">
          <label for="little-editor-text">纸条正文</label>
          <textarea id="little-editor-text" ref="textarea" v-model="draft.text" rows="4" required :disabled="saving" />
          <label for="little-editor-source">来源（可选）</label>
          <input id="little-editor-source" v-model="draft.source" :disabled="saving" />
          <label class="little-editor-rare"><input v-model="draft.rare" type="checkbox" :disabled="saving" />设为彩蛋纸条</label>
          <div class="little-editor-actions">
            <button class="plain-button little-editor-publish" :disabled="saving || conflict || littleNotesStatus !== 'ready'">{{ saving ? '正在保存…' : '保存到网站' }}</button>
            <button type="button" class="plain-button" :disabled="saving" @click="close">取消</button>
          </div>
          <p v-if="error" role="alert" class="little-editor-feedback">{{ error }}</p>
        </form>
        <button v-else type="button" class="plain-button little-editor-publish" @click="edit(null, $event)">添加纸条</button>
        <p v-if="message" role="status" class="little-editor-feedback">{{ message }}</p>
        <ul v-if="littleNotes.length" class="little-editor-list" aria-label="纸条列表">
          <li v-for="note in littleNotes" :key="note.id">
            <div>
              <ContentText tag="p" :value="note.text" :plain="Boolean(note.revision)" />
              <small v-if="note.rare">彩蛋纸条</small>
            </div>
            <button type="button" class="plain-button" :disabled="Boolean(draft)" @click="edit(note, $event)">修改</button>
          </li>
        </ul>
      </template>
    </div>
  </details>
</template>
