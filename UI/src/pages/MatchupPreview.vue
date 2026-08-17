<template>
  <div class="container mt-4">
    <div class="row justify-content-center">
      <div class="col-md-10">
        <div class="d-flex justify-content-end mb-3">
          <PrimeButton
            v-if="matchup?.status === 'ok'"
            :loading="previewInProgress"
            label="Get Matchup Preview"
            @click="getPreview"
          />
        </div>

        <LoadingSpinner
          v-if="!matchup && !loadError"
          label="Loading matchup..."
        />
        <ErrorState
          v-else-if="loadError"
          message="Couldn't load this week's matchup."
          @retry="getMatchup"
        />
        <Card
          v-else-if="matchup?.status === 'unavailable'"
          class="text-center"
        >
          <template #content>
            No matchup scheduled for this week yet.
          </template>
        </Card>
        <Card v-else-if="matchup?.status === 'bye'">
          <template #header>
            <h4 class="mb-0 p-3 pb-0">You're on a bye this week</h4>
          </template>
          <template #content>
            <div class="table-responsive">
              <DataTable :value="matchup.myTeam.players">
                <Column
                  field="name"
                  header="Name"
                />
                <Column
                  field="position"
                  header="Position"
                />
                <Column
                  field="team"
                  header="Team"
                />
              </DataTable>
            </div>
          </template>
        </Card>
        <div
          v-else-if="matchup?.status === 'ok'"
          class="row g-3"
        >
          <div class="col-12 col-md-6">
            <Card>
              <template #header>
                <h4 class="mb-0 p-3 pb-0">{{ matchup.myTeam.name }}</h4>
              </template>
              <template #content>
                <div class="table-responsive">
                  <DataTable :value="matchup.myTeam.players">
                    <Column
                      field="name"
                      header="Name"
                    />
                    <Column
                      field="position"
                      header="Position"
                    />
                    <Column
                      field="team"
                      header="Team"
                    />
                  </DataTable>
                </div>
              </template>
            </Card>
          </div>
          <div class="col-12 col-md-6">
            <Card>
              <template #header>
                <h4 class="mb-0 p-3 pb-0">{{ matchup.opponentTeam.name }}</h4>
              </template>
              <template #content>
                <div class="table-responsive">
                  <DataTable :value="matchup.opponentTeam.players">
                    <Column
                      field="name"
                      header="Name"
                    />
                    <Column
                      field="position"
                      header="Position"
                    />
                    <Column
                      field="team"
                      header="Team"
                    />
                  </DataTable>
                </div>
              </template>
            </Card>
          </div>
        </div>

        <PrimeDialog
          header="Matchup Preview"
          v-model:visible="showPreviewDialog"
          :modal="true"
          :closable="true"
          :style="{ width: '50vw' }"
          :breakpoints="{ '768px': '90vw', '575px': '95vw' }"
        >
          <p>{{ preview }}</p>
        </PrimeDialog>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { MatchupService } from "../service/MatchupService";
import { MatchupResult } from "../types/Matchup";
import { Card, Button as PrimeButton, Dialog as PrimeDialog, DataTable, Column } from "primevue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import ErrorState from "../components/ErrorState.vue";
import { sortPlayersByPosition } from "../utils/sortPlayersByPosition";

interface componentData {
  matchup: MatchupResult | null;
  loadError: boolean;
  preview: string;
  showPreviewDialog: boolean;
  previewInProgress: boolean;
}

export default defineComponent({
  name: "MatchupPreview",
  components: {
    Card,
    PrimeButton,
    PrimeDialog,
    DataTable,
    Column,
    LoadingSpinner,
    ErrorState,
  },
  setup() {
    return {
      MatchupService: new MatchupService(),
    }
  },
  data(): componentData {
    return {
      matchup: null,
      loadError: false,
      preview: '',
      showPreviewDialog: false,
      previewInProgress: false,
    };
  },
  methods: {
    async getMatchup() {
      try {
        this.loadError = false;
        const matchup = await this.MatchupService.fetchMatchup();
        if (matchup.status === 'ok') {
          matchup.myTeam.players = sortPlayersByPosition(matchup.myTeam.players);
          matchup.opponentTeam.players = sortPlayersByPosition(matchup.opponentTeam.players);
        } else if (matchup.status === 'bye') {
          matchup.myTeam.players = sortPlayersByPosition(matchup.myTeam.players);
        }
        this.matchup = matchup;
      } catch (error) {
        console.error("Error loading matchup:", error);
        this.loadError = true;
      }
    },
    async getPreview() {
      try {
        if (!this.matchup || this.matchup.status !== 'ok') {
          return;
        }
        this.previewInProgress = true;
        this.preview = await this.MatchupService.fetchMatchupPreview(this.matchup.myTeam, this.matchup.opponentTeam);
        this.showPreviewDialog = true;
      } catch (error) {
        console.error("Error generating matchup preview:", error);
      } finally {
        this.previewInProgress = false;
      }
    }
  },
  async mounted() {
    await this.getMatchup();
  }
});
</script>

<style scoped>
p {
  white-space: pre-wrap;
}
</style>
