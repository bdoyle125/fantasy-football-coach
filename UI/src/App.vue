<template>
  <div>
    <h1>Your Team</h1>
    <table v-if="myteam.length">
      <thead>
        <tr>
          <th>Name</th>
          <th>Position</th>
          <th>Team</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="player in myteam" :key="player.id">
          <td>{{ player.name }}</td>
          <td>{{ player.position }}</td>
          <td>{{ player.team }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>No players found.</p>

    <button 
      v-if="myteam.length"
      @click="analyzeTeam"
    >
      Analyze Team
    </button>
    <div v-if="analysis">
      <h2>Team Analysis</h2>
      <p>{{ analysis }}</p>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent } from "vue";
  import { TeamService } from "./service/TeamService";
  import { Player } from "../../backend/types/Player";

  interface componentData {
    myteam: Player[];
    analysis: string;
  }

  export default defineComponent({
    name: "App",
    setup() {
      return {
        TeamService: new TeamService()
      }
    },
    data(): componentData {
      return {
        myteam: [],
        analysis: ''
      };
    },
    methods: {
      async analyzeTeam() {
        try {
          this.analysis = await this.TeamService.analyzeTeam(this.myteam);
        } catch (error) {
          console.error("Error analyzing team:", error);
        }
      },
      async getTeam() {
        try {
          this.myteam = await this.TeamService.fetchMyTeam();
        } catch (error) {
          console.error("Error loading team:", error);
        }
      }
    },
    async mounted() {
      await this.getTeam();
    }
  });
</script>

<style scoped>
</style>
