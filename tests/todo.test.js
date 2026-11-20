import test from 'node:test';
import assert from 'node:assert/strict';
import { todoConfig } from '../src/todo/config.js';
import { createTodoController, cleanTitle } from '../src/todo/controller.js';
import { createTodoApi } from '../src/todo/api.js';
import { createAccount } from '../src/account/session.js';

const session = id => ({ user: { id, email: `${id}@example.com` } });
const row = (id = 'task-a', title = '测试待办') => ({ id, user_id: 'a', title, completed: false, created_at: '2026-11-12T00:00:00Z', updated_at: '2026-11-12T00:00:00Z' });
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
function harness(initialSession = session('a')) {
  let listener, time = 1000;
  const calls = [], scheduled = [];
  const auth = {
    onAuthStateChange(fn) { listener = fn; return { data: { subscription: { unsubscribe() { calls.push('unsubscribed'); } } } }; },
    async getSession() { return { data: { session: initialSession } }; },
    async signInWithOtp(args) { calls.push(args); return {}; },
    async verifyOtp(args) { calls.push(args); return { data: { session: session('a') } }; },
    async signOut(args) { calls.push(args); listener('SIGNED_OUT', null); return {}; },
    async updateUser(args) { calls.push(['updateUser', args]); return {}; },
    async setSession(tokens) { calls.push(['setSession', tokens]); return { data: { session: session('a') } }; },
  };
  const api = {
    async list(id) { calls.push(['list', id]); return [row()]; },
    async add(id, title) { calls.push(['add', id, title]); return row('new', title); },
    async update(id, item, patch) { calls.push(['update', id, item.id, patch]); return { ...item, ...patch, updated_at: 'new-version' }; },
    async remove(id, item) { calls.push(['remove', id, item.id]); },
  };
  const queue = fn => scheduled.push(fn);
  const accountApi = { async username() { return null; }, async setUsername(name) { calls.push(['setUsername', name]); return name; } };
  const account = createAccount({ auth, api: accountApi, now: () => time, schedule: queue });
  const controller = createTodoController({ api, schedule: queue });
  controller.setUser(initialSession?.user.id);
  return {
    controller, account, accountApi, state: controller.state, auth, api, calls,
    event(id) { listener?.('SIGNED_IN', id ? session(id) : null); controller.setUser(id ?? ''); },
    advance: ms => { time += ms; },
  };
}
async function ready(h) { await h.controller.refresh(); }

test('configuration refuses private keys, insecure origins, and missing values', () => {
  const env = { VITE_SUPABASE_URL: 'https://sample.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test' };
  assert.deepEqual(todoConfig(env), { url: env.VITE_SUPABASE_URL, key: env.VITE_SUPABASE_PUBLISHABLE_KEY });
  for (const key of ['', 'sb_secret_test', 'eyJhbGciOiJIUzI1NiJ9.service_role']) assert.equal(todoConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: key }), null);
  for (const url of ['http://sample.supabase.co', 'https://a:b@sample.supabase.co', 'https://sample.supabase.co/rest/v1', 'oops']) assert.equal(todoConfig({ ...env, VITE_SUPABASE_URL: url }), null);
  assert.equal(todoConfig(), null);
});

test('OTP registers new users, verifies email codes, preserves cooldown across address changes', async () => {
  const h = harness(null); await h.account.start();
  assert.equal(await h.account.sendCode('not-an-email'), false);
  assert.equal(h.calls.length, 0);
  assert.equal(await h.account.sendCode(' user@example.com '), true);
  assert.deepEqual(h.calls[0], { email: 'user@example.com', options: { shouldCreateUser: true } });
  h.account.changeEmail();
  assert.equal(await h.account.sendCode('second@example.com'), false);
  h.advance(60000);
  assert.equal(await h.account.sendCode('second@example.com'), true);
  assert.equal(await h.account.verifyCode('123'), false);
  assert.equal(await h.account.verifyCode('123456'), true);
  assert.deepEqual(h.calls.at(-1), { email: 'second@example.com', token: '123456', type: 'email' });
  assert.equal(h.account.state.user.id, 'a');
  assert.equal(h.account.state.pendingEmail, '');
  h.account.dispose();
});

