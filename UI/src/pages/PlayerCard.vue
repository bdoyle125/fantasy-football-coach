<template>
    <div>
        <h1>Player Card</h1>
        <!-- Player details would go here -->
    </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';
  export default defineComponent({
    name: "PlayerCard",
    setup() {
        const route = useRoute();
        return {
            route,
            playerId: route.params.playerId
        }
    },
    mounted() {
        console.log("Player ID:", this.playerId);
    }
  });
</script>

<style scoped>
</style>