<script setup>
import { onMounted, ref } from 'vue';
import AccountPanel from './AccountPanel.vue';

const emit = defineEmits(['close']);
const dialog = ref(null);
onMounted(() => dialog.value?.showModal());
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="site-account-dialog" aria-label="账号登录与设置" @close="emit('close')" @click.self="dialog.close()">
      <div class="site-account-paper">
        <button class="account-dismiss" type="button" aria-label="关闭账号面板" @click="dialog.close()">×</button>
        <AccountPanel @close="dialog.close()" />
      </div>
    </dialog>
  </Teleport>
</template>
