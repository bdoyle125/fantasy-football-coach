<template>
  <router-view />
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import TeamList from './pages/TeamList.vue';
  export default defineComponent({
    name: "App",
    components: { TeamList }
  });
</script>

<style scoped>
</style>
