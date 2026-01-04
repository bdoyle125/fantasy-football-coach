<template>
  <div class="p-4">
    <h1>Your Team</h1>
    <DataTable v-if="myteam.length" :value="myteam">
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
      <Button v-if="myteam.length" label="Analyze Team" @click="analyzeTeam"></Button>
    </div>
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
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';

interface componentData {
  myteam: Player[];
  analysis: string;
}

export default defineComponent({
  name: "TeamList",
  components: {
    DataTable,
    Column,
    Button
  },
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