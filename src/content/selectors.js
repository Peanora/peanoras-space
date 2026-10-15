import { contentImage } from "./assets";
import { pageItems } from "./pages";
export { pageItems } from "./pages";
export function playableSongs(document) {
  return pageItems(document, "music", "songs").map((song) => ({ ...song, cover: contentImage(song.cover) }));
}
export function homeScreensFor(document) {
  return document.pages.home.blocks.map((block) => block.type === 'homeCover'
    ? { id: block.id, title: block.data.name, shortTitle: '首页', kind: 'cover' }
    : { ...block.data, id: block.id, image: block.data.image ? contentImage(block.data.image) : '' });
}
