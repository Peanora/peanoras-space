export const contentPages = {
  home: { label: "首页", path: "/", fixed: true, types: ["homeCover", "homeTheme"] },
  world: { label: "My World", path: "/world", types: ["profile", "projects", "experience", "text", "image", "split", "links", "divider"] },
  music: { label: "Music & Memories", path: "/music", types: ["songs", "memories", "gallery", "text", "image", "split", "links", "divider"] },
  little: { label: "Little Things", path: "/little-things", types: ["notes", "text", "image", "split", "links", "divider"] },
};
export const homeOrder = ["cover", "world", "music", "little"];
export const homePaths = { world: "/world", music: "/music", little: "/little-things" };
export function contentTarget(document, pageId, blockId) {
  const page = document?.pages?.[pageId];
  return blockId === "__page" ? page : page?.blocks.find((block) => block.id === blockId)?.data;
}
export function pageItems(document, pageId, type) {
  return (document.pages[pageId]?.blocks || []).filter((block) => !block.hidden && block.type === type).flatMap((block) => block.data.items);
}
