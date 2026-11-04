<script setup>
import { computed, provide, ref } from 'vue';
import { useRoute } from 'vue-router';
import { contentDocument, isContentPreview, selectedContentBlock } from '../content/store';
import { unityEntries } from '../content/unityNotes';
import UnityArticle from '../components/content/UnityArticle.vue';
import NotFoundView from './NotFoundView.vue';
import ContentText from '../components/content/ContentText.vue';
provide('content-page','world');
const route=useRoute(), query=ref(''), category=ref(''), previewId=ref('');
const notes=computed(()=>unityEntries(contentDocument.value,isContentPreview.value));
const notebook=computed(()=>contentDocument.value.pages.world.blocks.find(b=>b.type==='unityNotes' && (isContentPreview.value || !b.hidden)));
const categories=computed(()=>[...new Set(notes.value.map(n=>n.category).filter(Boolean))]);
const filtered=computed(()=>notes.value.filter(n=>(!category.value || category.value===n.category) && `${n.title} ${n.summary} ${n.category}`.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())));
const active=computed(()=>route.params.id ? notes.value.find(n=>n.id===route.params.id) : isContentPreview.value ? notes.value.find(n=>n.id===previewId.value) || notes.value.find(n=>n.blockId===selectedContentBlock.value) || notes.value[0] : null);
</script>
<template>
  <NotFoundView v-if="route.params.id && !active" />
  <div v-else class="shell unity-view">
    <nav class="unity-breadcrumb" aria-label="当前位置"><RouterLink to="/world">My World</RouterLink><span aria-hidden="true">/</span><RouterLink v-if="route.params.id" to="/unity-notes">Unity Notes</RouterLink><span v-else>Unity Notes</span></nav>
    <template v-if="!route.params.id">
      <header class="unity-heading"><div><ContentText tag="p" class="unity-subtitle" :value="notebook?.data.subtitle || 'Unity 学习笔记'" :block-id="notebook?.id" field="subtitle" /><ContentText tag="h1" class="display" tabindex="-1" :value="notebook?.data.heading || 'Unity Notes'" :block-id="notebook?.id" field="heading" /><ContentText tag="p" :value="notebook?.data.description || ''" :block-id="notebook?.id" field="description" /></div><div class="unity-heading-sketch" aria-hidden="true"><span>{ }</span><i></i><small>A notebook, growing slowly.</small></div></header>
      <template v-if="notes.length">
        <div class="unity-filters"><label for="notes-search">查找笔记<input id="notes-search" v-model="query" type="search" placeholder="搜索标题、摘要或分类" /></label><label v-if="categories.length" for="notes-category">按分类浏览<select id="notes-category" v-model="category"><option value="">全部分类</option><option v-for="item in categories" :key="item">{{ item }}</option></select></label></div>
        <div class="unity-note-list"><div v-for="(note,index) in filtered" :key="note.id" class="unity-note-row" :class="{'unity-note-first':index===0}"><div class="unity-note-date"><span>{{ note.category || '学习笔记' }}</span><time v-if="note.date" :datetime="note.date">{{ note.date }}</time><span v-if="note.draft">草稿</span></div><div><button v-if="isContentPreview" class="unity-note-link" @click="previewId=note.id">{{ note.title }}</button><RouterLink v-else class="unity-note-link" :to="`/unity-notes/${note.id}`">{{ note.title }}</RouterLink><p v-if="note.summary">{{ note.summary }}</p></div><span aria-hidden="true">↗</span></div></div>
        <p v-if="!filtered.length" class="unity-empty" role="status">没有找到符合条件的笔记，试试其他关键词或分类。</p>
      </template>
      <div v-else class="unity-empty-page"><span class="unity-empty-mark" aria-hidden="true">{ }</span><h2>第一页，留给下一次发现。</h2><p>学习笔记正在整理，写好后会放在这里。</p><RouterLink to="/world" class="text-link">回到我的个人世界</RouterLink></div>
    </template>
    <UnityArticle v-if="active" :key="active.id" :note="active" />
    <nav v-if="route.params.id" class="unity-reading-footer" aria-label="笔记导航"><RouterLink to="/unity-notes">← 返回笔记目录</RouterLink><RouterLink v-if="notes[notes.indexOf(active)+1]" :to="`/unity-notes/${notes[notes.indexOf(active)+1].id}`">下一篇：{{ notes[notes.indexOf(active)+1].title }} →</RouterLink></nav>
  </div>
</template>
