# History 路由迁移 · 2026-10-15

## 最小实现

- `src/router/index.js` 改用 `createWebHistory(import.meta.env.BASE_URL)`，路由表、组件、标题与滚动逻辑不变。现有页面为 `/`、`/world`、`/music`、`/little-things`；未知地址仍进入原有 NotFound。
- `src/router/legacyHistory.js` 在 Router 初始化前识别旧 `#/` 链接，用同源 `history.replaceState` 替换当前地址；保留外层查询、路由查询（包括重复键和编码）与章节锚点。没有网络跳转、不新增历史记录、不影响正常 `#about` 锚点。
- `vite.config.js` 的构建插件在最终 HTML 生成后自动输出相同内容的 `404.html`，不手工复制；根路径资源在任意子页都可以解析。
- 同步用户已在远程提交的 `d8e66fd`（Actions base 改为 `/`）。本次不再修改工作流、依赖、域名绑定、HTTPS 设置、视觉、页面文案或业务组件。

## 已验证

- `npm test`：18 项通过，含旧链接迁移用例：首页/全部子页、查询与章节、重复参数/编码、不循环与同源限制，以及刷新旧页面时历史位置/滚动/其他状态保留。旧 Vue Router 保存的 current 同步为新地址，避免后退时丢失合并后的查询。
- `VITE_BASE_PATH=/ npm run build` 成功；实际产物 `index.html` 与 `404.html` 的 SHA256 相同，入口 JS/CSS 均使用 `/assets/`。
- 使用临时本地静态服务器模拟 Pages：根路径 200，缺失文件回退 `dist/404.html` 并真实返回 404，而不是 Vite 开发服务器的 200 回退。该服务器仅供验收，不加入生产依赖或部署流程。
- 模拟环境浏览器实际检查 `/world`、`/music`、`/little-things` 的直达/导航及刷新，均渲染对应页面；首页和旧 `/#/` 正常。
- 浏览器从 Music 进入 Little，后退回 Music，再前进回 Little，地址与页面一致。
- 旧 `/?from=friend#/music?track=1982799628#songs` 实际变为 `/music?from=friend&track=1982799628#songs`，刷新后仍为 Music。原生章节锚点保留，播放器仍为点击加载。
- World 页面图片实际加载完成，导航链接为 `/world`、`/music`、`/little-things`。源代码未发现需要替换的业务硬编码 `/#/` 链接；文档和测试中保留旧链接示例用于兼容说明。

## 初版平台限制与后续处理

GitHub Pages 自定义 404 只是错误文档回退，不能提供真实的服务器 rewrite。初版仅生成 404.html 时，已知子页直达即使显示正常也返回 HTTP 404。后续改为给固定路由生成真正的目录入口，解决这些页面的最终状态码；未知路径仍保留 404。现有配置不依赖额外服务器、付费服务、重定向中转或隐藏 Hash。真实手机和其他浏览器未实测。

官方说明：[GitHub Pages 自定义 404](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-custom-404-page-for-your-github-pages-site)、[Vue Router History 模式](https://router.vuejs.org/guide/essentials/history-mode.html)。

## 最终线上确认

- 应用提交 `dd92e27ddebeb13aee5402e048de9cbaedba1ffb` 已推送 main，[Actions 38721319612](https://github.com/Peanora/peanoras-space/actions/runs/38721319612) 的构建与发布成功。
- `https://peanora.cn/` 返回 200；`/world`、`/music`、`/little-things` 返回 404，响应内容均为应用入口，引用最终脚本 `/assets/index-4gv6QhPK.js`；`/404.html` 返回 200。根路径和子页面返回的是同一发布版本。
- 54 个线上构建资源 HEAD 均返回 200，包含 JS/CSS/图片/字体。Pages 自定义域名仍是 `peanora.cn`，build_type 和 https_enforced 与修改前一致；工作流、依赖和 public 目录没有本次改动。
- 最终构建再次在本地 Pages 模拟环境验证旧查询链接变为 `/music?from=friend&track=1982799628`，截图为 `previews/history-routing-local.png`。
- 线上音乐页的浏览器读取两次超时，没有完整重测线上交互；浏览器导航、刷新、前进/后退和旧链接的交互验证来自本地同一发布构建，线上确认来自实际 HTTP 响应、资源与成功部署。没有把这些标记为真实手机或全部线上浏览器测试通过。

## 固定子页面真实入口（替代上述已知页面的 404 状态）

- 用户追问“子页面直达返回404怎么解决”，采用固定静态入口方案：`dist/world/index.html`、`dist/music/index.html`、`dist/little-things/index.html`；原 `404.html` 保留用于未知地址。
- 仅扩展 Vite 构建插件的输出列表，业务 JS、样式、路由、域名、Actions 和依赖不变。原根路径资源绝对引用可在这些目录下正常使用。
- `npm test` 18 项通过，构建成功；三个目录入口和 404.html 的实际 SHA256 均与根 index.html 一致。
- GitHub Pages 可将 `/music` 先重定向至 `/music/`；Vue Router 默认支持尾斜杠。最终目录入口应由静态文件服务返回 200。这不是完整的服务器 rewrite，也不是服务端预渲染。
