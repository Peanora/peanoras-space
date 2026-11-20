import { computed, ref, shallowRef } from 'vue';
import { todoConfig } from '../todo/config.js';
import { contentDocument, isContentPreview } from './store.js';

const online = shallowRef([]);
export const littleNotesStatus = ref('idle');
let pending;
let writes = 0;

export const littleNotes = computed(() => {
  const block = contentDocument.value.pages.little.blocks.find(block => block.type === 'notes' && !block.hidden);
  if (!block) return [];
  const originals = block.data.items;
  if (isContentPreview.value || !online.value.length) return originals;

  const byId = new Map(online.value.map(note => [note.id, note]));
  const originalIds = new Set(originals.map(note => note.id));
  const added = online.value.filter(note => !originalIds.has(note.id));
  return [...added, ...originals.map(note => byId.get(note.id) ?? note)];
});

export function loadLittleNotes() {
  const config = todoConfig(import.meta.env);
  if (!config || isContentPreview.value) return;
  if (pending) return pending;
  const version = writes;
  littleNotesStatus.value = 'loading';
  pending = (async () => {
    try {
      const response = await fetch(`${config.url}/rest/v1/rpc/list_little_notes`, {
        headers: { apikey: config.key },
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error('Could not load notes');
      const items = await response.json();
      if (!Array.isArray(items)) throw new Error('Invalid notes response');
      if (version === writes) {
        online.value = items;
        littleNotesStatus.value = 'ready';
      }
    } catch {
      if (version === writes) littleNotesStatus.value = 'error';
    } finally {
      pending = undefined;
    }
  })();
  return pending;
}

export async function saveLittleNote(client, note) {
  const { data, error } = await client.rpc('save_little_note', {
    note_id: note.id, note_text: note.text, note_source: note.source, note_rare: note.rare,
    expected_revision: note.revision ?? null,
  });
  if (error) throw error;
  writes++;
  const index = online.value.findIndex(item => item.id === data.id);
  if (index === -1) online.value = [data, ...online.value];
  else online.value = online.value.map(item => item.id === data.id ? data : item);
  littleNotesStatus.value = 'ready';
}
