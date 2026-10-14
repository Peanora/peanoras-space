# Peanora's Space

Vue 3、Vite、JavaScript、CSS 与 Vue Router 构成的个人网站。采用深色编辑式排版，个人世界与音乐回忆同等突出。

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

## 更新内容

页面与数据分开，主要内容集中在 `src/data/`。

| 内容                                         | 数据文件          |
| -------------------------------------------- | ----------------- |
| 昵称、网站名称、导航、社交地址、首页主题入口 | `site.js`         |
| 个人介绍、兴趣、正在学习、未来方向           | `profile.js`      |
| 项目名称、封面、技术、状态、GitHub、演示     | `projects.js`     |
| 学习与竞赛经历                               | `experience.js`   |
| 歌曲名称、艺术家、感想、官方地址             | `songs.js`        |
| 演唱会日期、地点、文字、照片、纪念物         | `memories.js`     |
| 相册图片、说明与裁切位置                     | `gallery.js`      |
| 随机文字与稀有纸条                           | `littleThings.js` |

新图片放入 `src/assets/images/`，在对应数据文件中 `import` 后引用。不要使用根路径 `/图片名`，这样更容易适配仓库子目录。图片应压缩为适当尺寸，并为缩略图考虑独立的大图策略；当前灯箱沿用同一图片源。

每个条目使用唯一且稳定的 `id`；随机文字尤其不要在调整顺序时改变 ID，因为本地收藏依靠它识别条目。

`isPlaceholder: true` 会显示占位标记，正式素材确认后改为 `false`。未知链接设为 `null`，页面会省略操作。社交地址填入 `site.socials` 后自动出现在页脚与个人介绍。

演唱会日期填写 ISO 格式，如 `YYYY-MM-DD`。图片字段包括 `src`、`alt`、`caption` 和 `isPlaceholder`；相册还支持 `shape: 'landscape' | 'portrait'` 以及 CSS `object-position` 格式的 `position`。

请为真实图片填写准确的替代文本。正式项目、歌曲与经历均由本人提供；示例不代表真实经历。

## 布局与样式

- `src/styles/tokens.css`：配色、字体、全局间距。
- `src/styles/base.css`：基础元素、焦点、动效与减少动态效果支持。
- `src/styles/layout.css`：页面布局和响应式规则。
- `src/components/`：导航、作品、歌曲、回忆、相册与原生 dialog 灯箱。
- `src/composables/`：滚动出现与本地收藏。

修改数据后页面会自动更新；正式素材比例较占位素材发生变化时，需要重新检查裁切与移动布局。

## 本地收藏

收藏键为 `peanora:little-favorites:v1`。仅保存在当前浏览器，不跨设备同步。读写失败会提示；不存在于当前数据中的旧 ID 不再展示。原生 dialog 灯箱提供键盘焦点约束、Escape 关闭与焦点返回。

## 素材与许可

- 当前 SVG 全部是本项目原创占位插画，不是实际游戏截图、歌曲封面或演唱会照片。
- Instrument Serif 自托管，源自 Google Fonts 中的官方字体文件；SIL OFL 1.1 许可保存在 `src/assets/fonts/OFL.txt`，并通过 `public/licenses/Instrument-Serif-OFL.txt` 一并复制到构建产物。
- 中文使用设备系统字体，不分发系统字体文件。
- 音乐空间为非官方个人空间，只使用本人原创、授权素材或官方平台链接；没有抓取歌曲或摄影作品。

## GitHub Pages 路径准备

采用 Hash 路由，静态托管刷新可直接载入入口文件。地址示例为 `/#/music`，子目录地址为 `/仓库名/#/music`。Hash 路由对搜索收录存在限制；首版没有服务端渲染或预渲染。

默认 Vite `base` 为 `/`。未来若使用仓库子目录，可在 PowerShell 中设置构建路径：

```powershell
$env:VITE_BASE_PATH = '/你的仓库名/'
npm run build
Remove-Item Env:VITE_BASE_PATH
```

GitHub Actions 部署时将同一变量放入构建环境，安装依赖使用 `npm ci`，发布目录为 `dist/`。当前没有部署工作流；推送源码与发布网站是两个独立步骤，部署将在明确提出要求后进行。

## 验收记录

见 `docs/VERIFICATION.md`。浏览器尺寸模拟与实机测试区分记录，未验证的项目不视为通过。
