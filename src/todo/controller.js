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
  return {
    user: null, initializing: true, sending: false, verifying: false, signingOut: false,
    pendingEmail: '', resendAt: 0, authError: '', authMessage: '',
    items: [], loading: false, loaded: false, loadError: '', mutationError: '', mutating: false,
  };
}

export function createTodoController({ auth, api, state = createTodoState(), now = Date.now, schedule = fn => setTimeout(fn, 0) }) {
  let disposed = false, epoch = 0, readId = 0, authEvents = 0, subscription;
  const current = (captured) => !disposed && captured === epoch;
  function setSession(session) {
    if (disposed) return;
    const previousId = state.user?.id;
    state.user = session?.user || null;
    state.initializing = false;
    if (previousId === state.user?.id) return;
    epoch++; readId++;
    Object.assign(state, { items: [], loaded: false, loading: false, loadError: '', mutationError: '', mutating: false, authError: '', authMessage: '', pendingEmail: '', resendAt: 0 });
    if (state.user) {
      const captured = epoch;
      // Auth listeners are synchronous; query after the auth lock is released.
      schedule(() => { if (current(captured)) void refresh(); });
    }
  }
  async function start() {
    const { data } = auth.onAuthStateChange((_event, session) => { authEvents++; setSession(session); });
    subscription = data.subscription;
    const initialEvents = authEvents;
    try {
      const { data, error } = await auth.getSession();
      if (error) throw error;
      if (!disposed && authEvents === initialEvents) setSession(data.session);
    } catch (error) {
      if (!disposed && authEvents === initialEvents) {
        state.initializing = false;
        state.authError = todoError(error, '无法恢复登录，请重试登录。');
      }
    }
  }
  async function sendCode(value) {
    if (disposed || state.initializing || state.sending || state.verifying || state.user) return false;
    const email = String(value).trim();
    state.authError = ''; state.authMessage = '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) { state.authError = '请填写有效的邮箱地址。'; return false; }
    if (now() < state.resendAt) { state.authError = '请稍等片刻再发送验证码。'; return false; }
    const captured = epoch;
    state.sending = true;
    try {
      const { error } = await auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw error;
      if (!current(captured)) return false;
      state.pendingEmail = email;
      state.resendAt = now() + 60000;
      state.authMessage = '验证码已发送，请查看收件箱或垃圾邮件。';
      return true;
    } catch (error) {
      if (current(captured)) state.authError = todoError(error, '验证码发送失败，请稍后重试。');
      return false;
    } finally { if (!disposed) state.sending = false; }
  }
  async function verifyCode(value) {
    if (disposed || state.verifying || state.sending || !state.pendingEmail || state.user) return false;
    const token = String(value).trim();
    state.authError = ''; state.authMessage = '';
    // Supabase supports configurable OTP lengths; accept 6–10 digits.
    if (!/^\d{6,10}$/.test(token)) { state.authError = '请输入邮件中的数字验证码。'; return false; }
    const captured = epoch;
    state.verifying = true;
    try {
      const { data, error } = await auth.verifyOtp({ email: state.pendingEmail, token, type: 'email' });
      if (error) throw error;
      if (current(captured)) {
        if (!data.session?.user) throw new Error('No session');
        setSession(data.session);
      }
      return !disposed && Boolean(state.user);
    } catch (error) {
      if (current(captured)) state.authError = todoError(error, '验证码验证失败，请检查后重试。');
      return false;
    } finally { if (!disposed) state.verifying = false; }
  }
  function changeEmail() {
    if (state.sending || state.verifying) return;
    // Keep the resend cooldown, even when the address changes.
    state.pendingEmail = ''; state.authError = ''; state.authMessage = '';
  }
  async function signOut() {
    if (disposed || state.signingOut) return false;
    state.signingOut = true; state.authError = '';
    try {
      const { error } = await auth.signOut({ scope: 'local' });
      if (error) throw error;
      setSession(null);
      return true;
    } catch (error) {
      if (!disposed) state.authError = todoError(error, '退出失败，请重试。');
      return false;
    } finally { if (!disposed) state.signingOut = false; }
  }
  async function refresh() {
    if (disposed || !state.user || state.mutating || state.signingOut) return;
    const captured = epoch, request = ++readId, userId = state.user.id;
    state.loading = true; state.loadError = '';
    try {
      const items = await api.list(userId);
      if (current(captured) && request === readId) { state.items = items; state.loaded = true; }
    } catch (error) {
      if (current(captured) && request === readId) state.loadError = todoError(error, '清单加载失败，请点击刷新重试。');
    } finally { if (current(captured) && request === readId) state.loading = false; }
  }
  async function mutate(operation) {
    if (disposed || !state.user || !state.loaded || state.mutating || state.loading || state.signingOut) return false;
    const captured = epoch, userId = state.user.id;
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
    state, start, sendCode, verifyCode, changeEmail, signOut, refresh,
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
    dispose() { disposed = true; epoch++; readId++; subscription?.unsubscribe(); state.items = []; state.user = null; },
  };
}
