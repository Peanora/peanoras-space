<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { useTodoList } from '../composables/useTodoList.js';
import { useAccountDialog } from '../composables/useAccountDialog.js';
import AccountPanel from '../components/account/AccountPanel.vue';
import '../styles/todo.css';

const { account, state, controller } = useTodoList();
const { configured, state: accountState } = account;
const { show: showAccount } = useAccountDialog();
const title = ref(''), filter = ref('all');
const editId = ref(''), editTitle = ref(''), deleteId = ref('');
const addInput = ref(null);
const busy = computed(() => state.mutating || state.loading || accountState.busy === 'sign-out' || !state.loaded);
const completed = computed(() => state.items.filter(item => item.completed).length);
const visible = computed(() => state.items.filter(item => filter.value === 'all' || (filter.value === 'done' ? item.completed : !item.completed)));
const filters = computed(() => [
  { id: 'all', label: '全部', count: state.items.length },
  { id: 'active', label: '待完成', count: state.items.length - completed.value },
  { id: 'done', label: '已完成', count: completed.value },
]);

watch(() => state.userId, () => { title.value = ''; editId.value = ''; editTitle.value = ''; deleteId.value = ''; filter.value = 'all'; });
async function add() {
  if (await controller.add(title.value)) { title.value = ''; filter.value = 'all'; }
  await nextTick(); addInput.value?.focus();
}
async function edit(item) {
  deleteId.value = ''; editId.value = item.id; editTitle.value = item.title;
  await nextTick(); document.getElementById(`todo-edit-${item.id}`)?.focus();
}
async function save(item) {
  if (await controller.update(item, { title: editTitle.value })) editId.value = '';
}
function toggle(item, event) {
  const completed = event.target.checked;
  event.target.checked = item.completed;
  void controller.update(item, { completed });
}
async function remove(item) {
  if (await controller.remove(item)) { deleteId.value = ''; await nextTick(); addInput.value?.focus(); }
}
</script>

<template>
  <div class="todo-view">
    <header class="todo-heading space-panel">
      <div><h1 tabindex="-1">To-do list</h1><p>把想做的事，一件件记下来。</p></div>
      <svg class="todo-heading-sketch" viewBox="0 0 80 80" fill="none" aria-hidden="true"><path d="m23 17 40 3-4 48-42-3 6-48Z" stroke="currentColor" stroke-width="1.5"/><path d="m31 13 2 11 20 1 3-10-25-2Z" fill="var(--surface)" stroke="currentColor" stroke-width="1.5"/><path d="m27 37 3 3 5-6m5 5 12 1M26 51l3 3 5-6m5 5 12 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </header>

    <section v-if="!configured" class="todo-login space-panel" aria-labelledby="todo-unavailable">
      <h2 id="todo-unavailable">清单还在准备中</h2>
      <p>登录与云端保存尚未开放，请稍后再来。</p>
      <RouterLink class="todo-button" to="/">返回首页</RouterLink>
    </section>
    <div v-else-if="accountState.initializing" class="todo-login space-panel" role="status">正在恢复登录…</div>
    <div v-else-if="!accountState.user" class="todo-login space-panel">
      <AccountPanel heading="你的私人清单" initial-mode="email" />
    </div>

    <template v-else>
      <section class="todo-notebook space-panel" aria-label="我的待办清单">
        <div class="todo-account">
          <div><span class="todo-account-label">当前账户</span><strong>{{ accountState.user.email }}</strong></div>
          <div class="todo-account-actions">
            <button class="todo-text-button" type="button" aria-haspopup="dialog" @click="showAccount">账号设置</button>
            <button class="todo-text-button" :disabled="accountState.busy === 'sign-out'" @click="account.controller.signOut()">{{ accountState.busy === 'sign-out' ? '正在退出…' : '退出登录' }}</button>
          </div>
        </div>
        <p v-if="accountState.error" class="todo-error" role="alert">{{ accountState.error }}</p>
        <form class="todo-add" @submit.prevent="add">
          <label class="sr-only" for="todo-new">添加待办</label>
          <input id="todo-new" ref="addInput" v-model="title" type="text" placeholder="下一件想做的事…" maxlength="1000" required :disabled="busy" />
          <button class="todo-button todo-primary" :disabled="busy || !title.trim()">添加</button>
        </form>
        <div class="todo-toolbar">
          <div class="todo-filters" role="group" aria-label="筛选待办">
            <button v-for="tab in filters" :key="tab.id" :aria-pressed="filter === tab.id" @click="filter = tab.id">{{ tab.label }} <span>{{ tab.count }}</span></button>
          </div>
          <button class="todo-text-button" :disabled="state.loading || state.mutating || accountState.busy === 'sign-out'" @click="controller.refresh()">{{ state.loading ? '加载中…' : '刷新' }}</button>
        </div>
        <p v-if="state.loadError" class="todo-error" role="alert">{{ state.loadError }}</p>
        <p v-if="state.mutationError" class="todo-error" role="alert">{{ state.mutationError }}</p>
        <p v-if="state.loading && !state.loaded" class="todo-empty" role="status">正在加载你的清单…</p>
        <p v-else-if="state.loaded && !visible.length" class="todo-empty">{{ state.items.length === 0 ? '清单还是空的，写下第一件待办吧。' : filter === 'done' ? '还没有已完成的待办。' : '这一页的待办都完成了。' }}</p>
        <ul v-if="visible.length" class="todo-items" :aria-busy="state.loading || state.mutating">
          <li v-for="item in visible" :key="item.id" :class="{ 'is-done': item.completed }">
            <input class="todo-checkbox" type="checkbox" :checked="item.completed" :disabled="busy" :aria-label="`${item.completed ? '标为待完成' : '标为已完成'}：${item.title}`" @change="toggle(item, $event)" />
            <form v-if="editId === item.id" class="todo-edit-form" @submit.prevent="save(item)" @keydown.esc.prevent="editId = ''">
              <label class="sr-only" :for="`todo-edit-${item.id}`">编辑待办</label>
              <input :id="`todo-edit-${item.id}`" v-model="editTitle" type="text" maxlength="1000" required :disabled="busy" />
              <div><button class="todo-text-button" :disabled="busy || !editTitle.trim()">保存</button><button class="todo-text-button" type="button" :disabled="state.mutating" @click="editId = ''">取消</button></div>
            </form>
            <template v-else>
              <span class="todo-item-title">{{ item.title }}</span>
              <div v-if="deleteId === item.id" class="todo-row-actions todo-delete-confirm">
                <span>删除这条？</span><button class="todo-text-button" :disabled="busy" @click="remove(item)">确认删除</button><button class="todo-text-button" :disabled="state.mutating" @click="deleteId = ''">取消</button>
              </div>
              <div v-else class="todo-row-actions">
                <button class="todo-text-button" :disabled="busy" :aria-label="`编辑：${item.title}`" @click="edit(item)">编辑</button>
                <button class="todo-text-button" :disabled="busy" :aria-label="`删除：${item.title}`" @click="deleteId = item.id">删除</button>
              </div>
            </template>
          </li>
        </ul>
        <p class="todo-sync-note" role="status">{{ state.mutating ? '正在保存…' : state.loading ? '正在同步…' : state.loaded ? '修改后自动保存到云端；可刷新获取其他设备的更改。' : '连接成功后即可开始记录。' }}</p>
      </section>
      <p class="todo-bottom-note">这份清单只对当前账户可见。</p>
    </template>
  </div>
</template>
