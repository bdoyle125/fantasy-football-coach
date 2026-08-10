<template>
  <div class="container mt-4">
    <div v-if="playerDetail">
      <div class="row justify-content-center">
        <div class="col-md-10">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <PrimeButton
              as="RouterLink"
              :to="{ name: 'Home' }"
              icon="pi pi-arrow-left"
              label="Back to Player List"
            />
            <PrimeButton
              v-if="myteam?.players?.length"
              :loading="startBenchInProgress"
              label="Start or Bench?"
              @click="getStartOrBenchAdvice"
            />
          </div>
          <Card class="mb-4 shadow-sm">
            <template #header>
              <div class="d-flex align-items-center gap-3">
                <span
                  class="avatar rounded-circle d-flex align-items-center justify-content-center"
                  style="width: 64px; height: 64px; font-size: 2rem; background-color: var(--p-surface-300);"
                >
                  <img
                    :src="`https://sleepercdn.com/content/nfl/players/${playerDetail.player.id}.jpg`"
                    :alt="playerDetail.player.name"
                    style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;"
                  />
                </span>
                <div>
                  <div class="d-flex align-items-center gap-2">
                    <h2 class="mb-0">{{ playerDetail.player.name }}</h2>
                    <Tag
                      v-if="playerDetail.injuryStatus"
                      severity="warn"
                      :value="playerDetail.injuryStatus"
                    />
                  </div>
                  <div>{{ playerDetail.player.position }} &mdash; {{ playerDetail.player.team }}</div>
                </div>
              </div>
            </template>
            <template #content>
              <Tabs value="summary">
                <TabList>
                  <Tab value="summary">Summary</Tab>
                  <Tab value="byWeek">By Week</Tab>
                  <Tab value="history">History</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel value="summary">
                    <p
                      v-if="seasonStatsLabel"
                      class="mb-2"
                      style="color: var(--p-text-muted-color)"
                    >
                      {{ seasonStatsLabel }}
                    </p>
                    <div class="row g-3 mb-3">
                      <div
                        class="col-12 col-md-4"
                        v-for="tile in headlineTiles"
                        :key="tile.label"
                      >
                        <Card class="text-center">
                          <template #content>
                            <div class="fs-3 fw-bold">{{ tile.value }}</div>
                            <div style="color: var(--p-text-muted-color)">
                              {{ tile.label }}
                            </div>
                          </template>
                        </Card>
                      </div>
                    </div>
                    <Card
                      v-if="statGroups.length"
                      class="mb-3"
                    >
                      <template #content>
                        <div
                          v-for="(group, index) in statGroups"
                          :key="group.title"
                          :class="index > 0 ? 'mt-4' : ''"
                        >
                          <h6
                            class="text-uppercase mb-2"
                            style="color: var(--p-text-muted-color); letter-spacing: 0.05em;"
                          >
                            {{ group.title }}
                          </h6>
                          <div class="row g-2">
                            <div
                              v-for="row in group.rows"
                              :key="row.key"
                              class="col-6 col-md-4 col-lg-3"
                            >
                              <div class="stat-tile text-center p-2">
                                <div class="fw-bold">{{ row.value }}</div>
                                <div
                                  class="small"
                                  style="color: var(--p-text-muted-color)"
                                >
                                  {{ row.label }}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </template>
                    </Card>
                  </TabPanel>
                  <TabPanel value="byWeek">
                    <DataTable
                      v-if="weeklyTableRows.length"
                      :value="weeklyTableRows"
                    >
                      <Column
                        field="week"
                        header="Week"
                      />
                      <Column
                        field="pointsPpr"
                        header="Points (PPR)"
                      />
                      <Column
                        field="positionRankPpr"
                        header="Pos Rank (PPR)"
                      />
                      <Column
                        field="gamesPlayed"
                        header="Games Played"
                      />
                    </DataTable>
                    <p
                      v-else
                      class="mb-0"
                      style="color: var(--p-text-muted-color)"
                    >
                      No weekly stats available yet this season.
                    </p>
                  </TabPanel>
                  <TabPanel value="history">
                    <DataTable :value="historyTableRows">
                      <Column
                        field="season"
                        header="Season"
                      />
                      <Column
                        field="pointsPpr"
                        header="Points (PPR)"
                      />
                      <Column
                        field="positionRankPpr"
                        header="Pos Rank (PPR)"
                      />
                      <Column
                        field="gamesPlayed"
                        header="Games Played"
                      />
                    </DataTable>
                    <Panel
                      v-for="season in historySeasonGroups"
                      :key="season.season"
                      :header="`${season.season} Season Stats`"
                      toggleable
                      collapsed
                      class="mt-3"
                    >
                      <div
                        v-for="(group, index) in season.groups"
                        :key="group.title"
                        :class="index > 0 ? 'mt-3' : ''"
                      >
                        <h6
                          class="text-uppercase mb-2"
                          style="color: var(--p-text-muted-color); letter-spacing: 0.05em;"
                        >
                          {{ group.title }}
                        </h6>
                        <div class="row g-2">
                          <div
                            v-for="row in group.rows"
                            :key="row.key"
                            class="col-6 col-md-4 col-lg-3"
                          >
                            <div class="stat-tile text-center p-2">
                              <div class="fw-bold">{{ row.value }}</div>
                              <div
                                class="small"
                                style="color: var(--p-text-muted-color)"
                              >
                                {{ row.label }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Panel>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </template>
          </Card>
        </div>
      </div>
      <PrimeDialog
        :header="`Start or Bench: ${playerDetail.player.name}`"
        v-model:visible="showStartBenchDialog"
        :modal="true"
        :closable="true"
        :style="{ width: '50vw' }"
      >
        <p>{{ startBenchRecommendation }}</p>
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
      <span class="ms-3">Loading player details...</span>
    </div>
  </div>
</template>

<script lang="ts">
import { PlayerService } from '@/service/PlayerService';
import { TeamService } from '@/service/TeamService';
import { PlayerDetail } from '@/types/PlayerDetail';
import { PlayerStats } from '@/types/PlayerStats/PlayerStats';
import { Team } from '@/types/Team';
import {
  ProgressSpinner,
  Card,
  Button as PrimeButton,
  Dialog as PrimeDialog,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Tag,
  DataTable,
  Column,
  Panel,
} from 'primevue';
import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';

interface componentData {
  playerId: string | null;
  playerDetail: PlayerDetail | null;
  myteam: Team | null;
  startBenchRecommendation: string;
  showStartBenchDialog: boolean;
  startBenchInProgress: boolean;
}

const HEADLINE_STAT_KEYS: Array<{ key: keyof PlayerStats; label: string }> = [
  { key: 'pointsPpr', label: 'Points (PPR)' },
  { key: 'positionRankPpr', label: 'Pos Rank (PPR)' },
  { key: 'gamesPlayed', label: 'Games Played' },
];

type StatField = { key: string; label: string };

const RUSHING_FIELDS: StatField[] = [
  { key: 'rushingAttempts', label: 'Rush Attempts' },
  { key: 'rushingYards', label: 'Rush Yards' },
  { key: 'rushingTouchdowns', label: 'Rush TDs' },
  { key: 'rushingYardsPerAttempt', label: 'Yards Per Attempt' },
];

const RECEIVING_FIELDS: StatField[] = [
  { key: 'receptions', label: 'Receptions' },
  { key: 'receivingTargets', label: 'Targets' },
  { key: 'receivingYards', label: 'Rec Yards' },
  { key: 'receivingTouchdowns', label: 'Rec TDs' },
  { key: 'receivingYardsPerReception', label: 'Yards Per Reception' },
];

// A curated allowlist of the stats that actually matter for a quick scouting read, per
// position — everything else (rate stats, long-play records, red-zone counts, advanced
// diagnostics) is deliberately left out rather than filtered from a larger raw set. Most
// skill positions contribute in more than one way (a mobile QB rushes, a pass-catching RB
// gets targets, a gadget-play WR/TE rushes), so each position can have multiple sections.
const POSITION_STAT_GROUPS: Record<string, Array<{ category: string; fields: StatField[] }>> = {
  QB: [
    { category: 'Passing', fields: [
      { key: 'passAttempts', label: 'Pass Attempts' },
      { key: 'passCompletions', label: 'Completions' },
      { key: 'completionPercentage', label: 'Comp %' },
      { key: 'passYards', label: 'Pass Yards' },
      { key: 'passTouchdowns', label: 'Pass TDs' },
      { key: 'passInterceptions', label: 'Interceptions' },
    ]},
    { category: 'Rushing', fields: RUSHING_FIELDS },
  ],
  RB: [
    { category: 'Rushing', fields: RUSHING_FIELDS },
    { category: 'Receiving', fields: RECEIVING_FIELDS },
  ],
  WR: [
    { category: 'Receiving', fields: RECEIVING_FIELDS },
    { category: 'Rushing', fields: RUSHING_FIELDS },
  ],
  TE: [
    { category: 'Receiving', fields: RECEIVING_FIELDS },
    { category: 'Rushing', fields: RUSHING_FIELDS },
  ],
  K: [
    { category: 'Kicking', fields: [
      { key: 'fieldGoalsMade', label: 'FG Made' },
      { key: 'fieldGoalsAttempted', label: 'FG Attempted' },
      { key: 'fieldGoalPercentage', label: 'FG %' },
      { key: 'extraPointsMade', label: 'XP Made' },
      { key: 'extraPointsMissed', label: 'XP Missed' },
    ]},
  ],
  DEF: [
    { category: 'Defense', fields: [
      { key: 'sacks', label: 'Sacks' },
      { key: 'interceptions', label: 'INTs' },
      { key: 'forcedFumbles', label: 'Forced Fumbles' },
      { key: 'fumbleRecoveries', label: 'Fumble Rec' },
      { key: 'touchdowns', label: 'TDs' },
      { key: 'pointsAllowed', label: 'Points Allowed' },
      { key: 'yardsAllowed', label: 'Yards Allowed' },
    ]},
  ],
};

export default defineComponent({
  name: "PlayerCard",
  components: {
    ProgressSpinner,
    Card,
    PrimeButton,
    PrimeDialog,
    Tabs,
    TabList,
    Tab,
    TabPanels,
    TabPanel,
    Tag,
    DataTable,
    Column,
    Panel,
  },
  data(): componentData {
    return {
      playerId: null,
      playerDetail: null,
      myteam: null,
      startBenchRecommendation: '',
      showStartBenchDialog: false,
      startBenchInProgress: false
    }
  },
  setup() {
    const route = useRoute();
    return {
      route,
      PlayerService: new PlayerService(),
      TeamService: new TeamService(),
    }
  },
  computed: {
    headlineTiles() {
      const stats = this.playerDetail?.player?.stats;
      return HEADLINE_STAT_KEYS.map(({ key, label }) => ({
        label,
        value: stats?.[key] ?? '--',
      }));
    },
    seasonStatsLabel(): string | null {
      const detail = this.playerDetail;
      if (!detail?.seasonStatsSeason || detail.seasonStatsSeason === detail.season) {
        return null;
      }
      return `Showing ${detail.seasonStatsSeason} stats`;
    },
    statGroups(): Array<{ title: string; rows: Array<{ key: string; label: string; value: number | string }> }> {
      const stats = this.playerDetail?.player?.stats as Record<string, number> | undefined;
      return this.buildStatGroups(stats ?? null);
    },
    historySeasonGroups(): Array<{ season: string; groups: Array<{ title: string; rows: Array<{ key: string; label: string; value: number | string }> }> }> {
      if (!this.playerDetail) {
        return [];
      }
      return this.playerDetail.history
        .map((entry) => ({
          season: entry.season,
          groups: this.buildStatGroups(entry.stats as Record<string, number> | null),
        }))
        .filter((season) => season.groups.length > 0);
    },
    weeklyTableRows() {
      if (!this.playerDetail) {
        return [];
      }
      return this.playerDetail.weeklyStats
        .map((entry) => this.toStatRow({ week: entry.week }, entry.stats));
    historyTableRows() {
      if (!this.playerDetail) {
        return [];
      }
      return this.playerDetail.history.map((entry) => this.toStatRow({ season: entry.season }, entry.stats));
    }
  },
  methods: {
    buildStatGroups(stats: Record<string, number> | null): Array<{ title: string; rows: Array<{ key: string; label: string; value: number | string }> }> {
      if (!stats) {
        return [];
      }
      const groups = [
        { title: 'General', rows: [{ key: 'gamesActive', label: 'Games Active', value: stats.gamesActive ?? '--' }] },
      ];
      const positionGroups = this.playerDetail?.player?.position ? POSITION_STAT_GROUPS[this.playerDetail.player.position] : undefined;
      for (const { category, fields } of positionGroups ?? []) {
        groups.push({
          title: category,
          rows: fields.map(({ key, label }) => ({ key, label, value: stats[key] ?? '--' })),
        });
      }
      return groups;
    },
    toStatRow(rowKey: Record<string, string | number>, stats: PlayerStats | null) {
      return {
        ...rowKey,
        pointsPpr: stats?.pointsPpr ?? '--',
        positionRankPpr: stats?.positionRankPpr ?? '--',
        gamesPlayed: stats?.gamesPlayed ?? '--',
      };
    },
    async getPlayerDetails() {
      const playerDetail = await this.PlayerService.fetchPlayerDetails(this.playerId as string);
      this.playerDetail = playerDetail;
    },
    async getMyTeam() {
      try {
        this.myteam = await this.TeamService.fetchMyTeam();
      } catch (error) {
        console.error("Error loading team:", error);
      }
    },
    async getStartOrBenchAdvice() {
      try {
        this.startBenchInProgress = true;
        this.startBenchRecommendation = await this.TeamService.startOrBench(this.playerDetail!.player, this.myteam?.players ?? []);
        this.showStartBenchDialog = true;
      } catch (error) {
        console.error("Error getting start/bench advice:", error);
      } finally {
        this.startBenchInProgress = false;
      }
    }
  },
  async mounted() {
    this.playerId = this.route.params.playerId as string;
    await Promise.all([this.getPlayerDetails(), this.getMyTeam()]);
  }
});
</script>

<style scoped>
p {
  white-space: pre-wrap;
}

.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.stat-tile {
  border: 1px solid var(--p-content-border-color);
  border-radius: 6px;
}
</style>
