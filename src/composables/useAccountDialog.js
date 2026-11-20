import { ref } from 'vue';

const open = ref(false);
export function useAccountDialog() {
  return { open, show: () => { open.value = true; }, close: () => { open.value = false; } };
}
