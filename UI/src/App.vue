<template>
  <AppShell>
    <router-view />
  </AppShell>
  <Toast />
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import { Toast } from 'primevue';
  import AppShell from './components/AppShell.vue';
  export default defineComponent({
    name: "App",
    components: {
      AppShell,
      Toast,
    },
  });
</script>

<style scoped>
</style>
