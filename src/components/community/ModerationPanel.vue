<script setup>
import { onUnmounted, ref, watch } from 'vue';
import { communityUrl } from '../../community/api.js';

const props = defineProps({ api: Object, kind: String, revision: Number });
const emit = defineEmits(['changed']);
const filters = { pending: '待审核', published: '已公开', rejected: '未通过' };
const filter = ref('pending'), items = ref([]), more = ref(false);
const loading = ref(false), reviewing = ref(false), error = ref(''), notice = ref('');
let request = 0, active = true;

async function load(append = false) {
  const id = ++request;
  loading.value = true;
  error.value = '';
  try {
    const page = await props.api.queue(props.kind, filter.value, append ? items.value.at(-1) : null);
    if (id !== request) return;
    items.value = append ? [...items.value, ...page.items] : page.items;
    more.value = page.more;
  } catch {
    if (id === request) error.value = '暂时无法读取审核列表，请刷新重试。';
  } finally {
    if (id === request) loading.value = false;
  }
}

function choose(status) {
  if (filter.value === status) return;
  items.value = [];
  more.value = false;
  notice.value = '';
  filter.value = status;
}

async function review(item, nextStatus) {
  if (reviewing.value || loading.value) return;
  reviewing.value = true;
  error.value = '';
  notice.value = '';
  try {
    const changed = await props.api.review(props.kind, item.id, item.status, nextStatus);
    if (!active) return;
    emit('changed');
    await load();
    if (!active) return;
    if (!changed) notice.value = '这条内容的状态已变更，列表已刷新。';
    else if (nextStatus === 'published') notice.value = '已公开。';
    else notice.value = item.status === 'pending' ? '已拒绝。' : '已移出公开列表。';
  } catch {
    if (active) error.value = '操作失败，请刷新后重试。';
  } finally {
    if (active) reviewing.value = false;
  }
}

watch([filter, () => props.revision], () => void load(), { immediate: true });
onUnmounted(() => { active = false; request++; });
</script>

<template>
  <section class="community-paper community-moderation space-panel" aria-labelledby="community-review">
    <div class="community-toolbar">
      <h2 id="community-review" tabindex="-1">{{ kind === 'friend' ? '友链审核' : '留言审核' }}</h2>
      <button type="button" class="community-quiet" :disabled="loading || reviewing" @click="load()">刷新审核列表</button>
    </div>
    <div class="community-review-actions" role="group" aria-label="筛选审核状态">
      <button v-for="(label, status) in filters" :key="status" type="button" class="community-quiet"
        :aria-pressed="filter === status" :disabled="reviewing" @click="choose(status)">{{ label }}</button>
    </div>
    <p v-if="loading && !items.length" class="community-empty" role="status">正在读取…</p>
    <p v-if="error" class="community-feedback" role="alert">{{ error }}</p>
    <p v-if="notice" class="community-feedback" role="status">{{ notice }}</p>
    <p v-if="!loading && !items.length && !error" class="community-empty">暂无{{ filters[filter] }}的{{ kind === 'friend' ? '友链' : '留言' }}。</p>
    <ul v-if="items.length" class="community-list" :aria-busy="loading || reviewing">
      <li v-for="item in items" :key="item.id" class="community-entry">
        <strong>{{ item.display_name }}</strong>
        <p v-if="communityUrl(item.url)" class="community-review-link">
          <a :href="communityUrl(item.url)" target="_blank" rel="noopener noreferrer">{{ item.url }}</a>
        </p>
        <p>{{ item.body }}</p>
        <div class="community-review-actions">
          <button v-if="filter !== 'published'" type="button" class="community-primary" :disabled="loading || reviewing"
            @click="review(item, 'published')">{{ filter === 'pending' ? '通过并公开' : '恢复公开' }}</button>
          <button v-if="filter !== 'rejected'" type="button" class="community-quiet" :disabled="loading || reviewing"
            @click="review(item, 'rejected')">{{ filter === 'pending' ? '拒绝' : '撤下' }}</button>
        </div>
      </li>
    </ul>
    <button v-if="more" type="button" class="community-quiet" :disabled="loading || reviewing" @click="load(true)">更多审核记录</button>
  </section>
</template>
