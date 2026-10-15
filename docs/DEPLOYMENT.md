# GitHub Pages 发布记录

## 地址与维护

- 发布授权：2026-10-15，用户要求“你先给我搞一个github的网址吧”。
- 当前地址：<https://peanora.cn/>；详情示例：`https://peanora.cn/music`。旧仓库地址属于历史发布记录。
- GitHub Pages 来源为 GitHub Actions，自定义域名沿用用户已绑定的 `peanora.cn`；本次不修改任何域名、证书或 HTTPS 强制设置。
- 工作流：`.github/workflows/deploy-pages.yml`。main 的应用代码更新会自动测试、构建、发布；只有文档更新时不重复部署。若以后将 Markdown 用作站点内容，需同步调整触发规则。
- 工作流 `VITE_BASE_PATH: /` 沿用用户远程提交 `d8e66fd`，本地同步后保持不变。History 构建为三个已知子页生成目录 `index.html`，解决最终响应为 404 的问题；未知地址保留 `404.html`，详见 `HISTORY-ROUTING-VERIFICATION.md`。
- 发布目录为 `dist/`；不要把源码当作静态构建产物上传。

## 首次发布的历史检查（子目录 Hash 方案，已被上述当前配置替代）

- `npm test`：5 项通过。
- `VITE_BASE_PATH=/peanoras-space/` 下 `npm run build` 成功。
- 本地使用相同 base 启动构建预览：首页正常载入；点击进入 Music 并等待路由完成后刷新，仍正常显示详情。
- 头像和十张插画从原始 JPG 生成等比例 WebP 网页副本，原图保留。图片总大小从 37,966,354 字节减少为 1,818,942 字节，约减少 95%。头像最长边 640px，插画最长边 1920px。
- 正常 CI 仅需 Node 与锁定的 npm 依赖，图片副本和字体资源已提交，不依赖 Python。

## 首次发布

- 应用提交：`3fea339bdda67877663ec6029a025fc300c2cb28`。
- Actions：[首次构建与发布](https://github.com/Peanora/peanoras-space/actions/runs/38688860069)。
- Actions 的 build 与 deploy 均完成且结论为 `success`；Pages 设置为 workflow 发布，`https_enforced: true`，无自定义域名。
- 公开首页请求返回 HTTP 200，标题为 Peanora's Space，脚本和样式使用正确的 `/peanoras-space/assets/` 路径。
- 线上 25 个构建资源的 HEAD 请求全部返回 HTTP 200，无失败，包含脚本、样式、图片和字体。
- 浏览器实际载入公开首页，观察到导航、完整网站名、欢迎语、打字机签名及主题书签。随后进入 World 后，浏览器自动化连接反复超时；未完成全部线上详情交互、刷新、移动端和截图复查，不能将这些标记为通过。本地相同发布构建的 Music 导航与刷新已验证。

## 自检与限制

构建子目录站点后，在 PowerShell 中预览需要使用相同的 base：

```powershell
$env:VITE_BASE_PATH = '/peanoras-space/'
npm run build
npm run preview
```

关闭预览后移除该环境变量，再继续默认根路径开发：`Remove-Item Env:VITE_BASE_PATH`。

当前没有实测国内多地区、不同运营商与真实手机网络的速度，成功部署不等于各地区访问速度一致。原始素材和真实触摸/屏幕阅读器的测试限制仍以各验证文档为准。

## 手机体验更新 · 2026-10-15

- 最新应用提交：`58fc7b0a326faf7625b5c75cc8d84c254b1909c8`，包含 `5ddbacc` 的资源优化与触摸修复。
- [自动测试、构建与发布](https://github.com/Peanora/peanoras-space/actions/runs/38691327492) 已完成，结论 `success`。
- 公开入口返回 HTTP 200，入口脚本 `index-D5-TiRME.js` 与本地最终构建一致；54 个构建资源的线上 HEAD 检查全部返回 HTTP 200。
- 本地浏览器布局、导航、图片和键盘验证见 `MOBILE-PERFORMANCE-VERIFICATION.md`。本轮公开网站的浏览器读取仍超时，因此线上确认依据为成功部署、实际入口与资源 HTTP 检查，不能声称已完成线上手机实机验证。
