const pageSize = 20;

export function communityUrl(value) {
  const input = String(value ?? '').trim();
  if (input.length > 500 || !/^https?:\/\/[^/]/i.test(input) || /[\s\\]/u.test(input)) return '';
  try {
    const url = new URL(input);
    return url.hostname && !url.username && !url.password && url.href.length <= 500 ? url.href : '';
  } catch { return ''; }
}

export function createCommunityApi(client) {
  async function rpc(name, args) {
    const { data, error } = await client.rpc(name, args);
    if (error) throw error;
    return data;
  }
  return {
    async list(kind, before) {
      const args = { entry_kind: kind };
      if (before) Object.assign(args, { before_time: before.created_at, before_id: before.id });
      const items = await rpc('list_site_entries', args);
      return { items: items.slice(0, pageSize), more: items.length > pageSize };
    },
    mine: kind => rpc('my_site_entries', { entry_kind: kind }),
    submit: (kind, name, body, url) => rpc('submit_site_entry', { entry_kind: kind, entry_name: name, entry_body: body, entry_url: url }),
    withdraw: id => rpc('withdraw_site_entry', { entry_id: id }),
  };
}
