<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { blockTypes, clone, createBlock, safeLink, setField, validateContent, restoreContent, neteaseSongId } from "../content/model";
import { createHistory } from "./history";
import { layouts, schemas, pageFields } from "./schema";
import InspectorFields from "./InspectorFields.vue";
import { contentPages, contentTarget } from "../content/pages";

const draft = ref(null), selectedId = ref("__page"), frame = ref(null);
const inspector = ref(null);
const pageId = ref("world");
const images = ref([]), error = ref(""), notice = ref(""), saving = ref(false), uploading = ref(false);
const mobile = ref(false), editing = ref(true), addType = ref("text"), linkUrl = ref("");
const history = createHistory(), historyVersion = ref(0);
const canUndo = computed(() => { historyVersion.value; return history.canUndo; });
const canRedo = computed(() => { historyVersion.value; return history.canRedo; });
let token = "", revision = "", dragState = null, suppressClickUntil = 0;
const dropIndex = ref(-1);
const saved = ref("");
const page = computed(() => draft.value?.pages[pageId.value]);
const pageConfig = computed(() => contentPages[pageId.value]);
const availableTypes = computed(() => Object.fromEntries(pageConfig.value.types.filter((type) => type !== "notes" || !page.value?.blocks.some((block) => block.type === "notes")).map((type) => [type, blockTypes[type]])));
const frameUrl = computed(() => `${pageConfig.value.path}?__editor_preview=1`);
const selected = computed(() => page.value?.blocks.find((block) => block.id === selectedId.value));
const isDirty = computed(() => !!draft.value && JSON.stringify(draft.value) !== saved.value);
const layoutChoices = computed(() => layouts[selected.value?.type] || [["original", "默认布局"]]);
const hasImage = computed(() => ["image", "split", "projects", "songs", "gallery", "memories"].includes(selected.value?.type));

