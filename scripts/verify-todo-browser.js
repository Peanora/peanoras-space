async (page) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const ensure = (value, message) => { if (!value) throw new Error(message); };
  const fixture = 'https://todo-fixture.supabase.co';
  let activeEmail = 'browser-a@example.com', failWrite = false, failSend = false;
  let rows = [], version = 0, providerRequests = 0, accountUsername = '', accountPassword = '';
  let accountOwner = false, ownerChecks = 0;
  const submitted = [];
  const publishedNotes = [];
  let noteWrites = 0;
  const user = () => ({ id: activeEmail.includes('-b@') ? 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' : 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: activeEmail, aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: '2026-11-12T00:00:00Z' });
  const authSession = () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    return { access_token: `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: user().id, exp, aud: 'authenticated', role: 'authenticated' })}.fixture`, refresh_token: 'browser-fixture-refresh', expires_in: 3600, expires_at: exp, token_type: 'bearer', user: user() };
  };
  await page.unroute(`${fixture}/**`);
  await page.route(`${fixture}/**`, async route => {
    const request = route.request(), url = new URL(request.url());
    const method = request.method();
    const body = request.postDataJSON();
    const respond = (json, status = 200) => route.fulfill({ status, headers: { 'x-supabase-api-version': '2024-01-01' }, contentType: 'application/json', body: JSON.stringify(json) });
    if (url.pathname.endsWith('/list_little_notes')) {
      ensure(method === 'GET' && !request.headers().authorization, 'Public notes must load without opening an account session');
      return respond(url.searchParams.get('include_deleted') === 'true' ? publishedNotes : publishedNotes.filter(note => !note.deleted));
    }
    providerRequests++;
    if (url.pathname.endsWith('/delete_little_note')) {
      ensure(accountOwner, 'A regular account tried to delete a note');
      const index = publishedNotes.findIndex(note => note.id === body.note_id);
      if ((publishedNotes[index]?.revision ?? null) !== body.expected_revision) {
        return respond({ code: '40001', message: 'little_note_conflict' }, 409);
      }
      const marker = { id: body.note_id, deleted: true };
      if (index === -1) publishedNotes.unshift(marker);
      else publishedNotes[index] = marker;
      return respond(true);
    }
    if (url.pathname.endsWith('/save_little_note')) {
      ensure(accountOwner, 'A regular account tried to save a note');
      const index = publishedNotes.findIndex(note => note.id === body.note_id);
      if ((publishedNotes[index]?.revision ?? null) !== body.expected_revision) {
        return respond({ code: '40001', message: 'little_note_conflict' }, 409);
      }
      const note = { id: body.note_id, text: body.note_text, source: body.note_source, rare: body.note_rare, revision: `note-version-${++noteWrites}` };
      if (index === -1) publishedNotes.unshift(note);
      else publishedNotes[index] = note;
      return respond(note);
    }
    if (url.pathname.endsWith('/otp')) {
      if (failSend) return respond({ error_code: 'over_email_send_rate_limit', code: 'over_email_send_rate_limit', msg: 'Too many requests' }, 429);
      activeEmail = body.email;
      return respond({});
    }
    if (url.pathname.endsWith('/verify')) {
      if (body.token !== '123456') return respond({ error_code: 'otp_expired', code: 'otp_expired', msg: 'Expired' }, 403);
      return respond(authSession());
    }
    if (url.pathname.endsWith('/logout')) return respond({});
    if (url.pathname.endsWith('/token')) return respond(authSession());
    if (url.pathname.endsWith('/user')) {
      if (method === 'PUT') accountPassword = body.password;
      return respond(user());
    }
    if (url.pathname.endsWith('/username-login')) {
      if (body.username !== accountUsername || body.password !== accountPassword) return respond({ code: 'invalid_login' }, 401);
      const { access_token, refresh_token } = authSession();
      return respond({ access_token, refresh_token });
    }
    if (url.pathname.endsWith('/get_site_username')) return respond(accountUsername || null);
    if (url.pathname.endsWith('/site_is_owner')) {
      ownerChecks++;
      return respond(accountOwner);
    }
    if (url.pathname.endsWith('/set_site_username')) {
      accountUsername = body.requested;
      return respond(accountUsername);
    }
    if (url.pathname.endsWith('/list_site_entries')) return respond(submitted.filter(row => row.kind === body.entry_kind && row.status === 'published'));
    if (url.pathname.endsWith('/site_moderation_queue')) {
      ensure(accountOwner, 'Regular visitors must not request the moderation queue');
      return respond(submitted.filter(row => row.kind === body.entry_kind && row.status === body.entry_status));
    }
    if (url.pathname.endsWith('/review_site_entry')) {
      ensure(accountOwner, 'Regular visitors must not request changes to moderation status');
      const entry = submitted.find(row => row.id === body.entry_id && row.kind === body.entry_kind && row.status === body.expected_status);
      if (!entry) return respond(false);
      entry.status = body.next_status;
      return respond(true);
    }
    if (url.pathname.endsWith('/my_site_entries')) return respond(submitted.filter(row => row.kind === body.entry_kind && row.status !== 'withdrawn'));
    if (url.pathname.endsWith('/submit_site_entry')) {
      const { entry_kind, entry_name, entry_body, entry_url } = body;
      const entry = { id: 'entry-' + submitted.length, kind: entry_kind, display_name: entry_name, body: entry_body, url: entry_url, status: 'pending', created_at: new Date().toISOString() };
      submitted.push(entry);
      return respond(entry.id);
    }
    if (url.pathname.endsWith('/withdraw_site_entry')) {
      submitted.find(row => row.id === body.entry_id).status = 'withdrawn';
      return respond(true);
    }
    if (url.pathname.endsWith('/todo_items')) {
      if (method === 'GET') return respond(rows.filter(row => row.user_id === user().id));
      if (failWrite) return route.abort('failed');
      let row;
      if (method === 'POST') {
        row = { ...body, id: `fixture-${++version}`, completed: false, created_at: new Date().toISOString(), updated_at: `v${version}` };
        rows.unshift(row);
      } else {
        const id = url.searchParams.get('id')?.slice(3);
        row = rows.find(row => row.id === id);
        if (!row) return respond(null);
        if (method === 'PATCH') Object.assign(row, body, { updated_at: `v${++version}` });
        if (method === 'DELETE') rows = rows.filter(item => item.id !== id);
      }
      return respond(row, method === 'POST' ? 201 : 200);
    }
    throw new Error(`Unexpected fixture request ${method} ${url.pathname}`);
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('http://127.0.0.1:4178/todo/');
  await page.getByRole('heading', { name: '清单还在准备中' }).waitFor();
  ensure(await page.getByRole('textbox').count() === 0, 'Unconfigured page must not offer fake login');
  await page.goto('http://127.0.0.1:4179/');
  await page.getByRole('heading', { name: "Peanora's Space", exact: true }).waitFor();
  ensure(providerRequests === 0, 'Homepage must not contact the TODO provider');
  await page.getByRole('button', { name: '账号登录', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: '账号登录与设置' });
  await dialog.getByLabel('用户名', { exact: true }).waitFor();
  await page.screenshot({ path: 'output/playwright/home-account-desktop.png', animations: 'disabled' });
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: '我的', exact: true }).click();
  await page.getByRole('link', { name: 'TODO 清单', exact: true }).click();
  await page.getByLabel('邮箱地址', { exact: true }).waitFor();
  await page.screenshot({ path: 'output/playwright/todo-login-desktop.png' });
  await page.getByLabel('邮箱地址', { exact: true }).fill(activeEmail);
  failSend = true;
  await page.getByRole('button', { name: '发送验证码', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: '太频繁' }).waitFor();
  ensure(await page.getByLabel('邮箱地址', { exact: true }).count() === 1, 'Failed send advanced form');
  failSend = false;
  await page.getByRole('button', { name: '发送验证码', exact: true }).click();
  await page.getByLabel('邮箱验证码', { exact: true }).fill('999999');
  await page.getByRole('button', { name: '登录 / 注册', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: '已过期' }).waitFor();
  await page.getByLabel('邮箱验证码', { exact: true }).fill('123456');
  await page.getByRole('button', { name: '登录 / 注册', exact: true }).click();
  const add = page.getByLabel('添加待办', { exact: true });
  await add.waitFor({ state: 'visible' });
  await page.getByText('清单还是空的，写下第一件待办吧。', { exact: true }).waitFor();
  await add.fill('浏览器验收用的待办');
  await page.getByRole('button', { name: '添加', exact: true }).click();
  await page.locator('.todo-item-title').filter({ hasText: '浏览器验收用的待办' }).waitFor();
  await page.getByRole('button', { name: '编辑：浏览器验收用的待办', exact: true }).click();
  await page.getByLabel('编辑待办', { exact: true }).fill('修改后的验收待办');
  await page.getByRole('button', { name: '保存', exact: true }).click();
  const checkbox = page.getByRole('checkbox', { name: '标为已完成：修改后的验收待办', exact: true });
  await checkbox.waitFor();
  failWrite = true;
  await checkbox.click();
  await page.getByRole('alert').filter({ hasText: '网络' }).waitFor();
  ensure(!await checkbox.isChecked(), 'Failed write must restore unchecked display');
  failWrite = false;
  await checkbox.click();
  await page.getByRole('checkbox', { name: '标为待完成：修改后的验收待办', exact: true }).waitFor();
  await page.getByRole('button', { name: '待完成 0', exact: true }).click();
  await page.getByText('这一页的待办都完成了。', { exact: true }).waitFor();
  await page.getByRole('button', { name: '已完成 1', exact: true }).click();
  await page.locator('.todo-item-title').filter({ hasText: '修改后的验收待办' }).waitFor();
  await page.reload();
  await page.getByRole('checkbox', { name: '标为待完成：修改后的验收待办', exact: true }).waitFor();
  await page.getByRole('button', { name: '账号设置', exact: true }).click();
  await dialog.getByLabel('设置用户名', { exact: true }).fill('Browser_Account');
  const fixturePassword = 'Vz8g+Q';
  ensure(await dialog.getByLabel('新密码', { exact: true }).getAttribute('minlength') === '6', 'New password minimum is not six characters');
  ensure(await dialog.getByLabel('确认新密码', { exact: true }).getAttribute('minlength') === '6', 'Password confirmation minimum differs');
  await dialog.getByLabel('新密码', { exact: true }).fill(fixturePassword);
  await dialog.getByLabel('确认新密码', { exact: true }).fill(fixturePassword);
  await dialog.getByRole('button', { name: '保存登录密码', exact: true }).click();
  await dialog.getByRole('status').filter({ hasText: '已保存' }).waitFor();
  ensure(accountUsername === 'browser_account', 'Username was not normalized');
  await dialog.getByRole('button', { name: '退出登录', exact: true }).click();
  await dialog.getByLabel('用户名', { exact: true }).fill('BROWSER_ACCOUNT');
  await dialog.getByLabel('密码', { exact: true }).fill('wrong password');
  await dialog.getByRole('button', { name: '登录', exact: true }).click();
  await dialog.getByRole('alert').filter({ hasText: '用户名或密码不正确' }).waitFor();
  await dialog.getByLabel('密码', { exact: true }).fill(fixturePassword);
  await dialog.getByRole('button', { name: '登录', exact: true }).click();
  await dialog.getByRole('link', { name: '打开我的清单' }).click();
  await page.getByRole('checkbox', { name: '标为待完成：修改后的验收待办', exact: true }).waitFor();
  await page.screenshot({ path: 'output/playwright/todo-list-desktop-fixture.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'output/playwright/todo-list-mobile-fixture.png' });
  ensure(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile horizontal overflow');
  await page.getByRole('button', { name: '删除：修改后的验收待办', exact: true }).click();
  await page.getByRole('button', { name: '取消', exact: true }).click();
  ensure(rows.length === 1, 'Cancel must retain row');
  await page.getByRole('button', { name: '删除：修改后的验收待办', exact: true }).click();
  await page.getByRole('button', { name: '确认删除', exact: true }).click();
  await page.getByText('清单还是空的，写下第一件待办吧。', { exact: true }).waitFor();

  const previousOwnerChecks = ownerChecks;
  await page.goto('http://127.0.0.1:4179/guestbook/');
  await page.getByLabel('公开昵称', { exact: true }).fill('验收访客');
  await page.getByLabel('留言内容', { exact: true }).fill('这是一条本地验证留言。');
  await page.getByRole('button', { name: '提交留言', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '已提交' }).waitFor();
  const publicFeed = page.getByRole('region', { name: '已公开的内容' });
  ensure(await publicFeed.getByText('这是一条本地验证留言。', { exact: true }).count() === 0, 'Pending message leaked into public feed');
  await page.getByText('我的提交', { exact: true }).click();
  await page.getByText('待审核', { exact: true }).waitFor();
  ensure(ownerChecks > previousOwnerChecks, 'Owner status was not checked');
  ensure(await page.getByRole('heading', { name: '留言审核' }).count() === 0, 'Regular account sees review panel');
  await page.goto('http://127.0.0.1:4179/little-things/');
  await page.getByRole('heading', { name: 'Little Things', exact: true }).waitFor();
  const publicPaper = page.getByRole('region', { name: '随机文字' });
  await publicPaper.getByText('把喜欢的东西，慢慢收集起来。', { exact: true }).waitFor();
  ensure(await page.getByText('管理纸条', { exact: true }).count() === 0, 'Regular account sees paper editor');
  accountOwner = true;
  await page.goto('http://127.0.0.1:4179/guestbook/');
  const messageReview = page.getByRole('region', { name: '留言审核' });
  await messageReview.getByText('这是一条本地验证留言。', { exact: true }).waitFor();
  await messageReview.getByRole('button', { name: '通过并公开' }).click();
  await publicFeed.getByText('这是一条本地验证留言。', { exact: true }).waitFor();
  await page.screenshot({ path: 'output/playwright/guestbook-mobile-fixture.png', animations: 'disabled' });
  ensure(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Guestbook horizontal overflow');
  await page.getByText('我的提交', { exact: true }).click();
  await page.getByRole('button', { name: '撤回', exact: true }).click();
  await page.getByRole('button', { name: '确认撤回', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '已撤回' }).waitFor();

  await page.goto('http://127.0.0.1:4179/friends/');
  await page.getByLabel('站点名称', { exact: true }).fill('测试友链');
  await page.getByLabel('站点网址', { exact: true }).fill('https://example.com');
  await page.getByLabel('站点介绍', { exact: true }).fill('仅用于浏览器测试。');
  await page.getByRole('button', { name: '提交友链申请', exact: true }).click();
  await page.getByRole('status').filter({ hasText: '已提交' }).waitFor();
  ensure(await publicFeed.getByRole('link', { name: '测试友链' }).count() === 0, 'Pending link leaked');
  const friendReview = page.getByRole('region', { name: '友链审核' });
  await friendReview.getByRole('button', { name: '拒绝', exact: true }).click();
  await friendReview.getByRole('status').filter({ hasText: '已拒绝' }).waitFor();
  await friendReview.getByRole('button', { name: '未通过', exact: true }).click();
  await friendReview.getByRole('button', { name: '恢复公开', exact: true }).click();
  const publicLink = publicFeed.getByRole('link', { name: '测试友链' });
  await publicLink.waitFor();
  ensure(await publicLink.getAttribute('href') === 'https://example.com/', 'Friend link destination mismatch');
  await friendReview.getByRole('button', { name: '已公开', exact: true }).click();
  await friendReview.getByRole('button', { name: '撤下', exact: true }).click();
  await publicLink.waitFor({ state: 'hidden' });

  await page.goto('http://127.0.0.1:4179/little-things/');
  await page.getByText('管理纸条', { exact: true }).click();
  const paperList = page.getByRole('list', { name: '纸条列表' });
  const originalPaper = paperList.getByRole('listitem').filter({ hasText: '把喜欢的东西，慢慢收集起来。' });
  await originalPaper.getByRole('button', { name: '修改' }).click();
  ensure(await page.getByRole('textbox', { name: '纸条正文' }).inputValue() === '把喜欢的东西，慢慢收集起来。', 'Original paper did not open for editing');
  await page.getByRole('textbox', { name: '纸条正文' }).fill('改过字的原纸条。');
  await page.getByRole('button', { name: '保存到网站' }).click();
  await publicPaper.getByText('改过字的原纸条。', { exact: true }).waitFor();
  ensure(publishedNotes[0].id === 'little-01', 'Changing an original paper assigned a new ID');
  await page.getByRole('button', { name: '添加纸条' }).click();
  await page.getByRole('textbox', { name: '纸条正文' }).fill('新纸条 <b>原样显示</b>');
  await page.getByRole('textbox', { name: '来源（可选）' }).fill('本地测试');
  await page.getByRole('button', { name: '保存到网站' }).click();
  await publicPaper.getByText('新纸条 <b>原样显示</b>', { exact: true }).waitFor();
  await publicPaper.getByRole('button', { name: '收藏这句' }).click();
  const newPaper = paperList.getByRole('listitem').filter({ hasText: '新纸条 <b>原样显示</b>' });
  await newPaper.getByRole('button', { name: '修改' }).click();
  await page.getByRole('textbox', { name: '纸条正文' }).fill('修改后的新纸条。');
  await page.getByRole('button', { name: '保存到网站' }).click();
  await page.locator('.favorites-list').getByText('修改后的新纸条。', { exact: true }).waitFor();
  ensure(publishedNotes.length === 2, 'Updates must not create duplicate notes');
  await page.screenshot({ path: 'output/playwright/little-notes-owner-mobile.png', animations: 'disabled' });
  ensure(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Paper editor mobile overflow');
  await page.reload();
  await page.locator('.favorites-list').getByText('修改后的新纸条。', { exact: true }).waitFor();
  await page.getByText('管理纸条', { exact: true }).click();
  const uneditedPaper = paperList.getByRole('listitem').filter({ hasText: '有些片段，因为一首歌而被记住。' });
  await uneditedPaper.getByRole('button', { name: '删除', exact: true }).click();
  await uneditedPaper.getByRole('button', { name: '取消', exact: true }).click();
  ensure(!publishedNotes.some(note => note.id === 'little-02'), 'Cancel unexpectedly removed a paper');
  await uneditedPaper.getByRole('button', { name: '删除', exact: true }).click();
  await uneditedPaper.getByRole('button', { name: '确认删除', exact: true }).click();
  await uneditedPaper.waitFor({ state: 'detached' });
  const savedPaper = paperList.getByRole('listitem').filter({ hasText: '修改后的新纸条。' });
  await savedPaper.getByRole('button', { name: '删除', exact: true }).click();
  await savedPaper.getByRole('button', { name: '确认删除', exact: true }).click();
  await page.locator('.favorites-list').getByText('修改后的新纸条。', { exact: true }).waitFor({ state: 'hidden' });
  await publicPaper.getByText('改过字的原纸条。', { exact: true }).waitFor();
  await page.reload();
  await publicPaper.getByText('改过字的原纸条。', { exact: true }).waitFor();
  await page.getByText('管理纸条', { exact: true }).click();
  ensure(await uneditedPaper.count() === 0 && await savedPaper.count() === 0, 'Removed papers reappeared after reload');

  await page.goto('http://127.0.0.1:4179/todo/');
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await page.getByLabel('邮箱地址', { exact: true }).waitFor();
  ensure(await page.locator('.todo-items').count() === 0, 'Logout must clear rows');
  await page.screenshot({ path: 'output/playwright/todo-login-mobile.png' });
  await page.setViewportSize({ width: 320, height: 700 });
  ensure(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '320px overflow');
  await page.getByRole('button', { name: '打开导航菜单', exact: true }).click();
  await page.getByRole('button', { name: '我的', exact: true }).click();
  ensure(await page.getByRole('link', { name: 'TODO 清单', exact: true }).isVisible(), 'Mobile menu missing TODO');
  await page.goto('http://127.0.0.1:4179/');
  await page.locator('.chapter-ticket.ticket-little').getByText('改过字的原纸条。', { exact: true }).first().waitFor({ state: 'attached' });
  await page.getByRole('button', { name: '账号登录', exact: true }).click();
  await dialog.getByLabel('用户名', { exact: true }).waitFor();
  ensure(await page.evaluate(() => document.querySelector('dialog').getBoundingClientRect().right <= innerWidth), 'Mobile login dialog overflow');
  await page.screenshot({ path: 'output/playwright/home-account-mobile.png', animations: 'disabled' });
  await dialog.getByRole('button', { name: '关闭账号面板', exact: true }).click();
  await dialog.waitFor({ state: 'hidden' });
  ensure(errors.length === 0, `Page errors: ${errors.join(', ')}`);
  return { checks: 'accounts and TODO, community moderation, owner paper creation, editing and deletion, stable IDs, visitor favorites, homepage updates, mobile layouts', consolePageErrors: errors.length, note: 'Supabase HTTP responses are local fixtures; no real email or cloud account was used.' };
}
