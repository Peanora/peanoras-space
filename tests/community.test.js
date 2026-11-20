import test from 'node:test';
import assert from 'node:assert/strict';
import { createUsernameLogin } from '../supabase/functions/username-login/handler.mjs';
import { communityUrl, createCommunityApi } from '../src/community/api.js';

function request(body, origin = 'https://peanora.cn') {
  return new Request('https://test.supabase.co/functions/v1/username-login', { method: 'POST', headers: { origin }, body: JSON.stringify(body) });
}
function handler(responses) {
  const calls = [];
  const handle = createUsernameLogin({ url: 'https://test.supabase.co', publicKey: 'sb_publishable_test', adminKey: 'sb_secret_test', fetcher: async (url, options) => {
    calls.push({ url, headers: options.headers, body: JSON.parse(options.body) });
    return responses.shift();
  } });
  return { handle, calls };
}

test('password gateway uses the email only server-side and returns session tokens', async () => {
  const h = handler([
    Response.json([{ allowed: true, account_email: 'original@example.com' }]),
    Response.json({ access_token: 'access', refresh_token: 'refresh', user: { email: 'original@example.com' }, extra: 'ignored' }),
  ]);
  const result = await h.handle(request({ username: ' Alice_01 ', password: 'a valid password' }));
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal(result.headers.get('access-control-allow-origin'), 'https://peanora.cn');
  assert.deepEqual(await result.json(), { access_token: 'access', refresh_token: 'refresh' });
  assert.deepEqual(h.calls[0].body, { requested: 'alice_01' });
  assert.equal(h.calls[0].headers.apikey, 'sb_secret_test');
  assert.equal(h.calls[1].headers.apikey, 'sb_publishable_test');
  assert.deepEqual(h.calls[1].body, { email: 'original@example.com', password: 'a valid password' });
});

test('wrong passwords and missing usernames return the same error, and limited attempts skip auth', async () => {
  for (const email of ['known@example.com', null]) {
    const h = handler([Response.json([{ allowed: true, account_email: email }]), Response.json({ reason: 'never expose details' }, { status: 400 })]);
    const result = await h.handle(request({ username: 'a_user', password: 'wrong' }));
    assert.equal(result.status, 401);
    assert.deepEqual(await result.json(), { code: 'invalid_login' });
    assert.equal(h.calls.length, 2);
  }
  const limited = handler([Response.json([{ allowed: false, account_email: null }])]);
  assert.equal((await limited.handle(request({ username: 'a_user', password: 'wrong' }))).status, 429);
  assert.equal(limited.calls.length, 1);
});

test('password endpoint rejects foreign origins and oversized bodies before accessing data', async () => {
  const h = handler([]);
  assert.equal((await h.handle(request({ username: 'alice', password: 'pass' }, 'https://elsewhere.example'))).status, 403);
  assert.equal((await h.handle(request({ username: 'alice', password: 'x'.repeat(5000) }))).status, 400);
  assert.equal(h.calls.length, 0);
});

test('friend links allow ordinary web URLs and reject credentials or unsafe schemes', () => {
  assert.equal(communityUrl(' https://example.com/friends '), 'https://example.com/friends');
  for (const invalid of ['javascript:alert(1)', 'data:text/html,test', '//example.com', 'https:example.com', 'https://a:b@example.com', 'https://example.com\\path']) assert.equal(communityUrl(invalid), '');
});

test('public submission previews use a stable cursor, and client submission cannot set review status', async () => {
  const calls = [];
  const rows = Array.from({ length: 21 }, (_, i) => ({ id: String(i), created_at: '2026-11-20T00:00:00Z' }));
  const api = createCommunityApi({ async rpc(name, args) { calls.push([name, args]); return { data: name === 'list_site_entries' ? rows : 'entry-id' }; } });
  const page = await api.list('friend');
  assert.equal(page.more, true); assert.equal(page.items.length, 20);
  await api.list('friend', page.items.at(-1));
  assert.deepEqual(calls[1], ['list_site_entries', { entry_kind: 'friend', before_time: '2026-11-20T00:00:00Z', before_id: '19' }]);
  await api.submit('friend', '标题', '内容', 'https://example.com/');
  assert.deepEqual(calls.at(-1), ['submit_site_entry', { entry_kind: 'friend', entry_name: '标题', entry_body: '内容', entry_url: 'https://example.com/' }]);
});
