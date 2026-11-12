# TODO 清单：接入与验收

更新：2026-11-12。

## 当前范围

- 顶栏「我的 → TODO 清单」，路径 `/todo`，构建生成 `/todo/index.html`。
- 所有访客可使用邮箱验证码注册 / 登录，各自管理私人清单。支持添加、编辑、完成 / 恢复、删除确认及筛选。
- 数据流：用户提交 → Supabase Auth 验证身份 → Data API → PostgreSQL `todo_items` → 行级权限检查 → 返回实际保存结果 → 页面更新。
- 只在服务器确认后更新清单，失败保留当前输入。切换账号或退出后清空页面数据，忽略旧请求结果。
- 待办不存入公开 JSON、Git 或静态 HTML；浏览器只保存登录会话，不缓存待办正文。退出只影响当前浏览器。
- 打开页面、返回标签页和点击「刷新」获取其他设备的最新列表。不含实时协作、离线编辑、截止日期或提醒。
- 修改 / 删除使用 `updated_at` 检测其他设备的修改，冲突时保留输入，刷新后再提交。
- 未配置连接信息时显示「清单还在准备中」，不提供假登录或假同步。

## 1. 创建项目

1. 打开 [Supabase 控制台](https://supabase.com/dashboard)，登录并创建项目。项目名可用 `peanoras-space`，区域按主要用户所在地选择。
2. 数据库密码由站主保存；网页不需要它。
3. 从 Connect / API Keys 页面取得 **Project URL** 与 **Publishable key**（`sb_publishable_...`）。网页只接受公开键，拒绝 `sb_secret_...` 和旧 JWT 键。
4. 在 SQL Editor 执行 [一次性建表与权限脚本](../supabase/migrations/202611120001_todo_items.sql)，不重复执行。

现有 GitHub Pages / `peanora.cn` 保持，无需新增网站托管。

## 2. 配置邮箱验证码

1. Authentication → Sign In / Providers：启用 Email、允许新用户注册，不启用匿名登录。
2. URL Configuration：Site URL 设为 `https://peanora.cn`。本实现原地输入验证码，不依赖邮件链接跳转。
3. Email Templates：将 **Magic Link** 和 **Confirm signup** 两个模板都改为显示 `{{ .Token }}`，保证首次注册和再次登录均可使用数字验证码。正文示例：

   ```html
   <h2>登录 Peanora's Space</h2>
   <p>你的验证码是：<strong>{{ .Token }}</strong></p>
   <p>请回到 TODO 清单页面输入。若不是你本人操作，请忽略此邮件。</p>
   ```

4. 建议验证码有效期 10 分钟、发送间隔至少 60 秒。页面兼容 6–10 位数字，不硬编码服务端有效期。
5. 配置自定义 SMTP：填发件地址、Host、Port、Username、Password，按邮件服务要求验证发信域名。SMTP 密码仅填在 Supabase 控制台。
6. **内置邮件服务仅给项目团队预授权地址发信，不适合公开注册；公开使用前必须配置自定义 SMTP。**实际限流由 Supabase 执行，页面倒计时不是服务端限流。若启用防滥用挑战，需要先补接挑战组件。

依据：[邮箱 OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless)、[SMTP 限制](https://supabase.com/docs/guides/auth/auth-smtp)、[邮件模板](https://supabase.com/docs/guides/auth/auth-email-templates)。

## 3. 本地连接

复制 `.env.example` 为 `.env.local`，填写：

```dotenv
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_你的公开键
```

重启 `npm run dev`，访问 `http://127.0.0.1:5173/todo`。不要把数据库密码、SMTP 密码、Secret key 或用户令牌写入任何 `VITE_` 变量。`.env.local` 已忽略。

## 4. 生产发布

在 GitHub 仓库 Settings → Secrets and variables → Actions → **Variables** 添加上述两个同名 Repository variables。公开值可在浏览器查看，数据隔离依靠 RLS 与用户身份。

工作流已读取这两个变量。配置后必须重新构建，变量修改不会改变已发布网页。本轮未推送或部署；后续按站主指令沿用现有 Actions。

## 5. 权限与真实验收

建表脚本开启并强制 RLS；匿名角色没有表权限。登录用户所有读写都受 `auth.uid() = user_id` 限制。列权限与触发器禁止转移所属账户和改写 ID / 创建时间。前端 owner 过滤仅辅助，数据库策略承担隔离。

配置项目后执行；未执行前不能声称真实邮件、云端同步与线上隔离通过：

1. 两个邮箱各收取验证码；首次自动注册，重复登录恢复清单；错误 / 过期验证码失败。
2. A 账户增改、完成、删除，刷新或换设备确认实际保存；网络失败不能显示成功。
3. B 看不到 A 的内容。用用户 JWT 通过 Data API 检查 B 不能读取 / 修改 / 删除 A 的 ID，也不能插入 `user_id=A`。不能只验收 UI 隐藏。
4. 无用户 JWT 的公开键访问表被拒绝。Secret key 绕过 RLS，不用于该测试。
5. 同一账户两个设备修改同一条目：旧版本提示冲突，刷新后重试。
6. 退出后清空内容和输入；同一浏览器其他标签也退出；其他设备保持登录符合当前浏览器退出的定义。
7. 发布后 `/todo/` 直达和刷新正常，导航可用，普通首页不请求 Supabase。

本地证据见 [TODO 验证记录](TODO_VERIFICATION.md)。
