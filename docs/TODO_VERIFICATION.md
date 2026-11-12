# TODO 本地验证记录

日期：2026-11-12。当前未创建真实 Supabase 项目，未推送或部署。

## 已执行

- `npm test`：66 / 66 通过。新增覆盖 OTP 注册 / 验证、验证码错误与冷却、实际保存后更新、失败保留、字段限制、读写异步竞争、退出与换号清空、分页与修改版本条件。
- `npm run build`：通过，生成 `dist/todo/index.html`，包含独立标题与 `noindex,nofollow`；现有生产构建测试继续确认编辑器、草稿正文和本机私有音频不泄漏。TODO 和 Supabase SDK 随 TODO 路由懒加载。
- `git diff --check`：通过。
- Edge 桌面浏览器，1440×1000、390×844、320×700 视口：未配置状态；从「我的」进入；邮箱发送限流提示；错误验证码；登录；新增、编辑、完成、筛选；保存网络失败不保留错误勾选；刷新恢复；删除取消 / 确认；退出；手机菜单入口；窄屏无横向溢出。最终一轮无未处理页面异常，主动制造的 HTTP 429 / 403 和网络失败会产生预期网络错误日志。
- 上述浏览器使用被拦截的本地 HTTP 测试响应，不发出真实邮件，不等价于已验证 Supabase 服务。
- 真实迁移 SQL 在本地 PGlite PostgreSQL 引擎执行，16 组检查通过：账户自己的 CRUD、跨账户读取 / 更新 / 删除不可见、伪造 owner 的 INSERT 被拒绝、禁止改 owner / ID / 创建与更新时间、匿名四种操作被拒绝、缺少身份不可见、无效标题被拒绝。仅 `auth.users` 与 `auth.uid()` 是本地模拟，不能据此宣称云端项目已配置正确。

## 复现

普通逻辑与构建：`npm test`、`npm run build`。

数据库脚本额外需要一次性安装可选运行库（不进入 package.json 或生产依赖）：

```powershell
npm install --prefix output/playwright/rls-runtime --no-save @electric-sql/pglite
node scripts/verify-todo-rls.mjs
```

浏览器脚本：`scripts/verify-todo-browser.js`。需要一个 4178 端口无配置 Vite 服务、另一个 4179 端口注入以下**测试值**的 Vite 服务，以及 Edge。脚本中的所有该域名请求都由测试响应拦截；生产配置不使用这些值。

```powershell
$env:VITE_SUPABASE_URL = 'https://todo-fixture.supabase.co'
$env:VITE_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_browserfixture'
npm run dev -- --port 4179 --strictPort
```

另一个终端运行无上述环境变量的 `npm run dev -- --port 4178 --strictPort`。随后：

```powershell
npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:4178/todo --browser=msedge
npx --yes --package @playwright/cli playwright-cli run-code --filename scripts/verify-todo-browser.js
```

截图输出到 `output/playwright/todo-*.png`，已查看桌面登录与手机清单截图确认排版。清单截图中的邮箱、待办均为明确的测试数据。

## 待真实配置后执行

真实邮件送达 / 延迟 / 垃圾箱、公开注册 SMTP、实际 Supabase RLS 与 REST 请求、两邮箱两设备同步、真实会话过期与多标签退出、生产域名直达和刷新、真实手机 / Safari / Firefox / 屏幕阅读器。按 [TODO_SETUP.md](TODO_SETUP.md) 的验收步骤继续。
