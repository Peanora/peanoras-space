<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSiteAccount } from '../composables/useSiteAccount.js';
import { useAccountDialog } from '../composables/useAccountDialog.js';
import { getTodoClient } from '../todo/client.js';
import { communityUrl, createCommunityApi } from '../community/api.js';
import ModerationPanel from '../components/community/ModerationPanel.vue';
import '../styles/community.css';

const { state: account } = useSiteAccount();
const { show: showAccount } = useAccountDialog();
const friend = useRoute().meta.section === 'friends';
const kind = friend ? 'friend' : 'message';
const client = getTodoClient();
const api = client && createCommunityApi(client);
const entries = ref([]), mine = ref([]), cursor = ref(null), more = ref(false);
const loadState = ref('loading'), mineState = ref('idle'), listError = ref(''), formError = ref(''), notice = ref('');
const available = ref(false);
const moderationRevision = ref(0);
const name = ref(''), body = ref(''), url = ref(''), sending = ref(false), withdrawing = ref(false), confirmId = ref('');
const editable = computed(() => Boolean(api && account.user && loadState.value === 'ready'));
const statusLabel = { pending: '待审核', published: '已公开', rejected: '未通过' };
const formatter = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeZone: 'Asia/Shanghai' });
let active = true, mineRequest = 0;
const currentUser = id => active && account.user?.id === id;

async function load(append = false) {
  if (!api) { loadState.value = 'unavailable'; return; }
  listError.value = '';
  loadState.value = append ? 'paging' : 'loading';
  try {
    const page = await api.list(kind, append ? cursor.value : null);
    if (!active) return;
    entries.value = append ? [...entries.value, ...page.items] : page.items;
    cursor.value = page.items.at(-1) || null;
    more.value = page.more;
    available.value = true;
    loadState.value = 'ready';
  } catch (error) {
    if (!active) return;
    if (error?.code === 'PGRST202') { available.value = false; loadState.value = 'unavailable'; return; }
    listError.value = '暂时无法读取，请刷新重试。';
    loadState.value = append ? 'ready' : 'error';
  }
}

async function loadMine() {
  const userId = account.user?.id;
  if (!api || !userId) return;
  const request = ++mineRequest;
  mineState.value = 'loading';
  try {
    const result = await api.mine(kind);
    if (request === mineRequest && currentUser(userId)) { mine.value = result; mineState.value = 'ready'; }
  } catch {
    if (request === mineRequest && currentUser(userId)) mineState.value = 'error';
  }
}

watch(() => account.user?.id, id => {
  mineRequest++;
  mine.value = []; mineState.value = 'idle'; confirmId.value = ''; formError.value = ''; notice.value = '';
  name.value = ''; body.value = ''; url.value = ''; sending.value = false; withdrawing.value = false;
  if (id && loadState.value === 'ready') void loadMine();
}, { immediate: true });

async function submit() {
  const userId = account.user?.id;
  if (!editable.value || sending.value || !userId) return;
  notice.value = ''; formError.value = '';
  const cleanName = name.value.trim(), cleanBody = body.value.trim(), link = friend ? communityUrl(url.value) : null;
  if (!cleanName || Array.from(cleanName).length > 40 || !cleanBody || Array.from(cleanBody).length > 600) {
    formError.value = '请填写名称和正文。名称最多 40 个字，正文最多 600 个字。'; return;
  }
  if (friend && !link) { formError.value = '请填写以 https:// 或 http:// 开头的站点网址。'; return; }
  sending.value = true;
  try {
    await api.submit(kind, cleanName, cleanBody, link);
    if (!currentUser(userId)) return;
    body.value = ''; url.value = '';
    notice.value = '已提交，站主审核通过后会公开。';
    moderationRevision.value++;
    await loadMine();
  } catch (error) {
    if (currentUser(userId)) formError.value = error?.message === 'site_submit_rate_limit' ? '提交太频繁，请过几分钟再试。' : '提交失败，内容已保留，请重试。';
  } finally { if (currentUser(userId)) sending.value = false; }
}

async function withdraw(id) {
  const userId = account.user?.id;
  if (!userId || withdrawing.value) return;
  formError.value = ''; notice.value = ''; withdrawing.value = true;
  try {
    if (!await api.withdraw(id)) throw new Error('Entry unavailable');
    if (!currentUser(userId)) return;
    confirmId.value = '';
    mine.value = mine.value.filter(item => item.id !== id);
    notice.value = '已撤回。';
    entries.value = entries.value.filter(item => item.id !== id);
    moderationRevision.value++;
  } catch {
    if (currentUser(userId)) formError.value = '撤回失败，请刷新后重试。';
  } finally { if (currentUser(userId)) withdrawing.value = false; }
}

async function reload() {
  await load();
  if (active && loadState.value === 'ready' && account.user) await loadMine();
}
onMounted(reload);
onUnmounted(() => { active = false; });
</script>

