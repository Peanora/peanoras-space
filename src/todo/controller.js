export const TODO_TITLE_LIMIT = 500;
export function cleanTitle(value) {
  const title = String(value ?? '').trim();
  if (!title) throw Object.assign(new Error('请先写下一件待办。'), { code: 'TITLE_INVALID' });
  if (Array.from(title).length > TODO_TITLE_LIMIT) throw Object.assign(new Error('每条待办最多 500 个字。'), { code: 'TITLE_INVALID' });
  return title;
}

export function todoError(error, fallback) {
  if (error?.code === 'TITLE_INVALID') return error.message;
  if (error?.code === 'TODO_CONFLICT') return '这条待办已在其他地方修改或删除。请刷新清单后再试，当前输入仍保留。';
  if (error?.code === 'otp_expired' || error?.code === 'otp_disabled') return '验证码无效或已过期，请检查后重试，或重新发送。';
  if (error?.status === 429 || /rate_limit|over_.*limit/.test(error?.code || '')) return '操作太频繁，请稍后再试。';
  if (error?.status === 401 || error?.code === 'PGRST301' || error?.code === 'refresh_token_not_found') return '登录已失效，请退出后重新登录。';
  if (error?.name === 'AbortError' || error?.name === 'TimeoutError' || /fetch|network/i.test(error?.message || '')) return '网络连接失败，请检查网络后重试。';
  return fallback;
}

export function createTodoState() {
  return { userId: '', items: [], loading: false, loaded: false, loadError: '', mutationError: '', mutating: false };
}

export function createTodoController({ api, state = createTodoState(), schedule = fn => setTimeout(fn, 0) }) {
  let disposed = false, epoch = 0, readId = 0;
  const current = id => !disposed && id === epoch;
  function setUser(userId = '') {
    if (disposed || state.userId === userId) return;
    const id = ++epoch;
    readId++;
    Object.assign(state, {
      userId, items: [], loaded: false, loading: false, loadError: '', mutationError: '', mutating: false,
    });
    if (userId) schedule(() => { if (current(id) && !state.loading && !state.loaded) void refresh(); });
  }
  async function refresh() {
    if (disposed || !state.userId || state.mutating) return;
    const captured = epoch, request = ++readId, userId = state.userId;
    state.loading = true; state.loadError = '';
    try {
      const items = await api.list(userId);
      if (current(captured) && request === readId) { state.items = items; state.loaded = true; }
    } catch (error) {
      if (current(captured) && request === readId) state.loadError = todoError(error, '清单加载失败，请点击刷新重试。');
    } finally { if (current(captured) && request === readId) state.loading = false; }
  }
  async function mutate(operation) {
    if (disposed || !state.userId || !state.loaded || state.mutating || state.loading) return false;
    const captured = epoch, userId = state.userId;
    state.mutating = true; state.mutationError = '';
    try {
      const apply = await operation(userId);
      if (!current(captured)) return false;
      apply();
      return true;
    } catch (error) {
      if (current(captured)) state.mutationError = todoError(error, '保存失败，清单未更改，请重试。');
      return false;
    } finally { if (current(captured)) state.mutating = false; }
  }
  return {
    state, setUser, refresh,
    add: title => mutate(async userId => {
      const item = await api.add(userId, cleanTitle(title));
      return () => { state.items = [item, ...state.items]; };
    }),
    update: (item, patch) => mutate(async userId => {
      const safe = {};
      if ('title' in patch) safe.title = cleanTitle(patch.title);
      if ('completed' in patch) safe.completed = Boolean(patch.completed);
      const updated = await api.update(userId, item, safe);
      return () => { state.items = state.items.map(row => row.id === item.id ? updated : row); };
    }),
    remove: item => mutate(async userId => {
      await api.remove(userId, item);
      return () => { state.items = state.items.filter(row => row.id !== item.id); };
    }),
    dispose() { setUser(); disposed = true; epoch++; readId++; },
  };
}
