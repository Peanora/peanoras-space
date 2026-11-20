<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue';
import { MIN_PASSWORD_LENGTH } from '../../account/session.js';
import { useSiteAccount } from '../../composables/useSiteAccount.js';
import '../../styles/account.css';

const props = defineProps({ heading: { type: String, default: '我的账号' }, initialMode: { type: String, default: 'password' } });
defineEmits(['close']);
const { configured, state, controller } = useSiteAccount();
const id = useId();
const mode = ref(state.pendingEmail ? 'email' : props.initialMode);
const email = ref(state.pendingEmail), code = ref(''), username = ref(''), password = ref(''), confirmation = ref('');
const editing = ref(false), emailInput = ref(null), codeInput = ref(null), usernameInput = ref(null);
const clock = ref(Date.now());
const cooldown = computed(() => Math.max(0, Math.ceil((state.resendAt - clock.value) / 1000)));
let timer;
onMounted(() => { timer = setInterval(() => { clock.value = Date.now(); }, 1000); });
onUnmounted(() => clearInterval(timer));

watch(() => state.user?.id, () => {
  password.value = ''; confirmation.value = ''; code.value = ''; email.value = ''; username.value = ''; editing.value = false;
});
async function choose(nextMode) {
  if (state.busy) return;
  mode.value = nextMode; password.value = ''; code.value = ''; controller.clearFeedback();
  await nextTick();
  if (nextMode === 'password') usernameInput.value?.focus();
  else if (state.pendingEmail) codeInput.value?.focus();
  else emailInput.value?.focus();
}
async function send() {
  if (await controller.sendCode(state.pendingEmail || email.value)) {
    clock.value = Date.now(); code.value = '';
    await nextTick(); codeInput.value?.focus();
  }
}
async function changeEmail() {
  controller.changeEmail(); code.value = '';
  await nextTick(); emailInput.value?.focus();
}
async function signIn() {
  const pending = controller.passwordLogin(username.value, password.value);
  password.value = '';
  await pending;
}
async function createPassword() {
  const pending = controller.setupPassword(username.value, password.value, confirmation.value);
  password.value = ''; confirmation.value = '';
  if (await pending) editing.value = false;
}
</script>

