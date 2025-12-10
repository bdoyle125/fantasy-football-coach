<template>
    <div>
        <h1>Player Card</h1>
        <!-- Player details would go here -->
    </div>
</template>

<script lang="ts">
  import { PlayerService } from '@/service/PlayerService';
  import { defineComponent } from 'vue';
  import { useRoute } from 'vue-router';
  
  export default defineComponent({
    name: "PlayerCard",
    setup() {
        const route = useRoute();
        return {
            route,
            playerId: route.params.playerId,
            PlayerService: new PlayerService(),
        }
    },
    methods: {
      async getPlayerDetails() {
        // Method to fetch and display player details using this.playerId
        const playerDetails = await this.PlayerService.fetchPlayerStats(this.playerId as string);
        console.log(playerDetails);
      }
    },
    async mounted() {
      await this.getPlayerDetails();
    }
  });
</script>

<style scoped>
</style>