test('failed sends never advance to code entry; failed verification preserves email', async () => {
  const h = harness(null); await h.account.start();
  h.auth.signInWithOtp = async () => ({ error: { status: 429 } });
  assert.equal(await h.account.sendCode('user@example.com'), false);
  assert.equal(h.account.state.pendingEmail, ''); assert.equal(h.account.state.resendAt, 0);
  assert.match(h.account.state.error, /太频繁/);
  h.account.state.pendingEmail = 'user@example.com';
  h.auth.verifyOtp = async () => ({ error: { code: 'otp_expired' } });
  assert.equal(await h.account.verifyCode('123456'), false);
  assert.equal(h.account.state.user, null); assert.equal(h.account.state.pendingEmail, 'user@example.com');
  assert.match(h.account.state.error, /已过期/);
  h.account.dispose();
});

test('username and password attach to the verified account and use its existing session ID', async () => {
  const h = harness();
  await h.account.start(); await h.account.loadProfile();
  assert.equal(await h.account.setupPassword('Alice_1', 'aB2!k', 'aB2!k'), false);
  assert.match(h.account.state.error, /至少需要 6 个字符/);
  assert.equal(await h.account.setupPassword('Alice_1', 'strong passphrase', 'different'), false);
  assert.equal(h.calls.length, 0);
  const password = 'aB2!k7';
  assert.equal(await h.account.setupPassword(' Alice_1 ', password, password), true);
  assert.deepEqual(h.calls.slice(-2), [['updateUser', { password }], ['setUsername', 'alice_1']]);
  assert.equal(h.account.state.user.id, 'a');
  await h.account.signOut();
  h.accountApi.passwordLogin = async (name, entered) => {
    assert.equal(name, 'alice_1'); assert.equal(entered, password);
    return { access_token: 'access', refresh_token: 'refresh' };
  };
  assert.equal(await h.account.passwordLogin('ALICE_1', password), true);
  assert.equal(h.account.state.user.id, 'a');
  assert.deepEqual(h.calls.at(-1), ['setSession', { access_token: 'access', refresh_token: 'refresh' }]);
  h.account.dispose();
});

test('username collision can be retried with the password saved in the first attempt', async () => {
  const h = harness(); await h.account.start(); await h.account.loadProfile();
  h.accountApi.setUsername = async () => { throw { code: '23505' }; };
  assert.equal(await h.account.setupPassword('taken', 'long password', 'long password'), false);
  assert.match(h.account.state.error, /已被使用/);
  h.auth.updateUser = async () => ({ error: { code: 'same_password' } });
  h.accountApi.setUsername = async name => name;
  assert.equal(await h.account.setupPassword('my_name', 'long password', 'long password'), true);
  assert.equal(h.account.state.username, 'my_name'); h.account.dispose();
});

test('CRUD persists on server before changing the view, and filters writable fields', async () => {
  const h = harness(); await ready(h);
  const pending = deferred();
  h.api.add = async () => pending.promise;
  const adding = h.controller.add('  新的事情  ');
  assert.equal(h.state.items.length, 1); assert.equal(h.state.mutating, true);
  assert.equal(await h.controller.add('重复提交'), false);
  pending.resolve(row('new', '新的事情')); assert.equal(await adding, true);
  const item = h.state.items[0];
  assert.equal(await h.controller.update(item, { completed: true, user_id: 'b', id: 'stolen' }), true);
  assert.deepEqual(h.calls.at(-1), ['update', 'a', 'new', { completed: true }]);
  assert.equal(h.state.items[0].completed, true);
  assert.equal(await h.controller.update(h.state.items[0], { title: '  改了文字  ' }), true);
  assert.equal(h.state.items[0].title, '改了文字');
  assert.equal(await h.controller.remove(h.state.items[0]), true);
  assert.equal(h.state.items.length, 1);
  h.controller.dispose();
});

test('failed writes, conflicts, and invalid titles preserve the saved list', async () => {
  const h = harness(); await ready(h);
  h.api.update = async () => { throw { code: 'TODO_CONFLICT' }; };
  assert.equal(await h.controller.update(h.state.items[0], { title: '新内容' }), false);
  assert.equal(h.state.items[0].title, '测试待办'); assert.match(h.state.mutationError, /刷新/);
  h.api.remove = async () => { throw new TypeError('Failed to fetch'); };
  assert.equal(await h.controller.remove(h.state.items[0]), false);
  assert.equal(h.state.items.length, 1); assert.match(h.state.mutationError, /网络/);
  assert.equal(await h.controller.add(' '.repeat(4)), false);
  assert.match(h.state.mutationError, /写下/);
  assert.equal(await h.controller.add('字'.repeat(501)), false);
  assert.match(h.state.mutationError, /500/);
  assert.equal(cleanTitle('😀'.repeat(500)).length, 1000);
  h.controller.dispose();
});

