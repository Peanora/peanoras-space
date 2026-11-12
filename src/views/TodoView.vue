<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useTodoList } from '../composables/useTodoList.js';
import '../styles/todo.css';

const { configured, state, controller } = useTodoList();
const email = ref(''), token = ref(''), title = ref(''), filter = ref('all');
const editId = ref(''), editTitle = ref(''), deleteId = ref('');
const codeInput = ref(null), emailInput = ref(null), addInput = ref(null);
const clock = ref(Date.now());
let timer;
const cooldown = computed(() => Math.max(0, Math.ceil((state.resendAt - clock.value) / 1000)));
const busy = computed(() => state.mutating || state.loading || state.signingOut || !state.loaded);
const completed = computed(() => state.items.filter(item => item.completed).length);
const visible = computed(() => state.items.filter(item => filter.value === 'all' || (filter.value === 'done' ? item.completed : !item.completed)));
const filters = computed(() => [
  { id: 'all', label: '全部', count: state.items.length },
  { id: 'active', label: '待完成', count: state.items.length - completed.value },
  { id: 'done', label: '已完成', count: completed.value },
]);

watch(() => state.user?.id, () => { title.value = ''; editId.value = ''; editTitle.value = ''; deleteId.value = ''; token.value = ''; email.value = ''; filter.value = 'all'; });
onMounted(() => { timer = setInterval(() => { clock.value = Date.now(); }, 1000); });
onUnmounted(() => clearInterval(timer));
async function send() {
  if (await controller.sendCode(state.pendingEmail || email.value)) {
    clock.value = Date.now(); token.value = '';
    await nextTick(); codeInput.value?.focus();
  }
}
async function changeEmail() {
  controller.changeEmail(); token.value = '';
  await nextTick(); emailInput.value?.focus();
}
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
    <div v-else-if="state.initializing" class="todo-login space-panel" role="status">正在恢复登录…</div>
    <section v-else-if="!state.user" class="todo-login space-panel" aria-labelledby="todo-login-heading">
      <h2 id="todo-login-heading">你的私人清单</h2>
      <p>用邮箱验证码登录。首次登录会创建账户，清单随账户保存，只有你能查看。</p>
      <form v-if="!state.pendingEmail" class="todo-auth-form" @submit.prevent="send">
        <label for="todo-email">邮箱地址</label>
        <input id="todo-email" ref="emailInput" v-model="email" type="email" autocomplete="email" inputmode="email" maxlength="254" placeholder="you@example.com" required :disabled="state.sending" />
        <button class="todo-button todo-primary" :disabled="state.sending || cooldown > 0">{{ state.sending ? '正在发送…' : cooldown > 0 ? `${cooldown} 秒后可发送` : '发送验证码' }}</button>
      </form>
      <form v-else class="todo-auth-form" @submit.prevent="controller.verifyCode(token)">
        <p class="todo-email-sent">验证码发送至 <strong>{{ state.pendingEmail }}</strong></p>
        <label for="todo-code">邮箱验证码</label>
        <input id="todo-code" ref="codeInput" v-model="token" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" minlength="6" maxlength="10" required :disabled="state.verifying || state.sending" aria-describedby="todo-code-help" />
        <small id="todo-code-help">输入邮件中的数字验证码，过期后可重新发送。</small>
        <button class="todo-button todo-primary" :disabled="state.verifying || state.sending">{{ state.verifying ? '正在登录…' : '登录 / 注册' }}</button>
        <div class="todo-auth-actions">
          <button class="todo-text-button" type="button" :disabled="cooldown > 0 || state.sending || state.verifying" @click="send">{{ state.sending ? '正在发送…' : cooldown > 0 ? `${cooldown} 秒后重发` : '重新发送' }}</button>
          <button class="todo-text-button" type="button" :disabled="state.sending || state.verifying" @click="changeEmail">更换邮箱</button>
        </div>
      </form>
      <p v-if="state.authMessage" class="todo-status" role="status">{{ state.authMessage }}</p>
      <p v-if="state.authError" class="todo-error" role="alert">{{ state.authError }}</p>
      <p class="todo-privacy">登录状态会保存在当前浏览器。在公用设备上使用后，请退出登录。</p>
    </section>

    <template v-else>
      <section class="todo-notebook space-panel" aria-label="我的待办清单">
        <div class="todo-account">
          <div><span class="todo-account-label">当前账户</span><strong>{{ state.user.email }}</strong></div>
          <button class="todo-text-button" :disabled="state.signingOut" @click="controller.signOut()">{{ state.signingOut ? '正在退出…' : '退出登录' }}</button>
        </div>
        <p v-if="state.authError" class="todo-error" role="alert">{{ state.authError }}</p>
        <form class="todo-add" @submit.prevent="add">
          <label class="sr-only" for="todo-new">添加待办</label>
          <input id="todo-new" ref="addInput" v-model="title" type="text" placeholder="下一件想做的事…" maxlength="1000" required :disabled="busy" />
          <button class="todo-button todo-primary" :disabled="busy || !title.trim()">添加</button>
        </form>
        <div class="todo-toolbar">
          <div class="todo-filters" role="group" aria-label="筛选待办">
            <button v-for="tab in filters" :key="tab.id" :aria-pressed="filter === tab.id" @click="filter = tab.id">{{ tab.label }} <span>{{ tab.count }}</span></button>
          </div>
          <button class="todo-text-button" :disabled="state.loading || state.mutating || state.signingOut" @click="controller.refresh()">{{ state.loading ? '加载中…' : '刷新' }}</button>
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
