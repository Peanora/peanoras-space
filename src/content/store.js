import { ref } from "vue";
import initialContent from "../data/content.json";
export const contentDocument = ref(initialContent);
export const editingContent = ref(false);
export const selectedContentBlock = ref(null);
export const isContentPreview = ref(false);
if (import.meta.hot) {
  import.meta.hot.accept("../data/content.json", (module) => {
    if (module && !isContentPreview.value) contentDocument.value = module.default;
  });
}
export function publishEditorEvent(event) {
  if (import.meta.env.DEV && editingContent.value && window.parent !== window) {
    window.parent.postMessage({ source: "peanora-preview", ...event }, window.location.origin);
  }
}
