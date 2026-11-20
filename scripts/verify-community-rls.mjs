import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const { PGlite } = await import('../output/playwright/rls-runtime/node_modules/@electric-sql/pglite/dist/index.js');
const db = new PGlite();
const alice = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const bob = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const unverified = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const owner = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
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
  const moderation = await readFile(new URL('../supabase/migrations/202611200002_site_owner_moderation.sql', import.meta.url), 'utf8');
  await db.exec(moderation);
  const littleNotes = await readFile(new URL('../supabase/migrations/202611200003_little_notes.sql', import.meta.url), 'utf8');
  await db.exec(littleNotes);
  await db.query("insert into auth.users values ($1, 'owner@test.invalid', now(), '')", [owner]);
  await db.query('insert into site_private.owner(user_id) values ($1)', [owner]);

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
    await denied(db.query('select public.site_is_owner()'));
    await denied(db.query("select * from public.site_moderation_queue('message','pending')"));
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
    assert.deepEqual(await query('select public.site_is_owner() as owner'), [{ owner: false }]);
    await denied(db.query("select * from public.site_moderation_queue('message','pending')"));
    await denied(db.query("select public.review_site_entry('message',$1,'pending','published')", [messageId]));
    await denied(db.query('select * from site_private.owner'));
  });
  await as('authenticated', owner, async () => {
    assert.deepEqual(await query('select public.site_is_owner() as owner'), [{ owner: true }]);
    const pending = await query("select id, display_name, body, url, status, created_at::text from public.site_moderation_queue('message','pending')");
    assert.equal(pending.length, 2);
    assert.deepEqual(Object.keys(pending[0]), ['id', 'display_name', 'body', 'url', 'status', 'created_at']);
    const entriesAfterFirst = await query(
      "select * from public.site_moderation_queue('message','pending', $1, $2)", [pending[0].created_at, pending[0].id],
    );
    assert.deepEqual(entriesAfterFirst.map(entry => entry.id), [pending[1].id]);
    await denied(db.query("update public.community_entries set status = 'published'"));
    await assert.rejects(db.query("select public.review_site_entry('message',$1,'pending','withdrawn')", [messageId]), { code: '22023' });
    assert.deepEqual(await query("select public.review_site_entry('friend',$1,'pending','published') as result", [messageId]), [{ result: false }]);
    assert.deepEqual(await query("select public.review_site_entry('message',$1,'pending','published') as result", [messageId]), [{ result: true }]);
    assert.deepEqual(await query("select public.review_site_entry('friend',$1,'pending','rejected') as result", [friendId]), [{ result: true }]);
    assert.deepEqual(await query("select * from public.list_site_entries('friend')"), []);
    assert.deepEqual(await query("select public.review_site_entry('friend',$1,'pending','published') as result", [friendId]), [{ result: false }]);
    assert.deepEqual(await query("select public.review_site_entry('friend',$1,'rejected','published') as result", [friendId]), [{ result: true }]);
  });
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
  await as('authenticated', owner, async () => {
    assert.deepEqual(await query("select public.review_site_entry('message',$1,'published','rejected') as result", [messageId]), [{ result: false }]);
    assert.deepEqual(await query("select * from public.site_moderation_queue('message','withdrawn')"), []);
  });
  const saveNote = (id, text, source, rare, revision = null) => query(
    'select public.save_little_note($1,$2,$3,$4,$5) as note', [id, text, source, rare, revision],
  ).then(([{ note }]) => note);
  await as('anon', null, async () => {
    assert.deepEqual(await query('select public.list_little_notes() as notes'), [{ notes: [] }]);
    await denied(saveNote('little-01', 'Unauthorised change', '', false));
    await denied(db.query('select * from site_private.little_notes'));
  });
  await as('authenticated', alice, async () => {
    await denied(saveNote('little-01', 'Unauthorised change', '', false));
    await denied(db.query('update site_private.little_notes set rare = true'));
  });
  await as('authenticated', owner, async () => {
    const original = await saveNote('little-01', ' 初版 ', '', false);
    assert.equal(original.id, 'little-01');
    assert.equal(original.text, '初版');
    await assert.rejects(saveNote(original.id, 'Duplicate', '', false), { code: '40001' });
    const updated = await saveNote(original.id, '修改后的纸条', '来源', true, original.revision);
    assert.equal(updated.id, original.id);
    assert.equal(updated.created_at, original.created_at);
    assert.equal(updated.rare, true);
    assert.notEqual(updated.revision, original.revision);
    await assert.rejects(saveNote(original.id, 'Old edit', '', false, original.revision), { code: '40001' });
    await assert.rejects(saveNote('blank', '\t\n', '', false), { code: '23514' });
    await assert.rejects(saveNote('long', '字'.repeat(601), '', false), { code: '23514' });
  });
  await as('anon', null, async () => {
    const [{ notes }] = await query('select public.list_little_notes() as notes');
    assert.equal(notes.length, 1);
    assert.equal(notes[0].text, '修改后的纸条');
    assert.equal(notes[0].id, 'little-01');
    assert.deepEqual(Object.keys(notes[0]).sort(), ['id', 'text', 'source', 'rare', 'revision', 'created_at'].sort());
  });

  const noteDeletion = await readFile(new URL('../supabase/migrations/202611200004_delete_little_notes.sql', import.meta.url), 'utf8');
  await db.exec(noteDeletion);
  const deleteNote = (id, revision = null) => query(
    'select public.delete_little_note($1,$2) as deleted', [id, revision],
  ).then(([{ deleted }]) => deleted);
  await as('anon', null, async () => {
    await denied(deleteNote('little-02'));
  });
  await as('authenticated', alice, async () => {
    await denied(deleteNote('little-02'));
    await denied(db.query('update site_private.little_notes set deleted = true'));
  });
  await as('authenticated', owner, async () => {
    const [{ notes }] = await query('select public.list_little_notes() as notes');
    const existing = notes.find(note => note.id === 'little-01');
    assert.equal(existing.text, '修改后的纸条');
    await assert.rejects(deleteNote(existing.id), { code: '40001' });
    assert.equal(await deleteNote(existing.id, existing.revision), true);
    assert.equal(await deleteNote(existing.id, existing.revision), true);
    await assert.rejects(saveNote(existing.id, 'Stale edit', '', false, existing.revision), { code: '40001' });
    assert.equal(await deleteNote('little-02'), true);
    await assert.rejects(saveNote('little-02', 'Stale original', '', false), { code: '40001' });
    const added = await saveNote('note-3', 'Third note', '', false);
    const edited = await saveNote(added.id, 'Updated third note', '', false, added.revision);
    await assert.rejects(deleteNote(added.id, added.revision), { code: '40001' });
    assert.equal(await deleteNote(edited.id, edited.revision), true);
    await saveNote('note-4', 'Visible', '', false);
  });
  await as('anon', null, async () => {
    const [{ notes: visible }] = await query('select public.list_little_notes() as notes');
    assert.deepEqual(visible.map(note => note.id), ['note-4']);
    const [{ notes: withRemoved }] = await query('select public.list_little_notes(true) as notes');
    assert.deepEqual(withRemoved.filter(note => note.deleted).sort((a, b) => a.id.localeCompare(b.id)), [
      { id: 'little-01', deleted: true }, { id: 'little-02', deleted: true }, { id: 'note-3', deleted: true },
    ]);
  });
  console.log(JSON.stringify({ result: 'passed', checks, engine: 'local PostgreSQL (PGlite)', cloud: false }));
} finally { await db.close(); }
