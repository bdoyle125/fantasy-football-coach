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
  </div>
</template>

<script lang="ts">
  import { defineComponent } from "vue";
  import { TeamService } from "./service/TeamService";
  import { Player } from "../../shared/types/Player";

  interface componentData {
    myteam: Player[];
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
        myteam: []
      };
    },
    async mounted() {
      this.myteam = await this.TeamService.fetchMyTeam();
      console.log(this.myteam);
    }
  });
</script>

<style scoped>
</style>