<template>
  <div class="community-view">
    <header class="community-cover space-panel">
      <h1 tabindex="-1">{{ friend ? '友情链接' : '留言板' }}</h1>
      <p>{{ friend ? '从这里出发，去朋友们的小站看看。' : '路过的话，可以留几句话。' }}</p>
    </header>

    <ModerationPanel v-if="api && account.user && account.isOwner" :key="account.user.id"
      :api="api" :kind="kind" :revision="moderationRevision" @changed="reload" />

    <section class="community-paper space-panel" aria-label="已公开的内容">
      <div class="community-toolbar"><h2>{{ friend ? '朋友的小站' : '访客留言' }}</h2>
        <button v-if="api" class="community-quiet" :disabled="loadState === 'loading' || loadState === 'paging'" @click="reload">刷新</button>
      </div>
      <p v-if="loadState === 'loading'" class="community-empty" role="status">正在读取…</p>
      <p v-else-if="loadState === 'unavailable'" class="community-empty">{{ friend ? '友链还在准备中。' : '留言板还在准备中。' }}</p>
      <p v-if="listError" class="community-feedback" role="alert">{{ listError }}</p>
      <p v-if="loadState === 'ready' && !entries.length && !listError" class="community-empty">{{ friend ? '还没有公开的友链。' : '还没有公开的留言。' }}</p>
      <ul v-if="entries.length" class="community-list" :class="{ 'friend-list': friend }" :aria-busy="loadState === 'paging'">
        <li v-for="item in entries" :key="item.id" class="community-entry">
          <template v-if="friend">
            <span class="friend-initial" aria-hidden="true">{{ Array.from(item.display_name)[0] }}</span>
            <div><a v-if="communityUrl(item.url)" :href="communityUrl(item.url)" target="_blank" rel="noopener noreferrer">{{ item.display_name }} <span aria-hidden="true">↗</span></a><strong v-else>{{ item.display_name }}</strong><p>{{ item.body }}</p></div>
          </template>
          <template v-else>
            <div class="community-meta"><strong>{{ item.display_name }}</strong><time :datetime="item.created_at">{{ formatter.format(new Date(item.created_at)) }}</time></div>
            <p>{{ item.body }}</p>
          </template>
        </li>
      </ul>
      <button v-if="more" class="community-quiet" :disabled="loadState !== 'ready'" @click="load(true)">{{ loadState === 'paging' ? '正在加载…' : '查看更多' }}</button>
    </section>

    <section v-if="available" class="community-paper space-panel" aria-label="提交内容">
      <h2>{{ friend ? '申请友链' : '写留言' }}</h2>
      <p v-if="account.initializing" class="community-muted" role="status">正在检查登录状态…</p>
      <template v-else-if="!account.user">
        <p class="community-muted">登录后可以提交，站主审核通过后会显示在这里。</p>
        <button type="button" class="community-primary" aria-haspopup="dialog" @click="showAccount">登录{{ friend ? '申请' : '留言' }}</button>
      </template>
      <template v-else>
        <p class="community-muted">审核通过后，访客可以看到你填写的内容。</p>
        <form class="community-form" @submit.prevent="submit">
          <label for="community-name">{{ friend ? '站点名称' : '公开昵称' }}</label>
          <input id="community-name" v-model="name" maxlength="80" required :disabled="sending" />
          <template v-if="friend">
            <label for="community-url">站点网址</label><input id="community-url" v-model="url" type="url" maxlength="500" placeholder="https://" autocomplete="url" required :disabled="sending" />
          </template>
          <label for="community-body">{{ friend ? '站点介绍' : '留言内容' }}</label>
          <textarea id="community-body" v-model="body" rows="4" maxlength="1200" required :disabled="sending"></textarea>
          <button class="community-primary" :disabled="sending || !editable">{{ sending ? '正在提交…' : friend ? '提交友链申请' : '提交留言' }}</button>
        </form>
        <p v-if="formError" class="community-feedback" role="alert">{{ formError }}</p>
        <p v-if="notice" class="community-feedback" role="status">{{ notice }}</p>
        <details class="community-mine">
          <summary>我的提交</summary>
          <p v-if="mineState === 'loading'" role="status">正在读取…</p>
          <p v-else-if="mineState === 'error'" role="alert">提交记录读取失败。<button type="button" class="community-quiet" @click="loadMine">重试</button></p>
          <p v-else-if="!mine.length" class="community-muted">暂无提交。</p>
          <ul v-else class="community-list">
            <li v-for="item in mine" :key="item.id" class="community-entry">
              <div class="community-meta"><strong>{{ item.display_name }}</strong><span>{{ statusLabel[item.status] }}</span></div>
              <p>{{ item.body }}</p>
              <div v-if="confirmId === item.id"><button class="community-quiet" :disabled="withdrawing" @click="withdraw(item.id)">确认撤回</button><button class="community-quiet" :disabled="withdrawing" @click="confirmId = ''">取消</button></div>
              <button v-else type="button" class="community-quiet" @click="confirmId = item.id">撤回</button>
            </li>
          </ul>
        </details>
      </template>
    </section>
  </div>
</template>
