begin;

create table site_private.little_notes (
  id text primary key check (id ~ '^[a-zA-Z0-9_-]{1,120}$'),
  text text not null check (char_length(text) <= 600 and text ~ '[^[:space:]]'),
  source text not null check (char_length(source) <= 80),
  rare boolean not null,
  revision uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);
revoke all on site_private.little_notes from public, anon, authenticated;

create function public.list_little_notes() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at desc, n.id), '[]'::jsonb)
    from site_private.little_notes n;
$$;

create function public.save_little_note(
  note_id text, note_text text, note_source text, note_rare boolean, expected_revision uuid default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare saved site_private.little_notes;
begin
  if not public.site_is_owner() then
    raise exception 'site_owner_required' using errcode = '42501';
  end if;
  if expected_revision is null then
    insert into site_private.little_notes(id, text, source, rare)
      values (note_id, btrim(note_text), btrim(note_source), note_rare)
      on conflict (id) do nothing returning * into saved;
  else
    update site_private.little_notes n set
      text = btrim(note_text), source = btrim(note_source), rare = note_rare, revision = gen_random_uuid()
      where n.id = note_id and n.revision = expected_revision returning * into saved;
  end if;
  if not found then raise exception 'little_note_conflict' using errcode = '40001'; end if;
  return to_jsonb(saved);
end;
$$;

revoke all on function public.list_little_notes(), public.save_little_note(text,text,text,boolean,uuid) from public, anon, authenticated;
grant execute on function public.list_little_notes() to anon, authenticated;
grant execute on function public.save_little_note(text,text,text,boolean,uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
