<script setup>
import { computed, ref } from 'vue';
const props = defineProps({ code: String, language: String });
const feedback = ref('复制代码');
// Tokens are rendered as text nodes; code is never inserted as HTML.
const tokens = computed(() => {
  if (props.language === 'text') return [{text:props.code,type:''}];
  const pattern = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b(public|private|protected|class|struct|void|int|float|bool|string|var|new|return|if|else|for|foreach|while|using|namespace|static|readonly|override|true|false|null|const|let|function|async|await)\b|\b(\d+(?:\.\d+)?f?)\b/g;
  const result = []; let end = 0;
  for (const match of props.code.matchAll(pattern)) {
    if (match.index > end) result.push({text:props.code.slice(end,match.index),type:''});
    result.push({text:match[0],type:match[1]?'comment':match[2]?'string':match[3]?'keyword':'number'}); end=match.index+match[0].length;
  }
  result.push({text:props.code.slice(end),type:''}); return result;
});
async function copy() {
  try { await navigator.clipboard.writeText(props.code); feedback.value='已复制'; }
  catch { feedback.value='复制失败，请选中代码复制'; }
}
</script>
<template><div class="note-code"><div class="note-code-bar"><span>{{ language === 'csharp' ? 'C#' : language }}</span><button @click="copy" aria-live="polite">{{ feedback }}</button></div><pre tabindex="0" aria-label="代码，可横向滚动"><code><span v-for="(token,index) in tokens" :key="index" :class="token.type">{{ token.text }}</span></code></pre></div></template>
