<template>
  <div class="container mt-4">
    <h1 class="mb-3">Leagues</h1>

    <LoadingSpinner
      v-if="loading"
      label="Loading leagues..."
    />
    <ErrorState
      v-else-if="loadError"
      message="Couldn't load your leagues."
      @retry="loadLeagues"
    />
    <div v-else>
      <Card class="mb-4">
        <template #content>
          <div
            v-if="leagues.length === 0"
            class="mb-3"
            style="color: var(--p-text-muted-color)"
          >
            No leagues added yet. Add one below to get started.
          </div>
          <div
            v-if="leagues.length"
            class="table-responsive"
          >
            <DataTable :value="leagues">
              <Column
                field="leagueName"
                header="Name"
              >
                <template #body="slotProps">
                  {{ slotProps.data.leagueName || '(unnamed league)' }}
                </template>
              </Column>
              <Column
                field="provider"
                header="Provider"
              />
              <Column header="Status">
                <template #body="slotProps">
                  <Tag
                    v-if="slotProps.data.isActive"
                    severity="success"
                    value="Active"
                  />
                  <PrimeButton
                    v-else
                    label="Set Active"
                    size="small"
                    severity="secondary"
                    :loading="activatingLeagueId === slotProps.data.id"
                    @click="activateLeague(slotProps.data.id)"
                  />
                </template>
              </Column>
              <Column header="Actions">
                <template #body="slotProps">
                  <PrimeButton
                    v-tooltip.top="'Remove league'"
                    icon="pi pi-trash"
                    aria-label="Remove league"
                    size="small"
                    severity="danger"
                    outlined
                    :loading="removingLeagueId === slotProps.data.id"
                    @click="removeLeague(slotProps.data)"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </template>
      </Card>

      <Card>
        <template #header>
          <h4 class="mb-0 p-3 pb-0">Add a League</h4>
        </template>
        <template #content>
          <form
            class="row g-3"
            @submit.prevent="addLeague"
          >
            <div class="col-12 col-md-3">
              <label class="form-label">Provider</label>
              <PrimeSelect
                v-model="newLeague.provider"
                :options="providerOptions"
                class="w-100"
              />
            </div>
            <div class="col-12 col-md-3">
              <label class="form-label">League ID</label>
              <InputText
                v-model="newLeague.providerLeagueId"
                class="w-100"
                required
              />
            </div>
            <div class="col-12 col-md-3">
              <label class="form-label">Owner ID</label>
              <InputText
                v-model="newLeague.providerOwnerId"
                class="w-100"
                required
              />
            </div>
            <div class="col-12 col-md-3">
              <label class="form-label">League Name (optional)</label>
              <InputText
                v-model="newLeague.leagueName"
                class="w-100"
              />
            </div>
            <div
              v-if="newLeague.provider === 'sleeper'"
              class="col-12"
            >
              <span v-tooltip.top="!newLeague.providerOwnerId ? 'Enter an Owner ID first' : undefined">
                <PrimeButton
                  type="button"
                  label="Find My Sleeper Leagues"
                  size="small"
                  severity="secondary"
                  :loading="sleeperLeaguesInProgress"
                  :disabled="!newLeague.providerOwnerId"
                  @click="findSleeperLeagues"
                />
              </span>
              <div
                v-if="sleeperLeagues.length"
                class="mt-2 col-12 col-md-6"
              >
                <label class="form-label">Select a League</label>
                <PrimeSelect
                  :modelValue="newLeague.providerLeagueId"
                  :options="sleeperLeagues"
                  optionLabel="name"
                  optionValue="league_id"
                  placeholder="Choose a league..."
                  class="w-100"
                  @update:modelValue="onSleeperLeagueSelected"
                />
              </div>
              <div
                v-else-if="sleeperLeaguesFetched && !sleeperLeaguesInProgress"
                class="small mt-2"
                style="color: var(--p-text-muted-color)"
              >
                No leagues found for that Owner ID this season.
              </div>
            </div>
            <div class="col-12">
              <PrimeButton
                type="submit"
                label="Add League"
                :loading="addInProgress"
              />
            </div>
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { LeagueService } from "../service/LeagueService";
import { League, SleeperLeagueSummary } from "../types/League";
import { DataTable, Column, Card, Tag, Button as PrimeButton, Select as PrimeSelect, InputText } from "primevue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import ErrorState from "../components/ErrorState.vue";
import { RefreshActiveLeagueKey } from "../utils/injectionKeys";
import { showApiErrorToast } from "../utils/apiError";

interface NewLeagueForm {
  provider: 'sleeper' | 'espn';
  providerLeagueId: string;
  providerOwnerId: string;
  leagueName: string;
}

