import { onMounted, onUnmounted, reactive, watch } from 'vue';
import { getTodoClient } from '../todo/client.js';
import { createTodoApi } from '../todo/api.js';
import { createTodoController, createTodoState } from '../todo/controller.js';
import { useSiteAccount } from './useSiteAccount.js';

export function useTodoList() {
  const state = reactive(createTodoState());
  const account = useSiteAccount();
  const client = getTodoClient();
  const controller = client && createTodoController({ api: createTodoApi(client), state });
  watch(() => account.state.user?.id, userId => controller?.setUser(userId), { immediate: true, flush: 'sync' });
  function visible() { if (document.visibilityState === 'visible' && state.loaded && !state.loading) void controller?.refresh(); }
  onMounted(() => {
    document.addEventListener('visibilitychange', visible);
  });
  onUnmounted(() => { controller?.dispose(); document.removeEventListener('visibilitychange', visible); });
  return { account, state, controller };
}
