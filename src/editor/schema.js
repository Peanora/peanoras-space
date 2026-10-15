import { newPhoto, newSong } from "../content/model";
const text = (key, label) => ({ key, label, type: "text" });
const rich = (key, label, multiline = false) => ({ key, label, type: "rich", multiline });
const image = (key, label) => ({ key, label, type: "image" });
const list = (key, label, fields, template) => ({ key, label, type: "list", fields, template });
const linkFields = [rich("label", "链接文字"), text("url", "链接地址")];
const heading = [rich("heading", "标题"), rich("subtitle", "副标题")];
const check = (key, label) => ({ key, label, type: 'check' });
const strings = (key, label, plain = false) => ({ key, label, type: 'strings', plain });
const photoFields = [image('src', '图片'), text('alt', '替代文字'), rich('caption', '图片说明'), { key: 'shape', label: '显示形状', type: 'select', options: [['landscape', '横图'], ['portrait', '竖图'], ['square', '方图']] }, text('position', '裁剪位置（例如 50% 50%）'), check('isPlaceholder', '显示占位素材提示')];
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
  homeCover: [text('name', '首页大标题'), rich('welcome', '欢迎语'), strings('signatures', '轮播签名', true), text('entry', '翻页按钮文字'), text('portraitNote', '头像旁文字'), image('avatar', '头像'), list('socials', '首页社交链接', [text('label', '链接文字'), text('url', '链接地址')], { label: '新的链接', url: '' })],
  homeTheme: [text('title', '主题标题'), text('shortTitle', '手机目录短标题'), text('subtitle', '中文副标题'), rich('description', '主题介绍', true), text('index', '内容索引'), text('action', '入口按钮文字'), text('bookmark', '封面书签文字'), text('artworkNote', '插画说明'), strings('tags', '标签', true), image('image', '主题插画'), text('alt', '插画替代文字'), text('imagePosition', '图片裁剪位置（例如 50% 50%）')],
  songs: [...heading, rich('emptyText', '空状态说明'), list('items', '歌曲', [text('title', '歌曲名称'), text('artist', '艺术家'), rich('thought', '个人感想', true), text('officialUrl', '官方播放链接'), text('neteaseId', '网易云歌曲 ID（链接填写后自动识别）'), image('cover', '歌曲封面'), text('alt', '封面替代文字'), check('coverIsPlaceholder', '封面为占位素材'), check('isPlaceholder', '歌曲信息待补充')], newSong(''))],
  memories: [...heading, rich('emptyText', '空状态说明'), list('items', '回忆', [rich('title', '回忆标题'), { ...text('date', '日期（可以留空）'), inputType: 'date' }, rich('location', '地点'), strings('paragraphs', '回忆段落'), list('photos', '回忆照片', photoFields, newPhoto()), strings('mementos', '纪念内容'), check('isPlaceholder', '显示内容占位提示')], { id: '', title: '新的回忆', date: '', location: '', paragraphs: [], photos: [], mementos: [], isPlaceholder: true })],
  gallery: [...heading, rich('emptyText', '空状态说明'), list('items', '照片', photoFields, newPhoto(''))],
  notes: [rich('eyebrow', '纸条小标题'), list('items', '纸条', [rich('text', '纸条文字', true), rich('source', '来源'), check('rare', '作为偶尔出现的隐藏纸条')], { id: '', text: '新的纸条', source: '', rare: false }), text('nextLabel', '换一句按钮文字'), text('saveLabel', '收藏按钮文字'), text('savedLabel', '已收藏按钮文字'), rich('favoritesHeading', '收藏区标题'), text('favoritesLabel', '收藏计数文字'), rich('favoritesHint', '收藏说明'), rich('emptyText', '无纸条说明'), rich('emptyFavorites', '无收藏说明'), text('marginLabel', '页边小记按钮'), rich('marginText', '页边小记正文', true)],
};
export const layouts = {
  profile: [["original", "原有左右排版"], ["single", "单列"]],
  projects: [["original", "原有交错排版"], ["single", "单列"], ["two", "双列"], ["image-left", "左图右文"], ["image-right", "左文右图"]],
  text: [["original", "单列"], ["two", "双列正文"]],
  split: [["original", "左图右文"], ["image-right", "左文右图"], ["single", "单列"]],
  songs: [['original', '原有唱片目录'], ['two', '双列唱片']],
  gallery: [['original', '原有交错相册'], ['two', '等宽双列'], ['single', '单列']],
};
export const pageFields = {
  home: [],
  world: [rich('title', '页面标题'), rich('eyebrow', '页面小标题')],
  music: [rich('eyebrow', '页面小标题'), rich('titleFirst', '主标题第一行'), rich('titleLast', '主标题第二行'), rich('disclaimer', '非官方空间与素材说明', true)],
  little: [rich('title', '页面标题'), rich('eyebrow', '页面小标题')],
};
