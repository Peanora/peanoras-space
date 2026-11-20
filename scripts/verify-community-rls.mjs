import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const { PGlite } = await import('../output/playwright/rls-runtime/node_modules/@electric-sql/pglite/dist/index.js');
const db = new PGlite();
const alice = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const bob = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const unverified = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
let checks = 0;

async function as(role, user, scenario) {
  await db.exec(`set role ${role}`);
  await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(user ? { sub: user } : {})]);
  try { await scenario(); checks++; } finally { await db.exec('reset role'); }
}
const query = (sql, params) => db.query(sql, params).then(result => result.rows);
const denied = statement => assert.rejects(statement, error => error.code === '42501');

try {
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, encrypted_password text);
    create function auth.uid() returns uuid language sql stable as
      $$ select (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
  `);
  await db.query("insert into auth.users values ($1, 'alice@test.invalid', now(), ''), ($2, 'bob@test.invalid', now(), 'fixture'), ($3, 'unverified@test.invalid', null, 'fixture')", [alice, bob, unverified]);
  const migration = await readFile(new URL('../supabase/migrations/202611200001_site_accounts_and_community.sql', import.meta.url), 'utf8');
  await db.exec(migration);

  await as('authenticated', alice, async () => { await denied(db.query("select public.set_site_username('alice_1')")); });
  await db.query("update auth.users set encrypted_password = 'fixture' where id = $1", [alice]);
  await as('authenticated', alice, async () => {
    assert.deepEqual(await query("select public.set_site_username(' Alice_1 ') as name"), [{ name: 'alice_1' }]);
    assert.deepEqual(await query('select public.get_site_username() as name'), [{ name: 'alice_1' }]);
    await assert.rejects(db.query("select public.set_site_username('different')"), error => error.code === '22023');
    await denied(db.query("select * from public.lookup_site_login('alice_1')"));
    await denied(db.query('select * from site_private.usernames'));
  });
  await as('authenticated', bob, async () => {
    assert.deepEqual(await query('select public.get_site_username() as name'), [{ name: null }]);
    await assert.rejects(db.query("select public.set_site_username('ALICE_1')"), error => error.code === '23505');
  });
  await as('service_role', null, async () => {
    for (let i = 0; i < 6; i++) assert.deepEqual(await query("select * from public.lookup_site_login('alice_1')"), [{ allowed: true, account_email: 'alice@test.invalid' }]);
    assert.deepEqual(await query("select * from public.lookup_site_login('alice_1')"), [{ allowed: false, account_email: null }]);
    assert.deepEqual(await query("select * from public.lookup_site_login('unknown_name')"), [{ allowed: true, account_email: null }]);
  });

  await as('anon', null, async () => {
    await denied(db.query('select * from public.community_entries'));
    await denied(db.query("select public.submit_site_entry('message','test','test')"));
    await denied(db.query("select * from public.my_site_entries('message')"));
    await denied(db.query('select public.get_site_username()'));
    assert.deepEqual(await query("select * from public.list_site_entries('message')"), []);
  });
  await as('authenticated', unverified, async () => { await denied(db.query("select public.submit_site_entry('message','test','test')")); });

  let messageId, friendId;
  await as('authenticated', alice, async () => {
    await assert.rejects(db.query("select public.submit_site_entry('friend','Bad','Bad','javascript:alert(1)')"), error => error.code === '23514');
    await assert.rejects(db.query("select public.submit_site_entry('message','test', $1)", ['\t\n ']), error => error.code === '23514');
    [{ id: messageId }] = await query("select public.submit_site_entry('message','A 客人','你好') as id");
    [{ id: friendId }] = await query("select public.submit_site_entry('friend','A 小站','介绍','https://example.com/') as id");
    await query("select public.submit_site_entry('message','A 客人','另一条')");
    assert.equal((await query("select * from public.my_site_entries('message')")).length, 2);
    assert.deepEqual(await query("select * from public.list_site_entries('message')"), []);
    await denied(db.query("update public.community_entries set status = 'published'"));
    await assert.rejects(db.query("select public.submit_site_entry('message','A 客人','太频繁')"), /site_submit_rate_limit/);
  });
  await as('authenticated', bob, async () => {
    assert.deepEqual(await query("select * from public.my_site_entries('message')"), []);
    assert.deepEqual(await query('select public.withdraw_site_entry($1) as withdrawn', [messageId]), [{ withdrawn: false }]);
  });
  await db.query("update public.community_entries set status = 'published' where id in ($1,$2)", [messageId, friendId]);
  await as('anon', null, async () => {
    const [message] = await query("select * from public.list_site_entries('message')");
    assert.deepEqual(Object.keys(message), ['id', 'display_name', 'body', 'url', 'created_at']);
    assert.equal(message.body, '你好');
    assert.equal((await query("select * from public.list_site_entries('friend')"))[0].url, 'https://example.com/');
  });
  await as('authenticated', alice, async () => {
    assert.deepEqual(await query('select public.withdraw_site_entry($1) as withdrawn', [messageId]), [{ withdrawn: true }]);
    assert.deepEqual(await query("select * from public.list_site_entries('message')"), []);
    await assert.rejects(db.query("select public.submit_site_entry('message','A 客人','撤回后同样限流')"), /site_submit_rate_limit/);
  });
  console.log(JSON.stringify({ result: 'passed', checks, engine: 'local PostgreSQL (PGlite)', cloud: false }));
} finally { await db.close(); }
