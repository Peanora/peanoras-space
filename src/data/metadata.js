import { site, sectionPages } from "./site.js";
import { unityEntries } from '../content/unityNotes.js';

export const siteOrigin = "https://peanora.cn";
export const shareImage = `${siteOrigin}/social-cover.png`;
export const pageMetadata = {
  '/unity-notes': { title: `Unity Notes — ${site.name}`, description: 'Peanora 的 Unity 学习手册，整理学习中的思路、代码与小小发现。' },
  "/": { title: site.name, description: "欢迎来到 Peanora 的小空间，翻开个人世界、喜欢的音乐和生活里的小纸条。" },
  "/world": { title: `My World — ${site.name}`, description: "认识 Peanora：兴趣爱好、正在学习的方向，以及慢慢积累的个人世界。" },
  "/music": { title: `Music & Memories — ${site.name}`, description: "Peanora 喜欢的歌曲与音乐回忆，通过官方平台一起听歌。" },
  "/little-things": { title: `Little Things — ${site.name}`, description: "翻开一张小纸条，换一句文字，把喜欢的句子留在当前浏览器。" },
  ...Object.fromEntries(sectionPages.map(page => [page.path, { title: `${page.title} — ${site.name}`, description: page.description }])),
};

export function metadataFor(path, content) {
  const normalized = path.replace(/\/+$/, "") || "/";
  const article = content && unityEntries(content).find(note => normalized === `/unity-notes/${note.id}`);
  const page = pageMetadata[normalized] || (article && {title:`${article.title} — Unity Notes — ${site.name}`,description:article.summary || 'Unity 学习笔记'});
  return page
    ? { ...page, url: `${siteOrigin}${normalized === "/" ? "/" : normalized + "/"}`, robots: "index,follow" }
    : { title: `页面未找到 — ${site.name}`, description: "这个页面暂时找不到，可以回到 Peanora 的小空间继续浏览。", url: null, robots: "noindex,follow" };
}

export function staticContentPaths(document) {
  return [...Object.keys(pageMetadata), ...unityEntries(document).map(note=>`/unity-notes/${note.id}`)];
}

export function metadataTags(path, content) {
  const page = metadataFor(path, content);
  return [
    { name: "description", content: page.description },
    { name: "robots", content: page.robots },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "zh_CN" },
    { property: "og:site_name", content: site.name },
    { property: "og:title", content: page.title },
    { property: "og:description", content: page.description },
    ...(page.url ? [{ property: "og:url", content: page.url }] : []),
    { property: "og:image", content: shareImage },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    { property: "og:image:alt", content: "Peanora's Space 奶油白手账封面与二次元头像" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: page.title },
    { name: "twitter:description", content: page.description },
    { name: "twitter:image", content: shareImage },
  ];
}

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

// Build-time HTML matters for link previews that do not execute JavaScript.
export function renderMetadata(path, content) {
  const page = metadataFor(path, content);
  return [
    `<title>${escapeHtml(page.title)}</title>`,
    ...metadataTags(path, content).map((tag) => `<meta ${tag.property ? "property" : "name"}="${tag.property || tag.name}" content="${escapeHtml(tag.content)}" />`),
    ...(page.url ? [`<link rel="canonical" href="${page.url}" />`] : []),
  ].join("\n    ");
}

export function updateMetadata(path, content) {
  const page = metadataFor(path, content);
  document.title = page.title;
  for (const tag of metadataTags(path, content)) {
    const key = tag.property ? "property" : "name";
    const value = tag.property || tag.name;
    let element = document.head.querySelector(`meta[${key}="${value}"]`);
    if (!element) { element = document.createElement("meta"); element.setAttribute(key, value); document.head.append(element); }
    element.content = tag.content;
  }
  let canonical = document.head.querySelector('link[rel="canonical"]');
  if (page.url) {
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.append(canonical); }
    canonical.href = page.url;
  } else {
    canonical?.remove();
    document.head.querySelector('meta[property="og:url"]')?.remove();
  }
}
