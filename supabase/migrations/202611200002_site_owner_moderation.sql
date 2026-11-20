begin;

create table site_private.owner (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null references auth.users(id) on delete cascade
);
revoke all on site_private.owner from public, anon, authenticated;

create function public.site_is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from site_private.owner o
    join auth.users u on u.id = o.user_id
    where o.user_id = (select auth.uid()) and u.email_confirmed_at is not null
  );
$$;

create function public.site_moderation_queue(
  entry_kind text, entry_status text, before_time timestamptz default null, before_id uuid default null
) returns table(id uuid, display_name text, body text, url text, status text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.site_is_owner() then
    raise exception 'site_owner_required' using errcode = '42501';
  end if;
  return query select e.id, e.display_name, e.body, e.url, e.status, e.created_at
    from public.community_entries e
    where e.kind = entry_kind and e.status = entry_status
      and e.status in ('pending', 'published', 'rejected')
      and (before_time is null or (e.created_at, e.id) < (before_time, before_id))
    order by e.created_at desc, e.id desc limit 21;
end;
$$;

create function public.review_site_entry(entry_kind text, entry_id uuid, expected_status text, next_status text)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.site_is_owner() then
    raise exception 'site_owner_required' using errcode = '42501';
  end if;
  if not coalesce(
    (expected_status in ('pending', 'rejected') and next_status = 'published')
    or (expected_status in ('pending', 'published') and next_status = 'rejected'), false
  ) then
    raise exception 'site_invalid_review' using errcode = '22023';
  end if;

  update public.community_entries e set status = next_status
    where e.id = entry_id and e.kind = entry_kind and e.status = expected_status;
  return found;
end;
$$;

revoke all on function public.site_is_owner(), public.site_moderation_queue(text, text, timestamptz, uuid),
  public.review_site_entry(text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.site_is_owner(), public.site_moderation_queue(text, text, timestamptz, uuid),
  public.review_site_entry(text, uuid, text, text) to authenticated;

commit;
