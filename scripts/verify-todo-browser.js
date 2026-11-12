async (page) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const ensure = (value, message) => { if (!value) throw new Error(message); };
  const fixture = 'https://todo-fixture.supabase.co';
  let activeEmail = 'browser-a@example.com', failWrite = false, failSend = false;
  let rows = [], version = 0, providerRequests = 0;
  const user = () => ({ id: activeEmail.includes('-b@') ? 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' : 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: activeEmail, aud: 'authenticated', role: 'authenticated', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {}, created_at: '2026-11-12T00:00:00Z' });
  const authSession = () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const part = value => Buffer.from(JSON.stringify(value)).toString('base64url');
    return { access_token: `${part({ alg: 'HS256', typ: 'JWT' })}.${part({ sub: user().id, exp, aud: 'authenticated', role: 'authenticated' })}.fixture`, refresh_token: 'browser-fixture-refresh', expires_in: 3600, expires_at: exp, token_type: 'bearer', user: user() };
  };
  await page.unroute(`${fixture}/**`);
  await page.route(`${fixture}/**`, async route => {
    providerRequests++;
    const request = route.request(), url = new URL(request.url());
    const method = request.method();
    const body = request.postDataJSON();
    const respond = (json, status = 200) => route.fulfill({ status, headers: { 'x-supabase-api-version': '2024-01-01' }, contentType: 'application/json', body: JSON.stringify(json) });
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
    if (url.pathname.endsWith('/user')) return respond(user());
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
  await page.getByRole('button', { name: '退出登录', exact: true }).click();
  await page.getByLabel('邮箱地址', { exact: true }).waitFor();
  ensure(await page.locator('.todo-items').count() === 0, 'Logout must clear rows');
  await page.screenshot({ path: 'output/playwright/todo-login-mobile.png' });
  await page.setViewportSize({ width: 320, height: 700 });
  ensure(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '320px overflow');
  await page.getByRole('button', { name: '打开导航菜单', exact: true }).click();
  await page.getByRole('button', { name: '我的', exact: true }).click();
  ensure(await page.getByRole('link', { name: 'TODO 清单', exact: true }).isVisible(), 'Mobile menu missing TODO');
  ensure(errors.length === 0, `Page errors: ${errors.join(', ')}`);
  return { checks: 'unconfigured, navigation, send failure, invalid OTP, login, CRUD, failed save, filters, reload, logout, mobile menu, 390px/320px overflow', consolePageErrors: errors.length, note: 'Supabase HTTP responses are local fixtures; no real email or cloud account was used.' };
}
