<template>
  <div class="container mt-4">
    <div v-if="myteam?.players">
      <div class="d-flex flex-column flex-sm-row justify-content-between align-items-stretch align-items-sm-center gap-2 mb-3">
        <h1 class="mb-0">{{ myteam?.name ?? "My Team" }} Roster </h1>
        <div class="d-flex gap-2">
          <PrimeButton
            as="RouterLink"
            :to="{ name: 'MatchupPreview' }"
            label="This Week's Matchup"
            severity="secondary"
          />
          <PrimeButton
            v-if="myteam?.players.length"
            :loading="analysisInProgress"
            label="Analyze Team"
            @click="analyzeTeam"
          />
        </div>
      </div>

      <div
        v-if="myteam.players.length"
        class="mb-3"
      >
        <LoadingSpinner
          v-if="insightsInProgress"
          label="Loading dashboard insights..."
        />
        <ErrorState
          v-else-if="insightsError"
          message="Couldn't load dashboard insights."
          @retry="getDashboardInsights"
        />
        <div
          v-else
          class="row g-3"
        >
          <div class="col-12 col-md-3">
            <Card class="h-100 text-center">
              <template #content>
                <div class="fs-3 fw-bold">{{ dashboardInsights?.teamStrength.tier ?? "--" }}</div>
                <div style="color: var(--p-text-muted-color)">Team Strength</div>
                <div
                  v-if="teamStrengthFallbackLabel"
                  class="small mt-1"
                  style="color: var(--p-text-muted-color)"
                >
                  {{ teamStrengthFallbackLabel }}
                </div>
              </template>
            </Card>
          </div>
          <div class="col-12 col-md-3">
            <Card class="h-100 text-center">
              <template #content>
                <div v-if="dashboardInsights?.playerToWatch">
                  <div class="fs-5 fw-bold">{{ dashboardInsights.playerToWatch.name }}</div>
                  <div
                    class="small mb-1"
                    style="color: var(--p-text-muted-color)"
                  >
                    Player to Watch
                  </div>
                  <div class="small">{{ dashboardInsights.playerToWatch.reason }}</div>
                </div>
                <div v-else>
                  <div class="fs-5 fw-bold">--</div>
                  <div style="color: var(--p-text-muted-color)">Player to Watch</div>
                </div>
              </template>
            </Card>
          </div>
          <div class="col-12 col-md-3">
            <Card class="h-100 text-center">
              <template #content>
                <div class="fw-bold mb-1">Trade Suggestion</div>
                <div
                  v-if="tradeSuggestion"
                  class="small"
                >
                  {{ tradeSuggestion }}
                </div>
                <div
                  v-else-if="analysis"
                  class="small"
                >
                  <a
                    href="#"
                    @click.prevent="showAnalysisDialog = true"
                  >View full analysis</a>
                </div>
                <div
                  v-else-if="analysisInProgress"
                  class="small"
                  style="color: var(--p-text-muted-color)"
                >
                  Analyzing...
                </div>
                <PrimeButton
                  v-else
                  label="Run Analyze Team"
                  size="small"
                  severity="secondary"
                  @click="analyzeTeam"
                />
              </template>
            </Card>
          </div>
          <div class="col-12 col-md-3">
            <Card class="h-100 text-center">
              <template #content>
                <div class="fw-bold mb-1">Season Summary</div>
                <div
                  v-if="seasonSummary"
                  class="small"
                >
                  <a
                    href="#"
                    @click.prevent="showSeasonSummaryDialog = true"
                  >View full summary</a>
                </div>
                <div
                  v-else-if="seasonSummaryInProgress"
                  class="small"
                  style="color: var(--p-text-muted-color)"
                >
                  Summarizing...
                </div>
                <PrimeButton
                  v-else
                  label="Run Season Summary"
                  size="small"
                  severity="secondary"
                  @click="getSeasonSummary"
                />
              </template>
            </Card>
          </div>
        </div>
      </div>

      <div class="table-responsive">
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
      </div>
      <PrimeDialog
        header="Team Analysis"
        v-model:visible="showAnalysisDialog"
        :modal="true"
        :closable="true"
        :style="{ width: '50vw' }"
        :breakpoints="{ '768px': '90vw', '575px': '95vw' }"
      >
        <p>{{ analysis }}</p>
      </PrimeDialog>
      <PrimeDialog
        header="Season Summary"
        v-model:visible="showSeasonSummaryDialog"
        :modal="true"
        :closable="true"
        :style="{ width: '50vw' }"
        :breakpoints="{ '768px': '90vw', '575px': '95vw' }"
      >
        <p>{{ seasonSummary }}</p>
      </PrimeDialog>
    </div>
    <ErrorState
      v-else-if="loadError"
      message="Couldn't load your team."
      @retry="getTeam"
    />
    <LoadingSpinner
      v-else
      label="Loading team details..."
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { TeamService } from "../service/TeamService";
import { Team } from "../types/Team";
import { DashboardInsights } from "../types/DashboardInsights";
import { DataTable, Column, Card, Button as PrimeButton, Dialog as PrimeDialog } from "primevue";
import { RouterLink } from "vue-router";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import ErrorState from "../components/ErrorState.vue";
import { sortPlayersByPosition } from "../utils/sortPlayersByPosition";
import { showApiErrorToast } from "../utils/apiError";

