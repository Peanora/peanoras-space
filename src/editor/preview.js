import { nextTick } from "vue";
import { contentDocument, editingContent, isContentPreview, previewPage, selectedContentBlock, publishEditorEvent } from "../content/store";
import "./preview.css";

export function installPreview() {
  isContentPreview.value = true;
  editingContent.value = true;
  previewPage.value = location.pathname.startsWith('/music') ? 'music' : location.pathname.startsWith('/little-things') ? 'little' : location.pathname.startsWith('/world') ? 'world' : 'home';
  let savedRange = null;
  const selectionField = () => {
    const selection = window.getSelection();
    const node = selection?.anchorNode;
    return (node?.nodeType === 1 ? node : node?.parentElement)?.closest('[contenteditable="true"][data-edit-field]');
  };
  document.addEventListener("selectionchange", () => {
    if (document.hasFocus() && selectionField() && window.getSelection().rangeCount) savedRange = window.getSelection().getRangeAt(0).cloneRange();
  });
  document.addEventListener("click", (event) => {
    // Editing links must not navigate away from the draft.
    if (event.target.closest("a")) event.preventDefault();
  }, true);
  document.addEventListener("paste", (event) => {
    if (!event.target.closest('[contenteditable="true"]')) return;
    event.preventDefault();
    document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
  });
  document.addEventListener("keydown", (event) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    const key = event.key.toLowerCase();
    if (["s", "z", "y"].includes(key)) {
      event.preventDefault();
      publishEditorEvent({ type: "shortcut", action: key === "s" ? "save" : (key === "y" || event.shiftKey) ? "redo" : "undo" });
    }
  });
  window.addEventListener("message", async (event) => {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.source !== "peanora-editor") return;
    const message = event.data;
    if (message.type === "draft") {
      if (message.pageId !== previewPage.value) return;
      if (message.resetFocus) document.activeElement?.blur();
      contentDocument.value = message.document;
      editingContent.value = message.editing;
      selectedContentBlock.value = message.selected;
    } else if (message.type === "select") {
      if (message.pageId !== previewPage.value) return;
      selectedContentBlock.value = message.blockId;
      if (previewPage.value === 'home') window.dispatchEvent(new CustomEvent('peanora:select-home', { detail: message.blockId }));
      await nextTick();
      document.getElementById(message.blockId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (message.type === "format" && editingContent.value) {
      if (!savedRange || !savedRange.startContainer.isConnected) return;
      const node = savedRange.startContainer;
      const field = (node.nodeType === 1 ? node : node.parentElement)?.closest('[contenteditable="true"]');
      if (!field) return;
      if (field.dataset.editPlain === 'true') {
        publishEditorEvent({ type: 'notice', text: '此字段使用纯文本，以保留标题动画或播放器信息。正文、感想与回忆支持富文本。' });
        return;
      }
      field.focus();
      const selection = window.getSelection();
      selection.removeAllRanges(); selection.addRange(savedRange);
      document.execCommand(message.command, false, message.value || null);
      field.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  window.addEventListener("load", () => publishEditorEvent({ type: "ready" }));
}
