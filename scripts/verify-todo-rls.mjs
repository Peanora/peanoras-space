import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Optional verification runtime, installed outside production dependencies.
const { PGlite } = await import('../output/playwright/rls-runtime/node_modules/@electric-sql/pglite/dist/index.js');

const db = new PGlite();
const a = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const b = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
let checks = 0;
try {
  // Emulate only Supabase's auth schema and JWT uid helper; execute the actual
  // application migration unchanged against a local PostgreSQL engine.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid $$;
    grant usage on schema public, auth to anon, authenticated;
  `);
  await db.query('insert into auth.users values ($1), ($2)', [a, b]);
  await db.exec(await readFile(new URL('../supabase/migrations/202611120001_todo_items.sql', import.meta.url), 'utf8'));
  const { rows: [item] } = await db.query("insert into public.todo_items (user_id,title) values ($1,'A private task') returning *", [a]);
  await db.query("insert into public.todo_items (user_id,title) values ($1,'B private task')", [b]);

  async function as(role, uid, fn) {
    await db.exec(`begin; set local role ${role};`);
    await db.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify(uid ? { sub: uid, role } : { role })]);
    try { await fn(); checks++; } finally { await db.exec('rollback'); }
  }
  await as('authenticated', a, async () => {
    const result = await db.query('select * from public.todo_items');
    assert.equal(result.rows.length, 1); assert.equal(result.rows[0].user_id, a);
  });
  await as('authenticated', b, async () => {
    assert.equal((await db.query('select * from public.todo_items where id=$1', [item.id])).rows.length, 0);
    assert.equal((await db.query("update public.todo_items set title='stolen' where id=$1 returning id", [item.id])).rows.length, 0);
    assert.equal((await db.query('delete from public.todo_items where id=$1 returning id', [item.id])).rows.length, 0);
  });
  await as('authenticated', b, async () => {
    await assert.rejects(db.query("insert into public.todo_items (user_id,title) values ($1,'forged')", [a]), e => e.code === '42501');
  });
  await as('authenticated', a, async () => {
    const inserted = await db.query("insert into public.todo_items (title) values ('own new task') returning *");
    assert.equal(inserted.rows[0].user_id, a);
    const changed = await db.query("update public.todo_items set title='edited',completed=true where id=$1 returning *", [item.id]);
    assert.equal(changed.rows[0].completed, true);
    assert.equal(changed.rows[0].title, 'edited');
    assert.notEqual(changed.rows[0].updated_at.getTime(), item.updated_at.getTime());
    assert.equal(changed.rows[0].created_at.getTime(), item.created_at.getTime());
    assert.equal((await db.query('delete from public.todo_items where id=$1 returning id', [item.id])).rows.length, 1);
  });
  for (const statement of [
    `update public.todo_items set user_id='${b}' where id='${item.id}'`,
    `update public.todo_items set id=gen_random_uuid() where id='${item.id}'`,
    `update public.todo_items set created_at=now() where id='${item.id}'`,
    `update public.todo_items set updated_at=now() where id='${item.id}'`,
  ]) await as('authenticated', a, async () => { await assert.rejects(db.exec(statement), e => e.code === '42501'); });
  for (const statement of [
    'select * from public.todo_items',
    `insert into public.todo_items (user_id,title) values ('${a}','anon forged')`,
    "update public.todo_items set title='anon'",
    'delete from public.todo_items',
  ]) await as('anon', null, async () => { await assert.rejects(db.exec(statement), e => e.code === '42501'); });
  await as('authenticated', null, async () => { assert.equal((await db.query('select * from public.todo_items')).rows.length, 0); });
  for (const title of ['', ' '.repeat(3), '字'.repeat(501)]) await as('authenticated', a, async () => {
    await assert.rejects(db.query('insert into public.todo_items(title) values ($1)', [title]), e => e.code === '23514');
  });
  console.log(JSON.stringify({ postgresEngine: 'PGlite (local)', checks, result: 'passed', cloudProjectTested: false }));
} finally { await db.close(); }