<template>
  <section class="account-panel" :aria-labelledby="`${id}-title`">
    <h2 :id="`${id}-title`">{{ props.heading }}</h2>
    <p v-if="!configured">登录服务暂未开放，请稍后再来。</p>
    <p v-else-if="state.initializing" role="status">正在恢复登录…</p>
    <template v-else-if="!state.user">
      <div class="account-modes" role="group" aria-label="选择登录方式">
        <button type="button" :aria-pressed="mode === 'password'" :disabled="!!state.busy" @click="choose('password')">用户名登录</button>
        <button type="button" :aria-pressed="mode === 'email'" :disabled="!!state.busy" @click="choose('email')">邮箱验证码</button>
      </div>
      <form v-if="mode === 'password'" class="account-form" @submit.prevent="signIn">
        <label :for="`${id}-username`">用户名</label>
        <input :id="`${id}-username`" ref="usernameInput" v-model="username" autocomplete="username" spellcheck="false" autocapitalize="off" maxlength="24" required :disabled="!!state.busy" />
        <label :for="`${id}-password`">密码</label>
        <input :id="`${id}-password`" v-model="password" type="password" autocomplete="current-password" maxlength="72" required :disabled="!!state.busy" />
        <button class="account-primary" :disabled="!!state.busy">{{ state.busy ? '正在登录…' : '登录' }}</button>
        <p class="account-guide">首次使用或忘记密码？选「邮箱验证码」登录。</p>
      </form>
      <form v-else-if="!state.pendingEmail" class="account-form" @submit.prevent="send">
        <p class="account-guide">首次验证邮箱后会创建账号，你可以在登录后设置用户名和密码。</p>
        <label :for="`${id}-email`">邮箱地址</label>
        <input :id="`${id}-email`" ref="emailInput" v-model="email" type="email" autocomplete="email" maxlength="254" required :disabled="!!state.busy" />
        <button class="account-primary" :disabled="!!state.busy || cooldown > 0">{{ state.busy ? '正在发送…' : cooldown > 0 ? `${cooldown} 秒后可发送` : '发送验证码' }}</button>
      </form>
      <form v-else class="account-form" @submit.prevent="controller.verifyCode(code)">
        <p class="account-guide">验证码发送至 <strong>{{ state.pendingEmail }}</strong></p>
        <label :for="`${id}-code`">邮箱验证码</label>
        <input :id="`${id}-code`" ref="codeInput" v-model="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" maxlength="10" required :disabled="!!state.busy" />
        <button class="account-primary" :disabled="!!state.busy">{{ state.busy === 'verify' ? '正在登录…' : '登录 / 注册' }}</button>
        <div class="account-actions">
          <button type="button" :disabled="!!state.busy || cooldown > 0" @click="send">{{ cooldown > 0 ? `${cooldown} 秒后重发` : '重新发送' }}</button>
          <button type="button" :disabled="!!state.busy" @click="changeEmail">更换邮箱</button>
        </div>
      </form>
    </template>
    <template v-else>
      <p class="account-identity">{{ state.user.email }} <strong v-if="state.isOwner">· 站主</strong></p>
      <p v-if="state.profile === 'loading'" role="status">正在读取账号设置…</p>
      <div v-else-if="state.profile === 'unavailable'" class="account-actions">
        <p>密码设置暂不可用。</p><button type="button" :disabled="!!state.busy" @click="controller.loadProfile()">重试</button>
      </div>
      <template v-else-if="state.profile === 'ready'">
        <p v-if="state.username">用户名 <strong>{{ state.username }}</strong></p>
        <form v-if="editing || !state.username" class="account-form" @submit.prevent="createPassword">
          <template v-if="!state.username">
            <label :for="`${id}-new-user`">设置用户名</label>
            <input :id="`${id}-new-user`" v-model="username" autocomplete="username" spellcheck="false" autocapitalize="off" pattern="[A-Za-z0-9_]{3,24}" maxlength="24" required :disabled="!!state.busy" />
            <small>3–24 位字母、数字或下划线，设置后固定。</small>
          </template>
          <label :for="`${id}-new-password`">新密码</label>
          <input :id="`${id}-new-password`" v-model="password" type="password" autocomplete="new-password" :minlength="MIN_PASSWORD_LENGTH" maxlength="72" required :disabled="!!state.busy" />
          <small>至少 {{ MIN_PASSWORD_LENGTH }} 个字符。</small>
          <label :for="`${id}-confirm`">确认新密码</label>
          <input :id="`${id}-confirm`" v-model="confirmation" type="password" autocomplete="new-password" :minlength="MIN_PASSWORD_LENGTH" maxlength="72" required :disabled="!!state.busy" />
          <button class="account-primary" :disabled="!!state.busy">{{ state.busy ? '正在保存…' : '保存登录密码' }}</button>
        </form>
        <button v-else type="button" class="account-secondary" :disabled="!!state.busy" @click="editing = true; controller.clearFeedback()">更改密码</button>
      </template>
      <div class="account-actions account-signed-in">
        <RouterLink to="/todo" @click="$emit('close')">打开我的清单</RouterLink>
        <template v-if="state.isOwner">
          <RouterLink to="/little-things" @click="$emit('close')">管理小角落</RouterLink>
          <RouterLink to="/friends" @click="$emit('close')">友链审核</RouterLink>
          <RouterLink to="/guestbook" @click="$emit('close')">留言审核</RouterLink>
        </template>
        <button type="button" :disabled="!!state.busy" @click="controller.signOut()">退出登录</button>
      </div>
    </template>
    <p v-if="state.message" class="account-status" role="status">{{ state.message }}</p>
    <p v-if="state.error" class="account-status account-error" role="alert">{{ state.error }}</p>
  </section>
</template>