interface componentData {
  myteam: Team | null;
  loadError: boolean;
  analysis: string;
  showAnalysisDialog: boolean;
  analysisInProgress: boolean;
  dashboardInsights: DashboardInsights | null;
  insightsInProgress: boolean;
  insightsError: boolean;
  seasonSummary: string;
  showSeasonSummaryDialog: boolean;
  seasonSummaryInProgress: boolean;
}

const TRADE_SUGGESTION_MARKER = "TRADE SUGGESTION:";

export default defineComponent({
  name: "TeamList",
  components: {
    DataTable,
    Column,
    Card,
    PrimeButton,
    PrimeDialog,
    RouterLink,
    LoadingSpinner,
    ErrorState,
  },
  setup() {
    return {
      TeamService: new TeamService(),
    }
  },
  data(): componentData {
    return {
      myteam: null,
      loadError: false,
      analysis: '',
      showAnalysisDialog: false,
      analysisInProgress: false,
      dashboardInsights: null,
      insightsInProgress: false,
      insightsError: false,
      seasonSummary: '',
      showSeasonSummaryDialog: false,
      seasonSummaryInProgress: false,
    };
  },
  computed: {
    tradeSuggestion(): string | null {
      const markerIndex = this.analysis.indexOf(TRADE_SUGGESTION_MARKER);
      if (markerIndex === -1) {
        return null;
      }
      const afterMarker = this.analysis.slice(markerIndex + TRADE_SUGGESTION_MARKER.length).trim();
      const firstLine = afterMarker.split('\n')[0].trim();
      return firstLine || null;
    },
    teamStrengthFallbackLabel(): string | null {
      if (!this.dashboardInsights?.teamStrength.usedLastSeasonFallback) {
        return null;
      }
      return "Includes last season's stats";
    },
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
        showApiErrorToast(this.$toast, "Failed to analyze team", error);
      } finally {
        this.analysisInProgress = false;
      }
    },
    async getSeasonSummary() {
      try {
        if (!this.myteam) {
          return;
        }
        this.seasonSummaryInProgress = true;
        this.seasonSummary = await this.TeamService.fetchSeasonSummary(this.myteam.players);
        this.showSeasonSummaryDialog = true;
      } catch (error) {
        console.error("Error fetching season summary:", error);
        showApiErrorToast(this.$toast, "Failed to generate season summary", error);
      } finally {
        this.seasonSummaryInProgress = false;
      }
    },
    async getTeam() {
      try {
        this.loadError = false;
        this.myteam = await this.TeamService.fetchMyTeam()
        this.myteam.players = sortPlayersByPosition(this.myteam.players);
      } catch (error) {
        console.error("Error loading team:", error);
        this.loadError = true;
      }
    },
    async getDashboardInsights() {
      if (!this.myteam?.players.length) {
        return;
      }
      try {
        this.insightsInProgress = true;
        this.insightsError = false;
        this.dashboardInsights = await this.TeamService.fetchDashboardInsights(this.myteam.players);
      } catch (error) {
        console.error("Error loading dashboard insights:", error);
        this.insightsError = true;
      } finally {
        this.insightsInProgress = false;
      }
    }
  },
  async mounted() {
    await this.getTeam();
    await this.getDashboardInsights();
  }
});
</script>

<style scoped>
p {
  white-space: pre-wrap;
}
</style>
