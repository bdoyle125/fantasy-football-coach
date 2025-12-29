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
          <td @click="navigateToPlayerCard(player.id)">{{ player.name }}</td>
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
    import { useRouter } from "vue-router";
    import { TeamService } from "../service/TeamService";
    import { Player } from "../types/Player";
    
    interface componentData {
        myteam: Player[];
        analysis: string;
    }
    
    export default defineComponent({
        name: "TeamList",
        setup() {
            return {
                TeamService: new TeamService(),
                router: useRouter(),
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
                    this.myteam = await this.TeamService.fetchMyTeam()

                    // Sort my team by position
                    const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
                    this.myteam.sort((a, b) => {
                        return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position);
                    });
                } catch (error) {
                    console.error("Error loading team:", error);
                }
            },
            navigateToPlayerCard(playerId: string) {
                console.log('Navigating to player with ID:', playerId);
                this.router.push({ name: 'PlayerCard', params: { playerId: playerId } });
            }
        },
        async mounted() {
            await this.getTeam();
        }
    });
</script>

<style scoped>
    p {
        white-space: pre-wrap;
    }
</style>