interface componentData {
  leagues: League[];
  loading: boolean;
  loadError: boolean;
  activatingLeagueId: string | null;
  removingLeagueId: string | null;
  newLeague: NewLeagueForm;
  addInProgress: boolean;
  providerOptions: string[];
  sleeperLeagues: SleeperLeagueSummary[];
  sleeperLeaguesInProgress: boolean;
  sleeperLeaguesFetched: boolean;
}

export default defineComponent({
  name: "LeaguesPage",
  components: {
    DataTable,
    Column,
    Card,
    Tag,
    PrimeButton,
    PrimeSelect,
    InputText,
    LoadingSpinner,
    ErrorState,
  },
  setup() {
    return {
      LeagueService: new LeagueService(),
    };
  },
  inject: {
    refreshActiveLeague: { from: RefreshActiveLeagueKey, default: () => {} },
  },
  data(): componentData {
    return {
      leagues: [],
      loading: false,
      loadError: false,
      activatingLeagueId: null,
      removingLeagueId: null,
      newLeague: {
        provider: 'sleeper',
        providerLeagueId: '',
        providerOwnerId: '',
        leagueName: '',
      },
      addInProgress: false,
      providerOptions: ['sleeper'],
      sleeperLeagues: [],
      sleeperLeaguesInProgress: false,
      sleeperLeaguesFetched: false,
    };
  },
  watch: {
    'newLeague.providerOwnerId'() {
      this.sleeperLeagues = [];
      this.sleeperLeaguesFetched = false;
    },
  },
  methods: {
    async findSleeperLeagues() {
      if (!this.newLeague.providerOwnerId) {
        return;
      }
      try {
        this.sleeperLeaguesInProgress = true;
        this.sleeperLeagues = await this.LeagueService.fetchSleeperLeaguesForOwner(this.newLeague.providerOwnerId);
        this.sleeperLeaguesFetched = true;
      } catch (error) {
        console.error("Error fetching Sleeper leagues:", error);
        showApiErrorToast(this.$toast, "Failed to fetch Sleeper leagues", error);
      } finally {
        this.sleeperLeaguesInProgress = false;
      }
    },
    onSleeperLeagueSelected(leagueId: string) {
      this.newLeague.providerLeagueId = leagueId;
      const selected = this.sleeperLeagues.find((league) => league.league_id === leagueId);
      if (selected) {
        this.newLeague.leagueName = selected.name;
      }
    },
    async loadLeagues() {
      try {
        this.loading = true;
        this.loadError = false;
        this.leagues = await this.LeagueService.fetchMyLeagues();
      } catch (error) {
        console.error("Error loading leagues:", error);
        this.loadError = true;
      } finally {
        this.loading = false;
      }
    },
    async activateLeague(leagueId: string) {
      try {
        this.activatingLeagueId = leagueId;
        await this.LeagueService.activateLeague(leagueId);
        await this.loadLeagues();
        this.refreshActiveLeague();
      } catch (error) {
        console.error("Error activating league:", error);
        showApiErrorToast(this.$toast, "Failed to switch league", error);
      } finally {
        this.activatingLeagueId = null;
      }
    },
    async removeLeague(league: League) {
      const label = league.leagueName || 'this league';
      if (!window.confirm(`Remove ${label}? This can't be undone.`)) {
        return;
      }
      try {
        this.removingLeagueId = league.id;
        await this.LeagueService.removeLeague(league.id);
        await this.loadLeagues();
        this.refreshActiveLeague();
      } catch (error) {
        console.error("Error removing league:", error);
        showApiErrorToast(this.$toast, "Failed to remove league", error);
      } finally {
        this.removingLeagueId = null;
      }
    },
    async addLeague() {
      if (!this.newLeague.providerLeagueId || !this.newLeague.providerOwnerId) {
        return;
      }
      try {
        this.addInProgress = true;
        await this.LeagueService.addLeague({
          provider: this.newLeague.provider,
          providerLeagueId: this.newLeague.providerLeagueId,
          providerOwnerId: this.newLeague.providerOwnerId,
          ...(this.newLeague.leagueName ? { leagueName: this.newLeague.leagueName } : {}),
        });
        this.newLeague = {
          provider: 'sleeper',
          providerLeagueId: '',
          providerOwnerId: '',
          leagueName: '',
        };
        await this.loadLeagues();
        this.refreshActiveLeague();
      } catch (error) {
        console.error("Error adding league:", error);
        showApiErrorToast(this.$toast, "Failed to add league", error);
      } finally {
        this.addInProgress = false;
      }
    },
  },
  async mounted() {
    await this.loadLeagues();
  },
});
</script>