async function api(path, options = {}) {
  const response = await fetch(`/__editor/api/${path}`, {
    ...options, headers: { "X-Peanora-Editor": "1", "X-Peanora-Token": token, ...options.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `操作失败（${response.status}）`);
  return body;
}
function post(message) { frame.value?.contentWindow?.postMessage({ source: "peanora-editor", ...message }, location.origin); }
function sync(resetFocus = false) {
  if (draft.value) post({ type: "draft", document: clone(draft.value), pageId: pageId.value, editing: editing.value, selected: selectedId.value, resetFocus });
}
function mutate(change, key = "") {
  history.record(draft.value, key);
  change(); historyVersion.value++; notice.value = "";
}
function fieldChange(path, value) {
  if (!selected.value) return;
  mutate(() => {
    setField(selected.value.data, path, value);
    if (selected.value.type === "songs" && path.endsWith(".officialUrl")) {
      setField(selected.value.data, path.replace(/officialUrl$/, "neteaseId"), neteaseSongId(value));
    }
  }, `${pageId.value}:${selectedId.value}:${path}`);
}
function metadata(key, value) { mutate(() => { selected.value[key] = value; }); }
function layout(key, value) { mutate(() => { selected.value.layout[key] = value; }, `layout:${selectedId.value}:${key}`); }
function select(id) { selectedId.value = id; if (id !== "__page") post({ type: "select", pageId: pageId.value, blockId: id }); }
function selectPage(id) { pageId.value = id; selectedId.value = "__page"; addType.value = Object.keys(availableTypes.value)[0] || "text"; }
function pageChange(path, value) { mutate(() => setField(page.value, path, value), `${pageId.value}:page:${path}`); }
function add() {
  const block = createBlock(addType.value, `block-${crypto.randomUUID()}`);
  mutate(() => { page.value.blocks.push(block); selectedId.value = block.id; });
  nextTick(() => post({ type: "select", pageId: pageId.value, blockId: block.id }));
}
function duplicate() {
  const index = page.value.blocks.indexOf(selected.value), copy = clone(selected.value);
  copy.id = `block-${crypto.randomUUID()}`; copy.label += " · 副本";
  mutate(() => { page.value.blocks.splice(index + 1, 0, copy); selectedId.value = copy.id; });
}
function remove() {
  const index = page.value.blocks.indexOf(selected.value);
  mutate(() => { page.value.blocks.splice(index, 1); selectedId.value = "__page"; });
}
function move(id, targetIndex) {
  const from = page.value.blocks.findIndex((block) => block.id === id);
  if (from < 0 || from === targetIndex || targetIndex < 0 || targetIndex >= page.value.blocks.length) return;
  mutate(() => { const [block] = page.value.blocks.splice(from, 1); page.value.blocks.splice(targetIndex, 0, block); });
}
function beginDrag(event, id) {
  if (pageConfig.value.fixed || event.button !== 0) return;
  dragState = { id, x: event.clientX, y: event.clientY, moved: false };
  event.currentTarget.setPointerCapture(event.pointerId);
}
function updateDrag(event) {
  if (!dragState) return;
  if (Math.hypot(event.clientX - dragState.x, event.clientY - dragState.y) < 8 && !dragState.moved) return;
  dragState.moved = true;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-order-id]');
  dropIndex.value = target ? page.value.blocks.findIndex((block) => block.id === target.dataset.orderId) : -1;
}
function endDrag(event) {
  if (!dragState) return;
  if (dragState.moved) { if (dropIndex.value >= 0) move(dragState.id, dropIndex.value); suppressClickUntil = performance.now() + 150; }
  dragState = null; dropIndex.value = -1;
  if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
}
function blockClick(id) { if (performance.now() >= suppressClickUntil) select(id); }
function undo() { document.activeElement?.blur(); const value = history.undo(draft.value); if (value) { draft.value = value; historyVersion.value++; sync(true); } }
function redo() { document.activeElement?.blur(); const value = history.redo(draft.value); if (value) { draft.value = value; historyVersion.value++; sync(true); } }
async function save() {
  if (!draft.value || saving.value) return;
  error.value = ""; notice.value = "";
  try {
    const document = clone(draft.value);
    validateContent(document); saving.value = true;
    const result = await api("content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ document, revision }) });
    revision = result.revision; saved.value = JSON.stringify(document);
    notice.value = "已保存到项目。上一版本已自动备份。";
  } catch (problem) { error.value = problem.message; }
  finally { saving.value = false; }
}
async function upload(path, file) {
  if (!file || uploading.value) return;
  const blockId = selectedId.value;
  const uploadPage = pageId.value;
  uploading.value = true; error.value = "";
  try {
    if (file.size > 12 * 1024 * 1024) throw new Error("图片超过 12 MB，请先缩小图片。");
    let body = file;
    if (file.type !== "image/gif") {
      const bitmap = await createImageBitmap(file);
      try {
        const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        body = await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("图片处理失败")), "image/webp", .84));
      } finally { bitmap.close(); }
    }
    const result = await api("images", { method: "POST", body, headers: { "Content-Type": body.type || "application/octet-stream" } });
    images.value.push(result);
    const target = draft.value.pages[uploadPage].blocks.find((block) => block.id === blockId);
    if (target) mutate(() => setField(target.data, path, result.src));
    notice.value = "图片已存入项目资源目录；请保存以应用到页面。";
  } catch (problem) { error.value = problem.message; }
  finally { uploading.value = false; }
}
function format(command) {
  if (command === "createLink" && !safeLink(linkUrl.value)) { error.value = "请先填写有效的 https、mailto 或站内链接。"; return; }
  post({ type: "format", command, value: command === "createLink" ? linkUrl.value : undefined });
}
function exportDraft() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(draft.value, null, 2)], { type: "application/json" }));
  const anchor = document.createElement("a"); anchor.href = url; anchor.download = "peanora-content-draft.json"; anchor.click(); URL.revokeObjectURL(url);
}
async function importDraft(event) {
  const file = event.target.files[0]; event.target.value = "";
  if (!file) return;
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error("草稿超过 2 MB。");
    const imported = JSON.parse(await file.text());
    const content = restoreContent(imported, draft.value);
    mutate(() => { draft.value = content; selectedId.value = "__page"; });
    notice.value = imported.version === 1 ? "已恢复旧版 My World 草稿；其他页面保留当前内容。请预览后保存。" : "已导入全站草稿，请预览确认后保存。";
  } catch (problem) { error.value = `导入失败：${problem.message}`; }
}
function message(event) {
  if (event.origin !== location.origin || event.source !== frame.value?.contentWindow || event.data?.source !== "peanora-preview") return;
  const data = event.data;
  if (data.type === "ready") { sync(); if (selectedId.value !== "__page") select(selectedId.value); }
  if (data.pageId && data.pageId !== pageId.value) return;
  if (data.type === "select") selectedId.value = data.blockId;
  if (data.type === "notice") notice.value = data.text;
  if (data.type === "field") {
    const target = contentTarget(draft.value, pageId.value, data.blockId);
    if (!target || typeof data.value !== "string") return;
    try { mutate(() => setField(target, data.field, data.value), `${pageId.value}:${data.blockId}:${data.field}`); }
    catch { error.value = "此字段已被删除，草稿未受影响。"; }
  }
  if (data.type === "shortcut") ({ save, undo, redo })[data.action]?.();
}
function keydown(event) {
  if (!(event.ctrlKey || event.metaKey)) return;
  const key = event.key.toLowerCase();
  if (key === "s") { event.preventDefault(); save(); }
  if (key === "z" || key === "y") { event.preventDefault(); key === "y" || event.shiftKey ? redo() : undo(); }
}
function beforeUnload(event) { if (isDirty.value || uploading.value) { event.preventDefault(); event.returnValue = ""; } }
watch([draft, pageId, selectedId, editing], () => sync(), { deep: true, flush: "post" });
watch(selectedId, () => nextTick(() => inspector.value?.scrollTo({ top: 0 })));
onMounted(async () => {
  document.title = "内容工作台 · Peanora's Space";
  window.addEventListener("message", message); window.addEventListener("keydown", keydown); window.addEventListener("beforeunload", beforeUnload);
  try {
    token = (await api("session")).token;
    const result = await api("content");
    validateContent(result.document); revision = result.revision; saved.value = JSON.stringify(result.document); draft.value = result.document;
    images.value = (await api("images")).images;
  } catch (problem) { error.value = problem.message; }
});
onBeforeUnmount(() => { window.removeEventListener("message", message); window.removeEventListener("keydown", keydown); window.removeEventListener("beforeunload", beforeUnload); });
</script>
<template>
  <div class="ed-app">
    <header class="ed-top">
      <div class="ed-brand"><strong>Peanora's Space</strong><span>本地内容工作台</span></div>
      <div class="ed-top-actions">
        <span class="ed-save-state">{{ isDirty ? '有未保存的修改' : '内容已保存' }}</span>
        <button :disabled="!canUndo" title="撤销 Ctrl / ⌘ Z" @click="undo">撤销</button><button :disabled="!canRedo" title="重做 Ctrl / ⌘ Shift Z" @click="redo">重做</button>
        <button :disabled="!draft" @click="exportDraft">导出草稿</button>
        <label class="ed-import" :aria-disabled="!draft">导入草稿<input type="file" accept="application/json,.json" :disabled="!draft" aria-label="导入草稿" @change="importDraft" /></label>
        <button class="ed-primary" :disabled="!draft || saving || uploading" @click="save">{{ saving ? '保存中…' : '保存到项目' }}</button>
      </div>
    </header>
    <div v-if="error" class="ed-banner ed-error" role="alert">{{ error }}<button @click="error = ''" aria-label="关闭错误提示">×</button></div>
    <div v-if="notice || uploading" class="ed-banner" role="status">{{ uploading ? '正在优化并保存图片…' : notice }}</div>
    <div v-if="draft" class="ed-workspace">
      <aside class="ed-structure" aria-label="页面与模块">
        <p class="ed-kicker">PAGES / 页面</p>
        <nav class="ed-pages" aria-label="选择编辑页面"><button v-for="(config, id) in contentPages" :key="id" class="ed-page" :class="{ active: pageId === id }" :aria-current="pageId === id ? 'page' : undefined" @click="selectPage(id)">{{ config.label }}</button></nav>
        <button class="ed-page-settings" @click="select('__page')">当前页面设置</button>
        <p class="ed-kicker">BLOCKS / 模块顺序</p>
        <p class="ed-help">{{ pageConfig.fixed ? '首页保持固定四屏；点击模块切换预览，编辑内容。' : '拖动调整顺序，也可用上下按钮。隐藏模块仅在编辑时可见。' }}</p>
        <ol class="ed-block-list">
          <li v-for="(block, index) in page.blocks" :key="block.id" :data-order-id="block.id" :class="{ active: selectedId === block.id, 'ed-is-hidden': block.hidden, 'ed-drop-target': dropIndex === index }">
            <button class="ed-block-name" @dragstart.prevent @pointerdown="beginDrag($event, block.id)" @pointermove="updateDrag" @pointerup="endDrag" @pointercancel="dragState = null; dropIndex = -1" @click="blockClick(block.id)"><span aria-hidden="true">⠿</span><span>{{ block.label }}<small>{{ block.hidden ? '已隐藏' : blockTypes[block.type] }}</small></span></button>
            <div v-if="!pageConfig.fixed" class="ed-order"><button :disabled="index === 0" :aria-label="`${block.label}上移`" @click="move(block.id, index - 1)">↑</button><button :disabled="index === page.blocks.length - 1" :aria-label="`${block.label}下移`" @click="move(block.id, index + 1)">↓</button></div>
          </li>
        </ol>
        <div v-if="!pageConfig.fixed" class="ed-new-block"><label for="block-type">添加模块</label><select id="block-type" v-model="addType"><option v-for="(label, type) in availableTypes" :key="type" :value="type">{{ label }}</option></select><button class="ed-add" @click="add">＋ 添加到页面</button></div>
        <p class="ed-help ed-local-note">四个页面共用一份草稿，切换页面不会丢失修改。保存会写入整个项目内容文件。</p>
      </aside>
      <main class="ed-preview-pane">
        <div class="ed-preview-tools"><div class="ed-segment"><button :aria-pressed="!mobile" @click="mobile = false">桌面</button><button :aria-pressed="mobile" @click="mobile = true">手机</button></div><label class="ed-checkbox"><input type="checkbox" v-model="editing" />显示编辑标记</label><a :href="pageConfig.path" target="_blank" rel="noopener">打开网页 ↗</a></div>
        <div class="ed-format" aria-label="预览文字格式工具栏" @mousedown.prevent>
          <span>选中文字后：</span><button aria-label="加粗" title="加粗" @click="format('bold')"><strong>B</strong></button><button aria-label="斜体" title="斜体" @click="format('italic')"><em>I</em></button><button @click="format('insertUnorderedList')">列表</button><button @click="format('insertOrderedList')">编号</button><button @click="format('unlink')">移除链接</button>
          <input v-model="linkUrl" aria-label="选中文字的链接地址" placeholder="https://…" @mousedown.stop /><button @click="format('createLink')">加链接</button>
        </div>
        <p class="ed-preview-hint">{{ editing ? '直接点击网页文字即可编辑 · Enter 换行 · Ctrl / ⌘ S 保存' : '预览已隐藏编辑标记；切回编辑后继续修改。' }}</p>
        <div class="ed-frame-stage"><iframe ref="frame" class="ed-preview-frame" :class="{ 'ed-mobile': mobile }" :key="pageId" :src="frameUrl" :title="`${pageConfig.label} 实时网页预览`" @load="sync()" /></div>
      </main>
      <aside ref="inspector" class="ed-inspector" aria-label="模块属性">
        <template v-if="selected">
          <p class="ed-kicker">{{ blockTypes[selected.type] }} / 属性</p>
          <div class="ed-field"><label for="module-label">模块名称（仅编辑器）</label><input id="module-label" :value="selected.label" @input="metadata('label', $event.target.value)" /></div>
          <div v-if="!pageConfig.fixed" class="ed-field"><label for="nav-label">页内导航文字（留空隐藏）</label><input id="nav-label" :value="selected.navLabel" @input="metadata('navLabel', $event.target.value)" /></div>
          <div v-if="!pageConfig.fixed" class="ed-block-actions"><button :disabled="selected.type === 'notes'" @click="duplicate">复制模块</button><button @click="metadata('hidden', !selected.hidden)">{{ selected.hidden ? '显示模块' : '隐藏模块' }}</button><button class="ed-danger" @click="remove">删除模块</button></div>
          <details class="ed-settings" open><summary>内容</summary><InspectorFields :key="selected.id" :value="selected.data" :fields="schemas[selected.type]" :images="images" @change="fieldChange" @upload="upload" /></details>
          <details v-if="!pageConfig.fixed" class="ed-settings" open><summary>布局与图片</summary>
            <div class="ed-field"><label for="layout-preset">布局</label><select id="layout-preset" :value="selected.layout.preset" @change="layout('preset', $event.target.value)"><option v-for="[value, label] in layoutChoices" :key="value" :value="value">{{ label }}</option></select></div>
            <div class="ed-field"><label for="text-align">文字对齐</label><select id="text-align" :value="selected.layout.align" @change="layout('align', $event.target.value)"><option value="left">左对齐</option><option value="center">居中</option><option value="right">右对齐</option></select></div>
            <div class="ed-field"><label for="block-width">模块宽度 {{ selected.layout.width }}%</label><input id="block-width" type="range" min="60" max="100" step="5" :value="selected.layout.width" @input="layout('width', +$event.target.value)" /></div>
            <div class="ed-field"><label for="block-spacing">上下留白 {{ selected.layout.spacing === undefined ? '默认' : `${selected.layout.spacing}px` }}</label><input id="block-spacing" type="range" min="0" max="160" step="4" :value="selected.layout.spacing ?? 48" @input="layout('spacing', +$event.target.value)" /><button @click="mutate(() => { delete selected.layout.spacing; })">恢复默认留白</button></div>
            <template v-if="hasImage">
              <div class="ed-field"><label for="image-ratio">图片比例</label><select id="image-ratio" :value="selected.layout.ratio || 'original'" @change="layout('ratio', $event.target.value)"><option value="original">原始比例</option><option v-for="ratio in ['16/9', '4/3', '1/1', '3/4']" :key="ratio" :value="ratio">{{ ratio }}</option></select></div>
              <div class="ed-field"><label for="image-fit">裁剪方式</label><select id="image-fit" :value="selected.layout.fit || 'cover'" @change="layout('fit', $event.target.value)"><option value="cover">填满并裁剪</option><option value="contain">完整显示</option></select></div>
              <div v-for="[key, label, min, fallback] in [['imageWidth', '图片宽度', 25, 100], ['imageX', '裁剪水平位置', 0, 50], ['imageY', '裁剪垂直位置', 0, 50]]" :key="key" class="ed-field"><label :for="key">{{ label }} {{ selected.layout[key] ?? fallback }}%</label><input :id="key" type="range" :min="min" max="100" :value="selected.layout[key] ?? fallback" @input="layout(key, +$event.target.value)" /></div>
            </template>
            <p class="ed-help">手机会自动恢复单列与全宽。图片替换会保留旧文件，方便撤销和找回。</p>
          </details>
        </template>
        <template v-else>
          <p class="ed-kicker">PAGE / 页面设置</p>
          <InspectorFields :key="pageId" :value="page" :fields="pageFields[pageId]" :images="images" @change="pageChange" />
          <p v-if="pageConfig.fixed" class="ed-help">首页大标题、欢迎语和轮播签名在“首页封面”模块；其他三屏分别编辑主题介绍与入口文字。</p>
          <p v-if="pageId === 'little'" class="ed-help">纸条内容会发布到网站；访客收藏保存在各自浏览器，工作台中的收藏仅供预览。</p>
          <p class="ed-help">点击左侧模块或中间网页，选择要编辑的区域。标题、正文、列表均可直接改字。链接地址与图片在右侧设置。</p>
          <div class="ed-tip"><strong>内容真正保存在项目里</strong><p>保存位置：src/data/content.json</p><p>自动备份：.editor-backups/</p><p>这里的修改只留在本地，不会自动推送或发布。</p></div>
        </template>
      </aside>
    </div>
    <div v-else class="ed-loading">{{ error ? '请保持本地开发服务运行，然后刷新编辑器。' : '正在打开本地内容…' }}</div>
  </div>
</template>
