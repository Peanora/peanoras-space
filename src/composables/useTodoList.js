import { onMounted, onUnmounted, reactive } from 'vue';
import { getTodoClient, todoConfigured } from '../todo/client.js';
import { createTodoApi } from '../todo/api.js';
import { createTodoController, createTodoState } from '../todo/controller.js';

export function useTodoList() {
  const state = reactive(createTodoState());
  const client = getTodoClient();
  const controller = client && createTodoController({ auth: client.auth, api: createTodoApi(client), state });
  function visible() { if (document.visibilityState === 'visible' && state.loaded && !state.loading) void controller?.refresh(); }
  onMounted(() => {
    if (controller) void controller.start();
    else state.initializing = false;
    document.addEventListener('visibilitychange', visible);
  });
  onUnmounted(() => { controller?.dispose(); document.removeEventListener('visibilitychange', visible); });
  return { configured: todoConfigured, state, controller };
}
