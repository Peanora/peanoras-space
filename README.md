# Peanora's Space

Vue 3、Vite、JavaScript、CSS 与 Vue Router 构成的个人网站。采用奶油白、暖杏色与可切换的浅淡插画壁纸，个人世界与音乐回忆同等突出。首页分为封面、个人世界、音乐回忆、小角落四屏，滚动手势逐屏切换，点击入口进入正常滚动的详情页。

长期开发前请先阅读根目录 `AGENTS.md` 和 `docs/PRODUCT_REQUIREMENTS.md`，其中记录了原始需求及后续确认，避免恢复已被替代的深色或长首页方案。

## 本地运行

需要 Node.js 20.19+ 或 22.12+（建议使用当前受支持的 LTS）。

```powershell
npm install
npm run dev
```

打开终端显示的本地地址。开发服务默认只监听本机。

```powershell
npm run build
npm run preview
```

构建结果在 `dist/`。请通过开发或预览服务访问，不直接双击 `index.html`。

`npm test` 使用 Node.js 内置测试，验证滚轮手势合并、惯性与单位换算。首页可用滚轮、上下方向键、PageUp / PageDown、Home / End、上下按钮及目录翻屏；手机可上滑/下滑。矮屏内容优先在当前屏内滚动阅读。

## 更新内容

页面与数据分开，主要内容集中在 `src/data/`。
个人介绍、兴趣、学习、项目与经历现在可以使用**本地可视化编辑器**：运行 `npm run dev` 后，打开终端本地地址下的 `/__editor`（通常是 `http://127.0.0.1:5173/__editor`）。点击预览文字直接修改；左侧管理模块，右侧调整内容、图片与布局，最后点击“保存到项目”。完整说明见 [本地内容编辑器](docs/CONTENT_EDITOR.md)。当前只开放 My World，其他页面保持原有数据管理方式。
首页四屏与主题说明集中在 `src/data/home.js`。
欢迎语在 `src/data/site.js` 的 `welcome`，个性签名在 `signatures` 数组。每个字符串是一条签名，首页按顺序打字、停留、删除并循环；修改内容无需改组件。暂停动态也会暂停打字机，系统减少动态时静态显示第一条。

| 内容                                         | 数据文件          |
| -------------------------------------------- | ----------------- |
| 昵称、网站名称、导航、社交地址、首页主题入口 | `site.js`         |
| 个人介绍、兴趣、学习、项目、经历与新增模块   | `content.json`（通过本地编辑器保存） |
| 歌曲名称、艺术家、感想、官方地址             | `songs.js`        |
| 演唱会日期、地点、文字、照片、纪念物         | `memories.js`     |
| 相册图片、说明与裁切位置                     | `gallery.js`      |
| 随机文字与稀有纸条                           | `littleThings.js` |
| 头像、壁纸、默认背景、裁切位置               | `appearance.js`   |

My World 图片可直接在编辑器中上传，自动存入 `public/content/uploads/`，使用 `/content/uploads/...` 根路径，匹配当前自定义域名的 `/` base。其他页面图片仍放入 `src/assets/images/` 并在对应数据文件中导入。图片应压缩为适当尺寸，并为缩略图考虑独立的大图策略；当前灯箱沿用同一图片源。

每个条目使用唯一且稳定的 `id`；随机文字尤其不要在调整顺序时改变 ID，因为本地收藏依靠它识别条目。

`isPlaceholder: true` 会显示占位标记，正式素材确认后改为 `false`（编辑器中有对应开关）。JSON 中未知链接留空字符串，页面会省略操作；旧 JS 数据可继续使用 `null`。页脚社交地址在 `site.socials`，My World 的社交链接独立在编辑器管理。

演唱会日期填写 ISO 格式，如 `YYYY-MM-DD`。图片字段包括 `src`、`alt`、`caption` 和 `isPlaceholder`；相册还支持 `shape: 'landscape' | 'portrait'` 以及 CSS `object-position` 格式的 `position`。

请为真实图片填写准确的替代文本。正式项目、歌曲与经历均由本人提供；示例不代表真实经历。

## 布局与样式

- `src/styles/tokens.css`：配色、字体、全局间距。
- `src/styles/base.css`：基础元素、焦点、动效与减少动态效果支持。
- `src/styles/layout.css`：页面布局和响应式规则。
- `src/styles/appearance.css`：浅色壁纸遮罩、首页头像与壁纸选择器。
- `src/styles/home.css`：四屏首页、侧边头像、逐字标题与翻屏回弹。
- `src/styles/scrapbook.css`：手账封面、主题书签、笔记/唱片/便签构图和微幅循环；`useAmbientMotion.js` 管理暂停、系统减少动态偏好与后台暂停。
- `src/components/`：导航、作品、歌曲、回忆、相册与原生 dialog 灯箱。
- `src/composables/`：滚动出现与本地收藏。

修改数据后页面会自动更新；正式素材比例较占位素材发生变化时，需要重新检查裁切与移动布局。

## 本地收藏

收藏键为 `peanora:little-favorites:v1`。仅保存在当前浏览器，不跨设备同步。读写失败会提示；不存在于当前数据中的旧 ID 不再展示。原生 dialog 灯箱提供键盘焦点约束、Escape 关闭与焦点返回。

## 素材与许可

