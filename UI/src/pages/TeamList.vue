<template>
  <div
    v-if="myteam?.players"
    class="p-4"
  >
    <h1>{{ myteam?.name ?? "My Team" }} Roster </h1>
    <DataTable :value="myteam.players">
      <Column
        field="name"
        header="Name"
        :sortable="true"
        :filter="true"
      >
        <template #body="slotProps">
          <RouterLink :to="{ name: 'PlayerCard', params: { playerId: slotProps.data.id } }">
            {{ slotProps.data.name }}
          </RouterLink>
        </template>
      </Column>
      <Column
        field="position"
        header="Position"
        :sortable="true"
        :filter="true"
      />
      <Column
        field="age"
        header="Age"
        :sortable="true"
        :filter="true"
      />
      <Column
        field="team"
        header="Team"
        :sortable="true"
        :filter="true"
      />
    </DataTable>
    <div class="d-flex justify-content-end mt-3">
      <PrimeButton
        v-if="myteam?.players.length"
        :loading="analysisInProgress"
        label="Analyze Team"
        @click="analyzeTeam"
      />
    </div>
    <PrimeDialog
      header="Team Analysis"
      v-model:visible="showAnalysisDialog"
      :modal="true"
      :closable="true"
      :style="{ width: '50vw' }"
    >
      <p>{{ analysis }}</p>
    </PrimeDialog>
  </div>
  <div
    v-else
    class="d-flex flex-column justify-content-center align-items-center"
    style="height: 200px;"
  >
    <ProgressSpinner
      style="width: 50px; height: 50px;"
      strokeWidth="4"
      fill="var(--surface-ground)"
      animationDuration="1s"
      aria-label="Loading"
    />
    <span class="ms-3">Loading team details...</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { TeamService } from "../service/TeamService";
import { Team } from "../types/Team";
import { ProgressSpinner, DataTable, Column, Button as PrimeButton, Dialog as PrimeDialog } from "primevue";
import { RouterLink } from "vue-router";

interface componentData {
  myteam: Team | null;
  analysis: string;
  showAnalysisDialog: boolean;
  analysisInProgress: boolean;
}

export default defineComponent({
  name: "TeamList",
  components: {
    DataTable,
    Column,
    PrimeButton,
    ProgressSpinner,
    PrimeDialog,
    RouterLink
  },
  setup() {
    return {
      TeamService: new TeamService(),
    }
  },
  data(): componentData {
    return {
      myteam: null,
      analysis: '',
      showAnalysisDialog: false,
      analysisInProgress: false,
    };
  },
  methods: {
    async analyzeTeam() {
      try {
        if (!this.myteam) {
          return;
        }
        // Show loading state
        this.analysisInProgress = true;
        this.analysis = await this.TeamService.analyzeTeam(this.myteam.players);
        this.showAnalysisDialog = true;
      } catch (error) {
        console.error("Error analyzing team:", error);
      } finally {
        this.analysisInProgress = false;
      }
    },
    async getTeam() {
      try {
        this.myteam = await this.TeamService.fetchMyTeam()
        // Sort my team by position; unknown positions sort to the end
        const positionOrder = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];
        const positionRank = (position: string | null) => {
          const index = positionOrder.indexOf(position ?? '');
          return index === -1 ? positionOrder.length : index;
        };
        this.myteam.players.sort((a, b) => {
          return positionRank(a.position) - positionRank(b.position);
        });
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
p {
  white-space: pre-wrap;
}
</style>