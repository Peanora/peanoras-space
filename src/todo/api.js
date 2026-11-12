const fields = 'id,user_id,title,completed,created_at,updated_at';
const table = 'todo_items';

export function createTodoApi(client) {
  return {
    async list(userId) {
      // Page explicitly: PostgREST's default row limit must not hide older tasks.
      const items = [];
      for (let offset = 0; ; offset += 200) {
        const { data, error } = await client.from(table).select(fields).eq('user_id', userId)
          .order('created_at', { ascending: false }).order('id', { ascending: false }).range(offset, offset + 199);
        if (error) throw error;
        items.push(...data);
        if (data.length < 200) return items;
      }
    },
    async add(userId, title) {
      const { data, error } = await client.from(table).insert({ user_id: userId, title }).select(fields).single();
      if (error) throw error;
      return data;
    },
    async update(userId, item, patch) {
      const { data, error } = await client.from(table).update(patch).eq('user_id', userId)
        .eq('id', item.id).eq('updated_at', item.updated_at).select(fields).maybeSingle();
      if (error) throw error;
      if (!data) throw { code: 'TODO_CONFLICT' };
      return data;
    },
    async remove(userId, item) {
      const { data, error } = await client.from(table).delete().eq('user_id', userId)
        .eq('id', item.id).eq('updated_at', item.updated_at).select('id').maybeSingle();
      if (error) throw error;
      if (!data) throw { code: 'TODO_CONFLICT' };
    },
  };
}
