const text = (key, label) => ({ key, label, type: "text" });
const rich = (key, label, multiline = false) => ({ key, label, type: "rich", multiline });
const image = (key, label) => ({ key, label, type: "image" });
const list = (key, label, fields, template) => ({ key, label, type: "list", fields, template });
const linkFields = [rich("label", "链接文字"), text("url", "链接地址")];
const heading = [rich("heading", "标题"), rich("subtitle", "副标题")];
export const schemas = {
  profile: [
    rich("eyebrow", "小标题"), rich("name", "昵称 / 标题"), rich("introduction", "自我介绍", true),
    rich("interestsHeading", "兴趣栏目标题"),
    { key: "interests", label: "兴趣爱好", type: "strings" },
    rich("learningHeading", "学习栏目标题"),
    list("learning", "学习方向", [rich("title", "名称"), rich("description", "说明", true)], { title: "新的方向", description: "" }),
    rich("direction", "更多介绍（可留空）", true), rich("socialHeading", "社交栏目标题"),
    list("socials", "社交链接", linkFields, { label: "新的链接", url: "" }),
  ],
  text: [rich("eyebrow", "小标题"), rich("heading", "标题"), rich("body", "正文", true)],
  image: [image("src", "图片"), text("alt", "替代文字"), rich("caption", "图片说明")],
  split: [rich("heading", "标题"), rich("body", "正文", true), image("src", "图片"), text("alt", "替代文字"), rich("caption", "图片说明")],
  projects: [...heading, list("items", "项目", [
    rich("title", "项目名称"), rich("description", "项目介绍", true), rich("status", "项目状态"),
    { key: "technologies", label: "开发技术", type: "strings" }, image("cover", "项目封面"), text("alt", "封面替代文字"),
    text("githubUrl", "GitHub 地址"), text("demoUrl", "演示地址"), text("detailUrl", "详情地址"),
    { key: "isPlaceholder", label: "显示占位素材提示", type: "check" },
  ], null)],
  experience: [...heading, rich("emptyText", "空状态说明"), list("items", "经历", [
    rich("date", "时间"), rich("title", "标题"), rich("description", "说明", true),
  ], { title: "新的经历", date: "", description: "" })],
  links: [rich("heading", "标题"), list("items", "链接", linkFields, { label: "新的链接", url: "" })],
  divider: [rich("caption", "分隔说明（可留空）")],
};
export const layouts = {
  profile: [["original", "原有左右排版"], ["single", "单列"]],
  projects: [["original", "原有交错排版"], ["single", "单列"], ["two", "双列"], ["image-left", "左图右文"], ["image-right", "左文右图"]],
  text: [["original", "单列"], ["two", "双列正文"]],
  split: [["original", "左图右文"], ["image-right", "左文右图"], ["single", "单列"]],
};
