# 站点账号、友链与留言

更新：2026-11-20。

从首页封面点「账号登录」。首次用邮箱验证码验证身份，登录后填写用户名和密码。后续可用用户名密码登录，也可用邮箱验证码恢复访问后更改密码。两种方式使用同一个 Supabase 用户 ID，原有私人待办随账号保留。用户名为 3–24 位字母、数字或下划线，大小写等同，设置后固定。

「社交 → 友链」和「社交 → 留言」允许任何人阅读已公开条目。登录者可以提交申请或留言，在「我的提交」看状态或撤回。公开列表只返回填写的展示名称、正文、链接、日期和条目标识，不包含账户邮箱或用户 ID。默认没有示例友链或留言。

## 上线顺序

1. 在现有 `peanoras-space` Supabase 项目的 SQL Editor 中运行 [社区与账号迁移](../supabase/migrations/202611200001_site_accounts_and_community.sql)。已有 TODO 线上表无需重新运行旧迁移。先应用此迁移，再部署用户名函数。
2. 使用登录了同一 Supabase 项目的 CLI，从仓库根目录部署函数。CLI 可通过 `npx supabase` 启动，无需把访问令牌写入仓库。

   ```powershell
   npx supabase functions deploy username-login --remote=oybzmebyslabrjgkfuml --no-verify-jwt --use-api
   ```

   登录请求还没有用户令牌，函数因此接收未登录请求，再由 Supabase Auth 校验密码。函数仅接受 `https://peanora.cn` 及本地 5173 的浏览器来源。映射和限流仅服务器角色可查询。函数读取 Supabase 提供的服务器环境变量；前端继续沿用两个已有的公开构建变量。参考 [函数验证配置](https://supabase.com/docs/guides/functions/function-configuration) 和 [函数环境变量](https://supabase.com/docs/guides/functions/secrets)。
3. 用本机 `npm run dev` 的 `http://127.0.0.1:5173/` 先做真实账号验收。用已登录用户设置用户名和密码、退出、用新凭据登录，确认原待办仍存在。再用另一个邮箱确认用户名冲突和数据隔离。
4. 验收后沿用现有 GitHub Pages 工作流发布前端。上线后复测 `/friends/`、`/guestbook/` 和首页账号弹窗。

## 审核公开内容

在 Supabase 的 Table Editor 打开 `public.community_entries`，筛选 `status = pending`。`kind = friend` 是友链申请，`kind = message` 是留言。核对名称、正文和链接后，将 `status` 改为 `published` 公开，或改为 `rejected` 拒绝。访客可刷新页面查看公开内容，提交者可在自己的提交里查看结果。站主可用同一表编辑错字或调整状态；`withdrawn` 表示已经撤回，默认不公开。首次可等真实访客提交，或由站主通过表单提交已确认的站点再审核。

## 验证方式

- `npm test` 检查账号方法、旧待办、公开数据接口和用户名函数的处理逻辑。`npm run build` 生成 GitHub Pages 的独立入口。
- `node scripts/verify-community-rls.mjs` 在本地 PostgreSQL 引擎执行实际迁移并测试匿名、两账号和服务角色。安装可选运行库的办法见 [TODO 本地验证记录](TODO_VERIFICATION.md)。
- `scripts/verify-todo-browser.js` 使用本地模拟 HTTP 响应验证首页和社区表单，以及共享同一账号的待办。通过本地测试不代表已在真实 Supabase 项目部署或验证。

2026-11-20 本地结果：73 项单元及构建测试通过。新迁移在本地 PostgreSQL 引擎验证了 10 组账号与社区权限，原 TODO 另有 16 组权限检查通过。Edge 浏览器使用测试接口跑通了首页弹窗、邮箱验证码、设置密码、用户名重登后读到原待办、留言与友链审核状态、撤回和窄屏布局。真实 Supabase 用户名登录和跨账户社区流程待上线后验收。
