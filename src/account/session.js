import { todoError } from '../todo/controller.js';

export const normalizedUsername = value => String(value ?? '').trim().toLowerCase();
export const validUsername = value => /^[a-z0-9_]{3,24}$/.test(normalizedUsername(value));
export const MIN_PASSWORD_LENGTH = 6;
export const passwordBytes = value => new TextEncoder().encode(value).length;

export function createAccountState() {
  return { user: null, initializing: true, pendingEmail: '', resendAt: 0, busy: '', error: '', message: '', username: '', profile: 'idle', isOwner: false };
}

export function createAccount({ auth, api, state = createAccountState(), now = Date.now, schedule = fn => setTimeout(fn, 0) }) {
  let epoch = 0, events = 0, started, subscription, disposed = false;
  const current = id => !disposed && epoch === id;
  function clearFeedback() { state.error = ''; state.message = ''; }
  function acceptSession(session) {
    if (disposed) return;
    const changed = session?.user?.id !== state.user?.id;
    state.user = session?.user || null;
    state.initializing = false;
    if (!changed) return;
    const id = ++epoch;
    Object.assign(state, { pendingEmail: '', resendAt: 0, username: '', profile: state.user ? 'loading' : 'idle', isOwner: false });
    clearFeedback();
    if (state.user) schedule(() => {
      if (!current(id)) return;
      void loadProfile();
      void loadOwner();
    });
  }
  function start() {
    if (disposed) return;
    started ??= (async () => {
      const initialEvents = events;
      subscription = auth.onAuthStateChange((_event, session) => { events++; acceptSession(session); }).data.subscription;
      try {
        const { data, error } = await auth.getSession();
        if (error) throw error;
        if (events === initialEvents) acceptSession(data.session);
      } catch (error) {
        if (!disposed && events === initialEvents) {
          state.error = todoError(error, '暂时无法恢复登录，请重新登录。');
          state.initializing = false;
        }
      }
    })();
    return started;
  }
  async function loadProfile() {
    if (disposed || !state.user) return;
    const id = epoch;
    state.profile = 'loading';
    try {
      const username = await api.username();
      if (current(id)) { state.username = username || ''; state.profile = 'ready'; }
    } catch {
      if (current(id)) state.profile = 'unavailable';
    }
  }
  async function loadOwner() {
    if (disposed || !state.user) return;
    const id = epoch;
    let isOwner = false;
    try { isOwner = await api.isOwner(); } catch { /* Access remains disabled when the check fails. */ }
    if (current(id)) state.isOwner = isOwner === true;
  }
  async function run(action, perform, fallback) {
    if (disposed || state.initializing || state.busy) return false;
    const id = epoch;
    clearFeedback();
    state.busy = action;
    try { return await perform(id); }
    catch (error) {
      if (current(id)) state.error = todoError(error, fallback);
      return false;
    } finally { if (!disposed) state.busy = ''; }
  }
  const reject = message => { state.error = message; return false; };
  function sendCode(value) {
    if (state.user) return false;
    return run('send', async id => {
      const email = String(value).trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return reject('请填写有效的邮箱地址。');
      if (now() < state.resendAt) return reject('请稍等片刻再发送验证码。');
      const { error } = await auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      if (error) throw error;
      if (!current(id)) return false;
      state.pendingEmail = email;
      state.resendAt = now() + 60000;
      state.message = '验证码已发送，请查看收件箱或垃圾邮件。';
      return true;
    }, '验证码发送失败，请稍后重试。');
  }
  function verifyCode(value) {
    if (state.user || !state.pendingEmail) return false;
    return run('verify', async id => {
      const token = String(value).trim();
      if (!/^\d{6,10}$/.test(token)) return reject('请输入邮件中的数字验证码。');
      const { data, error } = await auth.verifyOtp({ email: state.pendingEmail, token, type: 'email' });
      if (error) throw error;
      if (current(id)) acceptSession(data.session);
      if (!state.user) throw new Error('Missing session');
      return !disposed;
    }, '验证码验证失败，请检查后重试。');
  }
  function passwordLogin(value, password) {
    if (state.user) return false;
    return run('password-login', async id => {
      if (!validUsername(value) || !password || passwordBytes(password) > 72) return reject('请检查用户名和密码。');
      let tokens;
      try { tokens = await api.passwordLogin(normalizedUsername(value), password); }
      catch (error) {
        if (error?.code === 'invalid_login') return reject('用户名或密码不正确。');
        throw error;
      }
      if (!current(id)) return false;
      const { data, error } = await auth.setSession(tokens);
      if (error) throw error;
      if (current(id)) acceptSession(data.session);
      return !disposed && Boolean(state.user);
    }, '用户名登录暂不可用。可以改用邮箱验证码登录。');
  }
  function setupPassword(value, password, confirmation) {
    if (!state.user || state.profile !== 'ready') return false;
    return run('set-password', async id => {
      const username = state.username || normalizedUsername(value);
      if (!validUsername(username)) return reject('用户名需为 3–24 位字母、数字或下划线。');
      if (Array.from(password).length < MIN_PASSWORD_LENGTH || passwordBytes(password) > 72) {
        return reject(`密码至少需要 ${MIN_PASSWORD_LENGTH} 个字符，且最多 72 字节。`);
      }
      if (password !== confirmation) return reject('两次输入的密码不一致。');
      const { error } = await auth.updateUser({ password });
      if (error?.code === 'reauthentication_needed' || error?.code === 'reauthentication_not_valid') return reject('请先退出，再用邮箱验证码登录后设置密码。');
      if (error?.code === 'weak_password') return reject('这个密码未通过安全检查，请换一个更强的密码。');
      if (error?.code === 'same_password' && state.username) return reject('新密码需要与当前密码不同。');
      if (error && error.code !== 'same_password') throw error;
      if (!current(id)) return false;
      if (!state.username) {
        try {
          const saved = await api.setUsername(username);
          if (!current(id)) return false;
          state.username = saved;
        } catch (error) {
          if (!current(id)) return false;
          if (error?.code === '23505') return reject('密码已保存。这个用户名已被使用，请换一个再保存。');
          return reject('密码已保存，用户名暂未绑定。请重试或用邮箱验证码登录。');
        }
      }
      state.message = '已保存。下次可以用用户名和密码登录。';
      return true;
    }, '密码设置失败，请检查密码后重试。');
  }
  function changeEmail() { if (!state.busy) { state.pendingEmail = ''; clearFeedback(); } }
  function signOut() {
    return run('sign-out', async id => {
      const { error } = await auth.signOut({ scope: 'local' });
      if (error) throw error;
      if (current(id)) acceptSession(null);
      return !disposed;
    }, '退出失败，请重试。');
  }
  return { state, start, loadProfile, sendCode, verifyCode, passwordLogin, setupPassword, changeEmail, clearFeedback, signOut,
    dispose() { disposed = true; epoch++; subscription?.unsubscribe(); state.user = null; state.isOwner = false; },
  };
}
