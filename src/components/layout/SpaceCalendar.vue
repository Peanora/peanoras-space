<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { contentDocument } from '../../content/store';
import { unityEntries } from '../../content/unityNotes';

const chinaDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
});
function chinaDate() {
  const parts = Object.fromEntries(chinaDateFormat.formatToParts(new Date()).map(part => [part.type, part.value]));
  return { year: Number(parts.year), month: Number(parts.month) - 1, day: Number(parts.day), key: `${parts.year}-${parts.month}-${parts.day}` };
}
const today = ref(chinaDate());
const monthIndex = ref(today.value.year * 12 + today.value.month);
const year = computed(() => Math.floor(monthIndex.value / 12));
const month = computed(() => monthIndex.value - year.value * 12);
const weekdays = ['一', '二', '三', '四', '五', '六', '日'];
const datedNotes = computed(() => {
  const dates = new Map();
  for (const note of unityEntries(contentDocument.value)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(note.date || '')) continue;
    if (!dates.has(note.date)) dates.set(note.date, []);
    dates.get(note.date).push(note);
  }
  return dates;
});
const days = computed(() => {
  const firstWeekday = (new Date(Date.UTC(year.value, month.value, 1)).getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(year.value, month.value + 1, 0)).getUTCDate();
  const length = Math.ceil((firstWeekday + count) / 7) * 7;
  return Array.from({ length }, (_, index) => {
    const day = index - firstWeekday + 1;
    if (day < 1 || day > count) return { key: `empty-${index}` };
    const key = `${year.value}-${String(month.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const notes = datedNotes.value.get(key) || [];
    const isToday = key === today.value.key;
    return { key, day, notes, isToday, label: `${key}${isToday ? '，今天' : ''}${notes.length ? `，${notes.length} 篇笔记：${notes.map(note => note.title).join('、')}` : ''}` };
  });
});

function refreshToday() { today.value = chinaDate(); }
let dateTimer;
onMounted(() => {
  dateTimer = setInterval(refreshToday, 60000);
  document.addEventListener('visibilitychange', refreshToday);
});
onUnmounted(() => {
  clearInterval(dateTimer);
  document.removeEventListener('visibilitychange', refreshToday);
});
</script>

<template>
  <section class="space-panel firefly-widget firefly-calendar" aria-labelledby="space-calendar-title">
    <h2 id="space-calendar-title" class="space-widget-title">日历</h2>
    <div class="firefly-calendar-month">
      <button type="button" aria-label="上一个月" title="上一个月" @click="monthIndex -= 1"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m12 5-5 5 5 5" /></svg></button>
      <strong aria-live="polite">{{ year }} 年 {{ month + 1 }} 月</strong>
      <button type="button" aria-label="下一个月" title="下一个月" @click="monthIndex += 1"><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m8 5 5 5-5 5" /></svg></button>
    </div>
    <div class="firefly-calendar-weekdays" aria-hidden="true"><span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span></div>
    <div class="firefly-calendar-days" role="group" :aria-label="`${year}年${month + 1}月，上海时区`">
      <template v-for="cell in days" :key="cell.key">
        <span v-if="!cell.day" class="firefly-calendar-empty" aria-hidden="true"></span>
        <RouterLink v-else-if="cell.notes.length" :to="`/unity-notes/${cell.notes[0].id}`" class="firefly-calendar-day has-notes" :class="{ 'is-today': cell.isToday }" :aria-label="cell.label" :title="cell.label"><time :datetime="cell.key">{{ cell.day }}</time></RouterLink>
        <time v-else :datetime="cell.key" class="firefly-calendar-day" :class="{ 'is-today': cell.isToday }" :aria-label="cell.label" :aria-current="cell.isToday ? 'date' : undefined">{{ cell.day }}</time>
      </template>
    </div>
  </section>
</template>
