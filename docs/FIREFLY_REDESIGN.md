# Firefly 布局重构

日期：2026-11-10。用户要求根据 [Firefly](https://github.com/CuteLeaf/Firefly) 重新构建布局与 UI。

## 当前确认：按原布局对齐，使用米黄色系

用户后续原话：“我需要布局完全跟Firefly一模一样，再添入我的内容”“总体色调要保持米黄色，包括字体什么的”。本节替代下方第一版本地方案中的三栏比例、头像、侧栏顺序和浅绿配色；保留历史记录用于追溯。

本次核对 [线上演示](https://firefly.cuteleaf.cn/) 和 [MainGridLayout](https://github.com/CuteLeaf/Firefly/blob/master/src/layouts/MainGridLayout.astro)、[responsive-utils](https://github.com/CuteLeaf/Firefly/blob/master/src/utils/responsive-utils.ts)、[PostCard](https://github.com/CuteLeaf/Firefly/blob/master/src/components/layout/PostCard.astro)、[WidgetLayout](https://github.com/CuteLeaf/Firefly/blob/master/src/components/common/WidgetLayout.astro)。按原布局测量及实现，沿用 Vue 和既有内容源。

| 项目 | 当前规则 |
| --- | --- |
| 外框 | 桌面 92vw，最大 1600px；小屏 100%，桌面左右 padding16px |
| 三栏 | 280px / 自适应 / 280px，gap16px；768–1279px 只显示左栏 |
| 横幅 | 首页65vh，叠入56px；桌面详情 max(45vh,380px)；窄屏详情隐藏横幅、内容从88px开始 |
| 顶栏 | 高72px、底部圆角12px；六组菜单、搜索、音乐/正文/壁纸/暖色深浅工具；手机63px和抽屉菜单 |
| 左侧 | 256px方形头像，公告、现有播放器控制、分类和兴趣标签；分类/标签下半组吸顶 |
| 中央 | 单一分类条，两张置顶主题卡和已发布笔记；小角落沿用同一卡片形式；没有单独的首页专辑面板 |
| 右侧 | 原动态位置填入明确标注来源的现有纸条，原统计位置显示20篇/4分类/14曲/2专辑；学习项延用真实内容；日历使用上海时区当前日期，只有真实笔记日期产生标记 |
| 卡片 | 圆角16px，无额外描边；标题24/32px；正文16/24px、两行摘要；封面右侧30%、inset16px |
| 手机 | 根字号14px，分类条49px；叠入49px；封面在上、2:1、inset14px；侧栏模块排在正文后 |
| 配色 | 米黄背景 #f7f1e5、奶油卡片 #fffaf0、暖棕正文 #4c4036、棕金强调 #8a6037；本地字体不新增下载依赖 |

1440×1000 的浏览器实测已对齐：横幅650px、内容y594；网格x57.594/w1324.797；正文x369.594/w700.797；两侧各280px；顶栏x73.60/w1292.797/h72；分类条高56px。文字长度与原图不同，卡片高度按内容自然变化，不声称替换内容后所有像素相同。

程序与布局许可保存在 `public/licenses/firefly-MIT.txt`，页面保留 Firefly 来源署名。人物、壁纸、个人介绍、歌曲和笔记都使用本项目已有内容；没有收录 Firefly 的演示角色素材。

本轮实际验证：

- `npm test` 37 项通过，含实际生产构建对静态笔记入口、草稿剔除和编辑器剔除的检查；`npm run build` 通过。
- 线上 Firefly 与本地页面均用 Edge 浏览器测量，1440、1280、1024、768、390、320px 六种宽度下核对主网格、横幅和卡片；1440px 桌面核心几何值如上逐项一致。390px 顶栏为全宽63px、无底部圆角；封面348×174px，侧栏在正文后、页脚前。
- 25 项菜单/搜索/筛选/播放器/壁纸/路由/章节浏览器检查通过，包含方向键、Esc 和外部关闭，14 首官方选择及 iframe 跨路由保留。
- 12 项编辑器/收藏检查通过：四个固定首页模块定位、行内改字及撤销、跨页字段隔离、专辑编辑展开、十首曲目滚动显示、收藏及移除。没有将验收改字保存到项目。
- 8 项补充浏览器检查通过：日历月份切换与实际今天、清晰的响应式配图、900px 遮罩完整覆盖、手机顶栏/日历规则和首页返回焦点。
- 首页及 World、Music、Unity Notes、Little Things 在1440/390/320px共15组页面尺寸检查通过：无横向溢出、加载失败图片、重复H1或初次加载的第三方 iframe。桌面和手机截图已目视检查。
- 未验证真实手机、其他浏览器、屏幕阅读器和官方平台实际音频成功播放。当前只有本地预览及本地提交，没有推送或部署。

主要修改入口为 `SiteHeader.vue`、`SiteBanner.vue`、`SpaceSidebar.vue`、`SpaceCalendar.vue`、`HomeView.vue` 及相关样式；菜单配置统一在 `site.js`。数据继续由 `contentDocument`、`unityEntries`、`pageItems` 读现有 JSON，播放器继续复用唯一 `useMusicPlayer` 状态；没有新增重复内容源、依赖或托管配置。

当前截图：本机 `output/playwright/firefly-match-desktop.png` 与 `firefly-match-mobile.png`；运行日志与验收脚本在同一本机忽略目录。本地预览 `npm run dev` → `http://127.0.0.1:5173/`。

下文为第一版历史记录，已被以上当前确认替代。

## 第一版视觉与布局（历史）

```text
顶部导航：品牌 / 首页 / 我的世界 / Unity 笔记 / 音乐 / 小角落 / 听歌与壁纸
插画横幅：Peanora's Space / 欢迎语 / 现有签名
个人侧栏          中央内容流                 分类侧栏
头像与简介        个人世界、音乐入口         笔记分类
已有兴趣          Unity 笔记列表             实际内容数量
GitHub            小角落                    页面入口
页脚：网站归属、Firefly 布局灵感来源
```

暖白 `#fffdfa` 作为阅读底，浅底 `#f4f6f2`、深绿灰 `#394741` 正文、青绿 `#337963` 交互强调与浅杏 `#f3e3ca` 辅助。延用 Nunito、霞鹜文楷和 Kalam，保留许可及字体按需分包。

桌面使用侧栏和内容流；窄屏收为单列，通过顶部菜单继续进入全部页面。首页自然滚动替代旧四屏手势，保留系统减少动态、键盘可用性和焦点。

## 内容与功能边界

- 保留 `content.json` version 2、首页四模块 ID、四页编辑、现有路由与静态入口生成。
- 笔记、分类和计数来自可见已发布内容，不展示草稿或虚构访问数据；侧栏分类与搜索可直达筛选后的目录。
- 保留两专 14 首、官方封面、点击加载、按专辑选歌、折叠和站内换页保留 iframe、停止卸载。
- 个人介绍不改写，未提供的经历、项目和回忆继续隐藏；示例纸条保留来源标签。
- 保留本机编辑接口、富文本净化、笔记固定 ID 和章节锚点、代码及表格。
- 参考 Firefly 布局，未导入其代码或演示插画；页脚标注设计来源。继续 Vue/Vite，不变更依赖与托管。

## 验证

- `npm test`：37 项通过，包含实际生产构建对已发布笔记静态入口、草稿剔除和开发编辑器剔除的检查。遗留分页工具的单测仍保留，不将它们作为新首页的浏览器证据。
- `npm run build`：通过。依赖、域名、静态入口配置、原始内容 JSON 均未修改。
- Microsoft Edge（Playwright 无头浏览器）：23 项交互检查通过，覆盖自然滚动、首页分类、目录查询参数同步、14 首选择、点击前不加载 iframe、加载对应 QQ 曲目、折叠及站内换页保留同一个 iframe、停止卸载与保留选择、手机菜单、壁纸选择、专辑展开、章节锚点和减少动态。
- 编辑器及收藏：12 项浏览器检查通过，覆盖四个首页模块滚动定位、行内编辑及撤销、World/Music 横幅禁止编辑首页字段、两专编辑展开、十首曲目滚动显示、收藏及移除。没有将验收改字保存到项目。
- 1440、390、320px 宽度下检查首页及 World、Music、Unity Notes、Little Things 共 15 个页面与尺寸组合：无横向溢出、没有加载失败的图片、每页只有一个 H1、初次打开没有第三方 iframe。另检查 1024px、768px 矮屏侧栏及返回首页后的标题焦点。
- 已目视检查桌面与手机截图、展开专辑、文章目录及明亮壁纸下的横幅；低高度桌面侧栏取消吸顶，以使全部链接可达。

未测试真实手机、其他浏览器或屏幕阅读器；没有把官方 iframe 加载视作实际音频播放成功。此轮没有推送或线上部署。

## 主要实现入口

- `src/App.vue`、`components/layout/`：全站横幅、侧栏与唯一持久播放器的布局。
- `src/views/HomeView.vue`：从既有 `contentDocument`、`unityEntries`、`pageItems` 读取当前内容，生成首页预览，不新增重复内容源。
- `src/views/UnityNotesView.vue`：目录分类/关键词与 URL 查询参数同步，原笔记正文和锚点继续复用。
- `src/data/site.js`：顶部和侧栏共用导航配置；`styles/tokens.css`、`space-shell.css`、`space-content.css`、`home-feed.css`：配色和响应式布局。

本地预览：`npm run dev`，浏览 `http://127.0.0.1:5173/`；编辑器为 `/__editor`。验收截图和临时脚本存于本机忽略目录 `output/playwright/`。
