<template>
  <div v-if="myteam?.players" class="p-4">
    <h1>{{ myteam?.name ?? "My Team" }} Roster </h1>
    <DataTable :value="myteam.players">
      <Column field="name" header="Name" :sortable="true" :filter="true">
        <template #body="slotProps">
          <a @click.prevent="navigateToPlayerCard(slotProps.data.id)">{{ slotProps.data.name }}</a>
        </template>
      </Column>
      <Column field="position" header="Position" :sortable="true" :filter="true" />
      <Column field="age" header="Age" :sortable="true" :filter="true" />
      <Column field="team" header="Team" :sortable="true" :filter="true" />
    </DataTable>
    <div class="d-flex justify-content-end mt-3">
      <Button v-if="myteam?.players.length" label="Analyze Team" @click="analyzeTeam"></Button>
    </div>
    <div v-if="analysis">
      <h2>Team Analysis</h2>
      <p>{{ analysis }}</p>
    </div>
  </div>
 <div v-else class="d-flex flex-column justify-content-center align-items-center" style="height: 200px;">
    <ProgressSpinner style="width: 50px; height: 50px;" strokeWidth="4" fill="var(--surface-ground)"
      animationDuration="1s" aria-label="Loading" />
    <span class="ms-3">Loading team details...</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { TeamService } from "../service/TeamService";
import { Team } from "../types/Team";
import { ProgressSpinner, DataTable, Column, Button } from "primevue";

interface componentData {
  myteam: Team | null;
  analysis: string;
}

export default defineComponent({
  name: "TeamList",
  components: {
    DataTable,
    Column,
    Button,
    ProgressSpinner
  },
  setup() {
    return {
      TeamService: new TeamService(),
      router: useRouter(),
    }
  },
  data(): componentData {
    return {
      myteam: null,
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
        this.myteam.players.sort((a, b) => {
          return positionOrder.indexOf(a.position) - positionOrder.indexOf(b.position);
        });
      } catch (error) {
        console.error("Error loading team:", error);
      }
    },
    navigateToPlayerCard(playerId: string) {
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