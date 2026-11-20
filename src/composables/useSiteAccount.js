import { onMounted, reactive } from 'vue';
import { getTodoClient, todoConfigured } from '../todo/client.js';
import { createAccountApi } from '../account/api.js';
import { createAccount, createAccountState } from '../account/session.js';

const state = reactive(createAccountState());
let controller;

export function useSiteAccount() {
  if (!controller && todoConfigured) {
    const client = getTodoClient();
    controller = createAccount({ auth: client.auth, api: createAccountApi(client), state });
  }
  onMounted(() => {
    if (controller) void controller.start();
    else state.initializing = false;
  });
  return { configured: todoConfigured, state, controller };
}
