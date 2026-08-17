<template>
  <AppShell>
    <router-view />
  </AppShell>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import AppShell from './components/AppShell.vue';
  export default defineComponent({
    name: "App",
    components: {
      AppShell,
    },
  });
</script>

<style scoped>
</style>
