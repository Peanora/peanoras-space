import { contentPages, homeOrder, homePaths } from "./pages.js";
export const blockTypes = {
  profile: "个人介绍", projects: "项目展示", experience: "经历列表",
  text: "标题与正文", image: "图片与说明", split: "图文混排", links: "链接列表", divider: "分隔区域",
  homeCover: "首页封面", homeTheme: "首页主题", songs: "歌曲收藏", memories: "现场回忆", gallery: "照片与纪念", notes: "纸条与收藏",
};
export const clone = (value) => JSON.parse(JSON.stringify(value));
export function safeLink(value) {
  return typeof value === "string" && /^(https?:\/\/|mailto:|\/(?![\/\\])|#)/i.test(value.trim()) ? value.trim() : "";
}
export function setField(object, path, value) {
  const keys = path.split(".");
  if (keys.some((key) => !key || ["__proto__", "prototype", "constructor"].includes(key))) throw new Error("无效字段");
  let target = object;
  for (const key of keys.slice(0, -1)) {
    if (!target || !Object.hasOwn(target, key)) throw new Error("字段不存在");
    target = target[key];
  }
  if (!target || !Object.hasOwn(target, keys.at(-1))) throw new Error("字段不存在");
  target[keys.at(-1)] = value;
}
export function createBlock(type, id) {
  const data = {
    profile: { eyebrow: "ABOUT ME", name: "介绍标题", introduction: "<p>点击这里写下你的介绍。</p>", interestsHeading: "兴趣爱好", interests: [], learningHeading: "正在学习", learning: [], direction: "", socialHeading: "找到我", socials: [] },
    projects: { heading: "Projects", subtitle: "项目与作品", items: [] },
    experience: { heading: "Experience", subtitle: "学习与经历", items: [], emptyText: "这里还没有添加经历。" },
    text: { eyebrow: "", heading: "新的标题", body: "<p>点击这里输入内容。</p>" },
    image: { src: "builtin:photo", alt: "图片说明", caption: "写下图片说明" },
    split: { heading: "图文故事", body: "<p>让图片与文字一起记录。</p>", src: "builtin:photo", alt: "图片说明", caption: "" },
    links: { heading: "找到我", items: [{ label: "GitHub", url: "https://github.com/Peanora" }] },
    divider: { caption: "" },
    homeCover: { name: "Peanora's Space", welcome: "", signatures: [], entry: "翻开我的空间", portraitNote: "Peanora", avatar: "artwork:avatar", socials: [] },
    homeTheme: { kind: "world", number: "01", title: "My World", shortTitle: "World", subtitle: "", index: "", description: "", action: "进入个人世界", path: "/world", image: "artwork:spring-garden", alt: "插画", imagePosition: "50% 50%", artworkNote: "", bookmark: "", tags: [] },
    songs: { heading: "On Repeat", subtitle: "喜欢的歌曲 / hanser", items: [], emptyText: "歌曲收藏正在整理。" },
    memories: { heading: "Live, Remembered", subtitle: "演唱会回忆", items: [], emptyText: "现场回忆正在整理。" },
    gallery: { heading: "Fragments", subtitle: "照片与纪念", items: [], emptyText: "照片等待添加。" },
    notes: { eyebrow: "A SMALL NOTE", items: [], nextLabel: "换一句", saveLabel: "收藏这句", savedLabel: "已收藏", favoritesHeading: "Kept Here", favoritesLabel: "我的收藏", favoritesHint: "收藏保存在当前浏览器中，不会同步到其他设备。", emptyText: "小纸条正在整理。", emptyFavorites: "还没有收藏。遇到喜欢的句子，可以把它留在这里。", marginLabel: "页边小记", marginText: "你翻到了页边。这里留一小块空白，给以后的小惊喜。" },
  }[type];
  if (!data) throw new Error("不支持的模块类型");
  return { id, type, label: blockTypes[type], navLabel: "", hidden: false, layout: { preset: "original", align: "left", width: 100 }, data };
}
export function newPhoto(id = "") {
  return { ...(id ? { id } : {}), src: "builtin:photo", alt: "图片说明", caption: "", shape: "landscape", position: "50% 50%", isPlaceholder: true };
}
export function newSong(id) {
  return { id, title: "新的歌曲", artist: "", thought: "", cover: "builtin:record", alt: "待替换的歌曲封面", officialUrl: "", neteaseId: "", isPlaceholder: true, coverIsPlaceholder: true };
}
export function neteaseSongId(value) {
  try {
    const url = new URL(value);
    if (url.hostname !== "music.163.com" || !["http:", "https:"].includes(url.protocol)) return "";
    const id = url.searchParams.get("id") || new URLSearchParams(url.hash.split("?")[1] || "").get("id") || "";
    return /^\d{1,20}$/.test(id) ? id : "";
  } catch { return ""; }
}
export function restoreContent(imported, current) {
  if (imported?.version === 1 && imported.pages?.world) {
    const merged = clone(current);
    merged.pages.world = imported.pages.world;
    return validateContent(merged);
  }
  return validateContent(imported);
}
export function newProject(id) {
  return { id, title: "新项目", description: "项目介绍", technologies: [], status: "开发中", cover: "builtin:project", alt: "项目封面", githubUrl: "", demoUrl: "", detailUrl: "", isPlaceholder: true, featured: false };
}

export function validateContent(document) {
  const fail = (message) => { throw new Error(message); };
  if (!document || document.version !== 2 || !document.pages || Object.keys(document.pages).length !== 4) fail("需要全站内容版本 2；请刷新编辑器，旧版草稿可通过导入恢复");
  const strings = (items) => Array.isArray(items) && items.length <= 200 && items.every((item) => typeof item === "string");
  const objects = (items, fields) => Array.isArray(items) && items.length <= 200 && items.every((item) => item && fields.every((field) => typeof item[field] === "string"));
  const image = (value) => typeof value === "string" && (!value || /^(builtin:(photo|project|record|portrait)|artwork:[a-z-]+|\/content\/uploads\/[a-f0-9-]+\.(webp|png|jpe?g|gif))$/.test(value));
  const photos = (items, withId = false) => objects(items, ["src", "alt", "caption", ...(withId ? ["id"] : [])]) && items.every((item) => image(item.src) && typeof item.isPlaceholder === "boolean" && (!item.shape || ["landscape", "portrait", "square"].includes(item.shape)) && (!item.position || /^\d{1,3}% \d{1,3}%$/.test(item.position)));
  const unique = (items) => items.every((item) => typeof item.id === "string" && /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(item.id)) && new Set(items.map((item) => item.id)).size === items.length;
  for (const [pageId, config] of Object.entries(contentPages)) {
  const page = document.pages[pageId];
  if (!page) fail("页面缺失");
  if (typeof page.title !== "string" || typeof page.eyebrow !== "string" || !Array.isArray(page.blocks) || page.blocks.length > 100) fail("页面内容格式不正确，最多支持 100 个模块");
  if (pageId === "music" && ["titleFirst", "titleLast", "disclaimer"].some((key) => typeof page[key] !== "string")) fail("音乐页标题或说明缺失");
  if (pageId === "home" && (page.blocks.length !== 4 || page.blocks.some((block, index) => block.id !== homeOrder[index] || block.hidden || block.type !== (index === 0 ? "homeCover" : "homeTheme") || (index > 0 && (block.data.kind !== block.id || block.data.path !== homePaths[block.id]))))) fail("首页必须保留封面、个人世界、音乐、小角落四屏及固定入口");
  if (pageId === "little" && page.blocks.filter((block) => block.type === "notes").length > 1) fail("小角落保留一个纸条与收藏模块，请在其中添加条目");
  const ids = new Set();
  for (const block of page.blocks) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(block.id) || ids.has(block.id)) fail("模块 ID 无效或重复");
    ids.add(block.id);
    if (!config.types.includes(block.type) || typeof block.hidden !== "boolean" || typeof block.label !== "string" || typeof block.navLabel !== "string" || !block.data || !block.layout) fail("模块格式或所属页面不正确");
    const layout = block.layout;
    if (!["original", "single", "two", "image-left", "image-right"].includes(layout.preset) || !["left", "center", "right"].includes(layout.align)) fail("布局选项无效");
    for (const [key, min, max] of [["width", 60, 100], ["spacing", 0, 160], ["imageWidth", 25, 100], ["imageX", 0, 100], ["imageY", 0, 100]]) {
      if (layout[key] !== undefined && (!Number.isFinite(layout[key]) || layout[key] < min || layout[key] > max)) fail("布局数值超出范围");
    }
    if (layout.ratio && !["original", "16/9", "4/3", "1/1", "3/4"].includes(layout.ratio)) fail("图片比例无效");
    if (layout.fit && !["cover", "contain"].includes(layout.fit)) fail("图片裁剪方式无效");
    const template = createBlock(block.type, "template").data;
    for (const [key, value] of Object.entries(template)) {
      if (Array.isArray(value) ? !Array.isArray(block.data[key]) : typeof block.data[key] !== typeof value) fail(`模块缺少字段：${key}`);
    }
    const data = block.data;
    const textArray = (items) => Array.isArray(items) && items.length <= 200 && items.every((item) => typeof item === "string");
    const links = (items) => Array.isArray(items) && items.length <= 100 && items.every((item) => typeof item.label === "string" && typeof item.url === "string" && (!item.url || safeLink(item.url)));
    if (block.type === "profile" && (!textArray(data.interests) || !Array.isArray(data.learning) || data.learning.length > 100 || !data.learning.every((item) => typeof item.title === "string" && typeof item.description === "string") || !links(data.socials))) fail("介绍列表格式不正确");
    if (block.type === "links" && !links(data.items)) fail("链接格式无效，请使用 https、mailto 或站内路径");
    if (block.type === "projects" && (!Array.isArray(data.items) || data.items.length > 100 || !data.items.every((item) => ["id", "title", "description", "status", "cover", "alt", "githubUrl", "demoUrl", "detailUrl"].every((key) => typeof item[key] === "string") && textArray(item.technologies) && typeof item.isPlaceholder === "boolean" && [item.githubUrl, item.demoUrl, item.detailUrl].every((url) => !url || safeLink(url))))) fail("项目字段或链接格式不正确");
    if (block.type === "experience" && (!Array.isArray(data.items) || data.items.length > 100 || !data.items.every((item) => ["id", "date", "title", "description"].every((key) => typeof item[key] === "string")))) fail("经历列表格式不正确");
    if (block.type === "homeCover" && (!strings(data.signatures) || !links(data.socials) || !image(data.avatar))) fail("封面签名、社交链接或头像格式无效");
    if (block.type === "homeTheme" && (!strings(data.tags) || !image(data.image) || !/^\d{1,3}% \d{1,3}%$/.test(data.imagePosition))) fail("首页主题图片或文字格式无效");
    if (["image", "split"].includes(block.type) && !image(data.src)) fail("图片地址只能使用项目资源");
    if (block.type === "projects" && !data.items.every((item) => image(item.cover))) fail("项目图片地址无效");
    if (block.type === "songs" && (!objects(data.items, ["id", "title", "artist", "thought", "cover", "alt", "officialUrl", "neteaseId"]) || !unique(data.items) || !data.items.every((item) => image(item.cover) && (!item.officialUrl || /^https?:\/\//.test(safeLink(item.officialUrl))) && (!item.neteaseId || /^\d{1,20}$/.test(item.neteaseId)) && (!neteaseSongId(item.officialUrl) || !item.neteaseId || neteaseSongId(item.officialUrl) === item.neteaseId) && typeof item.isPlaceholder === "boolean" && typeof item.coverIsPlaceholder === "boolean"))) fail("歌曲或播放链接格式无效（网易云 ID 需为纯数字并匹配链接）");
    if (block.type === "memories" && (!objects(data.items, ["id", "title", "date", "location"]) || !unique(data.items) || !data.items.every((item) => (!item.date || /^\d{4}-\d{2}-\d{2}$/.test(item.date)) && strings(item.paragraphs) && strings(item.mementos) && photos(item.photos) && typeof item.isPlaceholder === "boolean"))) fail("回忆日期、文字或照片格式无效");
    if (block.type === "gallery" && (!photos(data.items, true) || !unique(data.items))) fail("相册图片格式无效");
    if (block.type === "notes" && (!objects(data.items, ["id", "text", "source"]) || !unique(data.items) || !data.items.every((item) => typeof item.rare === "boolean"))) fail("纸条 ID、文字或隐藏属性无效");
  }
  }
  const walk = (value, depth = 0) => {
    if (depth > 12) fail("内容层级过深");
    if (typeof value === "string" && value.length > 50000) fail("单个字段内容过长");
    if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) {
      if (["__proto__", "prototype", "constructor"].includes(key)) fail("无效内容键");
      walk(child, depth + 1);
    }
  };
  walk(document);
  return document;
}
