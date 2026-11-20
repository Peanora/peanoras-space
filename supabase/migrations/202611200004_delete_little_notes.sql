begin;

alter table site_private.little_notes
  add column deleted boolean not null default false,
  alter column text drop not null,
  add constraint little_note_deleted_text check (deleted = (text is null));

create function public.list_little_notes(include_deleted boolean) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(
    case when n.deleted then jsonb_build_object('id', n.id, 'deleted', true)
      else to_jsonb(n) - 'deleted' end
    order by n.created_at desc, n.id
  ), '[]'::jsonb)
  from site_private.little_notes n
  where not n.deleted or include_deleted;
$$;

create or replace function public.list_little_notes() returns jsonb
language sql stable security definer set search_path = '' as $$
  select public.list_little_notes(false);
$$;

create or replace function public.save_little_note(
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
      where n.id = note_id and n.revision = expected_revision and not n.deleted returning * into saved;
  end if;
  if not found then raise exception 'little_note_conflict' using errcode = '40001'; end if;
  return to_jsonb(saved) - 'deleted';
end;
$$;

create function public.delete_little_note(note_id text, expected_revision uuid default null)
returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.site_is_owner() then
    raise exception 'site_owner_required' using errcode = '42501';
  end if;

  if expected_revision is null then
    insert into site_private.little_notes(id, source, rare, deleted)
      values (note_id, '', false, true)
      on conflict (id) do nothing;
  else
    update site_private.little_notes n
      set text = null, source = '', rare = false, deleted = true, revision = gen_random_uuid()
      where n.id = note_id and n.revision = expected_revision and not n.deleted;
  end if;
  if not found and not exists (select 1 from site_private.little_notes where id = note_id and deleted) then
    raise exception 'little_note_conflict' using errcode = '40001';
  end if;
  return true;
end;
$$;

revoke all on function public.list_little_notes(boolean), public.delete_little_note(text,uuid) from public, anon, authenticated;
grant execute on function public.list_little_notes(boolean) to anon, authenticated;
grant execute on function public.delete_little_note(text,uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
