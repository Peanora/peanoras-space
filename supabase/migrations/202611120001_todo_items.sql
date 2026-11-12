-- Run once in the Supabase SQL Editor before enabling the public TODO page.
begin;

create table public.todo_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 500),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index todo_items_owner_created_idx on public.todo_items (user_id, created_at desc, id desc);

create function public.touch_todo_item() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- An update can never transfer a task to a different account.
  new.id := old.id;
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
create trigger todo_items_updated before update on public.todo_items
  for each row execute function public.touch_todo_item();

alter table public.todo_items enable row level security;
alter table public.todo_items force row level security;
revoke all on public.todo_items from anon, authenticated;
grant select, delete on public.todo_items to authenticated;
grant insert (user_id, title, completed) on public.todo_items to authenticated;
grant update (title, completed) on public.todo_items to authenticated;

create policy "Read own todos" on public.todo_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Create own todos" on public.todo_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Update own todos" on public.todo_items for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own todos" on public.todo_items for delete to authenticated
  using ((select auth.uid()) = user_id);

commit;
