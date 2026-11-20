begin;

create schema site_private;
revoke all on schema site_private from public, anon, authenticated;

create table site_private.usernames (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-z0-9_]{3,24}$')
);

create table site_private.login_limits (
  bucket integer primary key check (bucket between 0 and 16383),
  window_start timestamptz not null,
  attempts integer not null
);

create function public.get_site_username() returns text
language sql stable security definer set search_path = '' as $$
  select username from site_private.usernames where user_id = (select auth.uid());
$$;

create function public.set_site_username(requested text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  account_id uuid := auth.uid();
  normalized text := lower(btrim(requested));
  saved text;
begin
  if account_id is null or not exists (
    select 1 from auth.users where id = account_id and email_confirmed_at is not null and encrypted_password <> ''
  ) then raise exception 'site_password_required' using errcode = '42501'; end if;
  if normalized is null or normalized !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'site_invalid_username' using errcode = '22023';
  end if;

  insert into site_private.usernames(user_id, username) values (account_id, normalized)
    on conflict (user_id) do nothing;
  select username into saved from site_private.usernames where user_id = account_id;
  if saved <> normalized then raise exception 'site_username_already_set' using errcode = '22023'; end if;
  return saved;
end;
$$;

-- This function is called only by the trusted password-login Edge Function.
-- Fixed buckets limit attempts without accumulating rows for made-up usernames.
create function public.lookup_site_login(requested text)
returns table(allowed boolean, account_email text)
language plpgsql security definer set search_path = '' as $$
declare
  now_at timestamptz := clock_timestamp();
  bucket_id integer := hashtext(requested) & 16383;
  used integer;
begin
  if requested is null or requested !~ '^[a-z0-9_]{3,24}$' then return; end if;
  insert into site_private.login_limits as limits(bucket, window_start, attempts) values (bucket_id, now_at, 1)
    on conflict (bucket) do update set
      window_start = case when limits.window_start <= now_at - interval '5 minutes' then now_at else limits.window_start end,
      attempts = case when limits.window_start <= now_at - interval '5 minutes' then 1 else least(limits.attempts + 1, 7) end
    returning attempts into used;
  return query select used <= 6, case when used <= 6 then (
    select u.email::text from site_private.usernames n join auth.users u on u.id = n.user_id
    where n.username = requested and u.email_confirmed_at is not null
  ) else null end;
end;
$$;

create table public.community_entries (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('friend', 'message')),
  display_name text not null check (char_length(display_name) <= 40 and display_name ~ '[^[:space:]]'),
  body text not null check (char_length(body) <= 600 and body ~ '[^[:space:]]'),
  url text check (char_length(url) <= 500 and url ~* '^https?://[^[:space:]/@?#]+([/?#][^[:space:]]*)?$'),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now(),
  check ((kind = 'friend') = (url is not null))
);
alter table public.community_entries enable row level security;
revoke all on public.community_entries from public, anon, authenticated;
create index community_public_idx on public.community_entries (kind, created_at desc, id desc) where status = 'published';
create index community_author_idx on public.community_entries (author_id, created_at desc);

create function public.list_site_entries(entry_kind text, before_time timestamptz default null, before_id uuid default null)
returns table(id uuid, display_name text, body text, url text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select e.id, e.display_name, e.body, e.url, e.created_at from public.community_entries e
  where e.kind = entry_kind and e.status = 'published'
    and (before_time is null or (e.created_at, e.id) < (before_time, before_id))
  order by e.created_at desc, e.id desc limit 21;
$$;

create function public.my_site_entries(entry_kind text)
returns table(id uuid, display_name text, body text, url text, status text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select e.id, e.display_name, e.body, e.url, e.status, e.created_at from public.community_entries e
  where e.kind = entry_kind and e.author_id = (select auth.uid()) and e.status <> 'withdrawn'
  order by e.created_at desc, e.id desc limit 20;
$$;

create function public.submit_site_entry(entry_kind text, entry_name text, entry_body text, entry_url text default null)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  account_id uuid := auth.uid();
  saved_id uuid;
begin
  if account_id is null or not exists (select 1 from auth.users where id = account_id and email_confirmed_at is not null) then
    raise exception 'site_login_required' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(account_id::text, 0));
  if (select count(*) from public.community_entries where author_id = account_id and created_at >= now() - interval '10 minutes') >= 3 then
    raise exception 'site_submit_rate_limit' using errcode = 'P0001';
  end if;
  insert into public.community_entries(author_id, kind, display_name, body, url)
    values (account_id, entry_kind, btrim(entry_name), btrim(entry_body), nullif(btrim(entry_url), '')) returning id into saved_id;
  return saved_id;
end;
$$;

create function public.withdraw_site_entry(entry_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.community_entries set status = 'withdrawn'
    where id = entry_id and author_id = (select auth.uid()) and status <> 'withdrawn';
  return found;
end;
$$;

revoke all on function public.get_site_username(), public.set_site_username(text), public.lookup_site_login(text),
  public.list_site_entries(text, timestamptz, uuid), public.my_site_entries(text),
  public.submit_site_entry(text,text,text,text), public.withdraw_site_entry(uuid) from public, anon, authenticated;
grant execute on function public.lookup_site_login(text) to service_role;
grant execute on function public.list_site_entries(text, timestamptz, uuid) to anon, authenticated;
grant execute on function public.get_site_username(), public.set_site_username(text), public.my_site_entries(text),
  public.submit_site_entry(text,text,text,text), public.withdraw_site_entry(uuid) to authenticated;

commit;