test('logout and account switches discard private rows and late reads/writes', async () => {
  const h = harness(); await ready(h);
  const read = deferred(); h.api.list = () => read.promise;
  const loading = h.controller.refresh();
  h.event('b'); assert.deepEqual(h.state.items, []); assert.equal(h.state.loaded, false);
  read.resolve([row('private-a')]); await loading;
  assert.deepEqual(h.state.items, []);
  h.api.list = async () => [{ ...row('private-b'), user_id: 'b' }];
  await h.controller.refresh();
  const write = deferred(); h.api.add = () => write.promise;
  const adding = h.controller.add('b 的内容');
  await h.account.start();
  assert.equal(await h.account.signOut(), true);
  h.event(null);
  assert.deepEqual(h.state.items, []); assert.equal(h.state.userId, '');
  write.resolve({ ...row('late-b'), user_id: 'b' }); await adding;
  assert.deepEqual(h.state.items, []);
  assert.equal(await h.controller.add('未登录'), false);
  h.controller.dispose(); h.account.dispose(); assert.ok(h.calls.includes('unsubscribed'));
});

test('newer refresh and auth events win over older in-flight responses', async () => {
  const h = harness(); await ready(h);
  const old = deferred(); let count = 0;
  h.api.list = () => ++count === 1 ? old.promise : Promise.resolve([row('latest')]);
  const first = h.controller.refresh(); await h.controller.refresh();
  old.resolve([row('old')]); await first;
  assert.equal(h.state.items[0].id, 'latest');
  h.controller.dispose();
  const init = harness(null), restoring = deferred(); init.auth.getSession = () => restoring.promise;
  const start = init.account.start(); init.event('b'); restoring.resolve({ data: { session: session('a') } });
  await start; assert.equal(init.account.state.user.id, 'b'); init.account.dispose();
});

test('failed initial load blocks edits, can retry, and dispose rejects late data', async () => {
  const h = harness();
  h.api.list = async () => { throw new TypeError('fetch failed'); };
  await h.controller.refresh(); assert.equal(h.state.loaded, false);
  assert.equal(await h.controller.add('还没加载'), false); assert.match(h.state.loadError, /网络/);
  h.api.list = async () => [row()]; await h.controller.refresh(); assert.equal(h.state.loaded, true);
  const pending = deferred(); h.api.list = () => pending.promise;
  const read = h.controller.refresh(); h.controller.dispose(); pending.resolve([row()]); await read;
  assert.deepEqual(h.state.items, []); assert.equal(h.state.userId, '');
});

test('API pages beyond the default row limit and uses owner/version filters on writes', async () => {
  const queries = [];
  let result;
  const client = { from(table) {
    const calls = [['from', table]]; queries.push(calls);
    const builder = { then(resolve) { return Promise.resolve(result).then(resolve); } };
    for (const name of ['select', 'eq', 'order', 'range', 'insert', 'update', 'delete', 'single', 'maybeSingle']) builder[name] = (...args) => {
      calls.push([name, ...args]);
      if (name === 'range') result = { data: args[0] === 0 ? Array.from({ length: 200 }, (_, i) => row(`task-${i}`)) : [row('last')] };
      return builder;
    };
    return builder;
  } };
  const api = createTodoApi(client);
  assert.equal((await api.list('a')).length, 201);
  assert.ok(queries.every(calls => calls.some(call => call[0] === 'eq' && call[1] === 'user_id' && call[2] === 'a')));
  result = { data: row() }; await api.update('a', row(), { title: '改名' });
  assert.ok(queries.at(-1).some(call => call[0] === 'eq' && call[1] === 'updated_at' && call[2] === row().updated_at));
  result = { data: null }; await assert.rejects(api.remove('a', row()), error => error.code === 'TODO_CONFLICT');
});
