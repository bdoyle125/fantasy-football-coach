<template>
  <div>
    <h1>Player Card</h1>
    <div v-if="player">
      <h2>{{ player.name }}</h2>
      <p>Team: {{ player.team }}</p>
      <p>Position: {{ player.position }}</p>
      <h3>Statistics:</h3>
      <ul>
        <!-- TODO: Divy up which stats to show based on player position -->
        <li v-for="(value, key) in player.stats" :key="key">
          {{ key }}: {{ value ?? 'N/A' }}
        </li>
      </ul>
    </div>
    <div v-else>
      <p>Loading player details...</p>
    </div>

  </div>
</template>

<script lang="ts">
import { PlayerService } from '@/service/PlayerService';
import { Player } from '@/types/Player';
import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';

interface componentData {
  playerId: string | null;
  player: Player | null;
}

export default defineComponent({
  name: "PlayerCard",
  data(): componentData {
    return {
      playerId: null,
      player: null
    }
  },
  setup() {
    const route = useRoute();
    return {
      route,
      PlayerService: new PlayerService(),
    }
  },
  methods: {
    async getPlayerDetails() {
      // Method to fetch and display player details using this.playerId
      const playerDetails = await this.PlayerService.fetchPlayerDetails(this.playerId as string);
      this.player = playerDetails;
    }
  },
  async mounted() {
    this.playerId = this.route.params.playerId as string;
    await this.getPlayerDetails();
  }
});
</script>

<style scoped></style>