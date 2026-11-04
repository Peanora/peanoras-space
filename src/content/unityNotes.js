export function unityEntries(document, includeDrafts = false) {
  return document.pages.world.blocks.filter(b => b.type === 'unityNotes' && (includeDrafts || !b.hidden))
    .flatMap(b => b.data.items.map((item, index) => ({ ...item, blockId: b.id, contentIndex: index })))
    .filter(item => includeDrafts || !item.draft);
}
export function newUnitySection() {
  return { id: '', heading: '', body: '', callout: '', code: '', language: 'csharp', image: '', alt: '', caption: '' };
}
export function newUnityNote() {
  return { id: '', title: '新的笔记', summary: '', category: '', date: '', draft: true, sections: [] };
}
export function publishedDocument(document) {
  const result = JSON.parse(JSON.stringify(document));
  for (const block of result.pages.world.blocks) if (block.type === 'unityNotes') block.data.items = block.data.items.filter(item => !item.draft);
  return result;
}
