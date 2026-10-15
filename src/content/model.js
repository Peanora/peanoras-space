export const blockTypes = {
  profile: "个人介绍", projects: "项目展示", experience: "经历列表",
  text: "标题与正文", image: "图片与说明", split: "图文混排", links: "链接列表", divider: "分隔区域",
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
  }[type];
  if (!data) throw new Error("不支持的模块类型");
  return { id, type, label: blockTypes[type], navLabel: "", hidden: false, layout: { preset: "original", align: "left", width: 100 }, data };
}
export function newProject(id) {
  return { id, title: "新项目", description: "项目介绍", technologies: [], status: "开发中", cover: "builtin:project", alt: "项目封面", githubUrl: "", demoUrl: "", detailUrl: "", isPlaceholder: true, featured: false };
}

export function validateContent(document) {
  const fail = (message) => { throw new Error(message); };
  if (!document || document.version !== 1 || !document.pages?.world) fail("不支持的内容版本或页面");
  const page = document.pages.world;
  if (typeof page.title !== "string" || typeof page.eyebrow !== "string" || !Array.isArray(page.blocks) || page.blocks.length > 100) fail("页面内容格式不正确，最多支持 100 个模块");
  const ids = new Set();
  for (const block of page.blocks) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(block.id) || ids.has(block.id)) fail("模块 ID 无效或重复");
    ids.add(block.id);
    if (!Object.hasOwn(blockTypes, block.type) || typeof block.hidden !== "boolean" || typeof block.label !== "string" || typeof block.navLabel !== "string" || !block.data || !block.layout) fail("模块格式不正确");
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