- 当前 SVG 全部是本项目原创占位插画，不是实际游戏截图、歌曲封面或演唱会照片。
- `src/assets/artwork/` 中的 JPG 是本人提供的头像与壁纸，保留原图内容。背景浅化由 CSS 透明度与暖白遮罩实现；它们不被视为项目截图或实际演唱会照片，作品权利仍归原作者。
- 网页使用 `src/assets/artwork/web/` 下的 WebP 副本：头像最长边 640px，书签 240px，前景插画通过 `ArtworkImage.vue` 在 640/1080/1920px 中按屏幕与像素密度选择；浅背景最多 1080px。保留原比例，失败时回退小图并有限重试。可用 `scripts/prepare-artwork.py`（Pillow）重新生成；普通构建不依赖 Python。
- Instrument Serif 自托管，源自 Google Fonts 中的官方字体文件；SIL OFL 1.1 许可保存在 `src/assets/fonts/OFL.txt`，并通过 `public/licenses/Instrument-Serif-OFL.txt` 一并复制到构建产物。
- 中文使用自托管霞鹜文楷轻便版（LXGW WenKai Lite），来源 `https://github.com/lxgw/LxgwWenKai-Lite`；OFL 1.1 及网页转换附加许可保存于 `src/assets/fonts/LXGW-WenKai-Lite-OFL.txt`、`public/licenses/`。只转换为网页 WOFF2，不分发可安装桌面字体。
- `src/styles/wenkai.css` 为生成的字体声明：现有文字优先使用小字体包，新文字自动使用完整包。可选脚本 `scripts/prepare-wenkai.py` 接收上游 TTF 路径生成两份 WOFF2（需 Python `fonttools[woff]`）；正常运行、构建、增加签名均不依赖 Python。
- 当前标题使用 Kalam，栏目与英文 UI 使用 Nunito，两者均来自 Google Fonts，SIL OFL 1.1 许可保留在 `src/assets/fonts/` 和 `public/licenses/`。网页加载 Latin WOFF2 子集（含拉丁文、常用标点和箭头），可用 `scripts/prepare-latin-fonts.py`（fonttools[woff]）重新生成；原 TTF 保留。中文继续使用霞鹜文楷。旧 Instrument Serif 保留于源码，不再作为默认标题字体。
- 音乐空间为非官方个人空间，只使用本人原创、授权素材或官方平台链接；没有抓取歌曲或摄影作品。

## GitHub Pages 发布

当前自定义域名为 `https://peanora.cn`，生产基础路径为 `/`，部署状态以仓库 Actions 与 Pages 设置为准。原 GitHub 项目地址保留为历史发布记录。
发布配置、验证和后续维护见 `docs/DEPLOYMENT.md`。

采用 History 路由，页面为 `/`、`/world`、`/music`、`/little-things`。Vite 构建为三个固定子页面自动生成各自目录的 `index.html`，让 GitHub Pages 为子页直达和刷新返回 200；无尾斜杠的地址可能先被 Pages 重定向至带 `/` 的目录地址。未知路径继续使用 `404.html` 并显示原有 NotFound 页面。所有入口内容与根入口相同，共用根路径资源；这是静态文件入口，不是服务器 rewrite。新增静态路由时同步更新 `vite.config.js` 的入口列表。旧 `/#/music` 等地址仍自动转换，保留查询参数和章节锚点。

生产 Vite `base` 保持 `/`，构建方式：

```powershell
$env:VITE_BASE_PATH = '/'
npm run build
Remove-Item Env:VITE_BASE_PATH
```

`.github/workflows/deploy-pages.yml` 在推送到 `main` 时自动安装锁定依赖、运行测试、以 `/` 为 base 构建并发布 `dist/`，也可从 Actions 手动运行。保留已绑定的 `peanora.cn` 和现有 Pages 设置，不要恢复 `/peanoras-space/`。

## 验收记录

原始功能验证见 `docs/VERIFICATION.md`；暖色四屏首页见 `docs/PAGED-HOME-VERIFICATION.md`，最新手账构图与持续动效见 `docs/SCRAPBOOK-VERIFICATION.md`。浏览器尺寸模拟与实机测试区分记录，未验证的项目不视为通过。

欢迎语、个性签名与中文字体的最新验证见 `docs/WELCOME-SIGNATURE-VERIFICATION.md`。

手机翻页与资源加载优化见 `docs/MOBILE-PERFORMANCE-VERIFICATION.md`；最新要求移除页面“暂停动态”按钮，保留系统减少动态及后台暂停。

## 官方音乐播放器

顶部“听歌”打开面板，再点击“加载官方播放器”；音乐页的“打开播放器”也可直接加载同一个面板。使用网易云官方 iframe，默认不自动播放，播放/暂停/进度由平台控制。收起与站内导航保留 iframe，“停止播放”将其卸载；重新加载会重建播放器。初次访问不请求网易云。

曲目在 `src/data/songs.js`，提供 `neteaseId` 与 `officialUrl` 即可接入官方外链；未提供封面继续用明确的占位封面，未提供个人感想可保持 `null`。平台可能限制站外播放，官方收听链接始终保留。实现不包含音频托管、NCM 转换、非官方代理或绕过会员限制。验证见 `docs/MUSIC-PLAYER-VERIFICATION.md`。
