<template>
  <div class="container mt-4">
    <div v-if="player">
      <div class="row justify-content-center">
        <div class="col-md-10">
          <Button as="RouterLink" :to="{ name: 'Home' }" class="mb-3" icon="pi pi-arrow-left"
            label="Back to Player List" />
          <Card class="mb-4 shadow-sm">
            <template #header>
              <div class="d-flex align-items-center gap-3">
                <span
                  class="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                  style="width: 64px; height: 64px; font-size: 2rem;">
                  <img :src="`https://sleepercdn.com/content/nfl/players/${player.id}.jpg`" :alt="player.name"
                    style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />
                </span>
                <div>
                  <h2 class="mb-0">{{ player.name }}</h2>
                  <div>{{ player.position }} &mdash; {{ player.team }}</div>
                </div>
              </div>
            </template>
            <template #content>
              <div class="row g-3">
                <div class="col-12 col-md-6">
                  <Card class="mb-3">
                    <template #header>
                      <h5>Base Stats</h5>
                    </template>
                    <template #content>
                      <dl class="row mb-0">
                        <template v-for="(label, key) in baseStatLabels" :key="key">
                          <dt class="col-7"><span class="stat-bullet">•</span> {{ label }}</dt>
                          <dd class="col-5">{{ player.stats[key] ?? 'N/A' }}</dd>
                        </template>
                      </dl>
                    </template>
                  </Card>
                </div>
                <div class="col-12 col-md-6" v-if="Object.keys(extraStats(player.stats)).length">
                  <Card class="mb-3">
                    <template #header>
                      <h5>Additional Stats</h5>
                    </template>
                    <template #content>
                      <dl class="row mb-0">
                        <template v-for="(value, key) in extraStats(player.stats)" :key="key">
                          <dt class="col-7"><span class="stat-bullet">•</span> {{ formatHeader(key) }}</dt>
                          <dd class="col-5">{{ value ?? 'N/A' }}</dd>
                        </template>
                      </dl>
                    </template>
                  </Card>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>
    <div v-else class="d-flex flex-column justify-content-center align-items-center" style="height: 200px;">
      <ProgressSpinner style="width: 50px; height: 50px;" strokeWidth="4" fill="var(--surface-ground)"
        animationDuration="1s" aria-label="Loading" />
      <span class="ms-3">Loading player details...</span>
    </div>
  </div>
</template>

<script lang="ts">
import { PlayerService } from '@/service/PlayerService';
import { Player } from '@/types/Player';
import { ProgressSpinner, Card, Button } from 'primevue';
import { defineComponent } from 'vue';
import { useRoute } from 'vue-router';

interface componentData {
  playerId: string | null;
  player: Player | null;
}

export default defineComponent({
  name: "PlayerCard",
  components: {
    ProgressSpinner,
    Card,
    Button
  },
  data(): componentData {
    return {
      playerId: null,
      player: null
    }
  },
  setup() {
    const route = useRoute();
    return {
      route,
      PlayerService: new PlayerService(),
    }
  },
  computed: {
    baseStatLabels() {
      return {
        gamesPlayed: 'Games Played',
        gamesActive: 'Games Active',
        positionRankStandard: 'Pos Rank (Std)',
        positionRankHalfPpr: 'Pos Rank (Half PPR)',
        positionRankPpr: 'Pos Rank (PPR)',
        rankStandard: 'Rank (Std)',
        rankHalfPpr: 'Rank (Half PPR)',
        rankPpr: 'Rank (PPR)',
        pointsStandard: 'Points (Std)',
        pointsHalfPpr: 'Points (Half PPR)',
        pointsPpr: 'Points (PPR)',
        teamDefensiveSnaps: 'Defensive Snaps',
        teamOffensiveSnaps: 'Offensive Snaps',
        teamSpecialTeamsSnaps: 'Special Teams Snaps',
        offensiveSnaps: 'Offensive Snaps',
        specialTeamsSnaps: 'Special Teams Snaps',
        penalties: 'Penalties',
        penaltyYards: 'Penalty Yards'
      };
    }
  },
  methods: {
    extraStats(stats: any) {
      const baseFields = Object.keys(this.baseStatLabels);
      return Object.keys(stats)
        .filter(key => !baseFields.includes(key))
        .reduce((obj, key) => { obj[key] = stats[key]; return obj; }, {});
    },
    formatHeader(key: string) {
      return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    },
    async getPlayerDetails() {
      // Method to fetch and display player details using this.playerId
      const playerDetails = await this.PlayerService.fetchPlayerDetails(this.playerId as string);
      this.player = playerDetails;
      console.log("Fetched player details:", playerDetails);
    }
  },
  async mounted() {
    this.playerId = this.route.params.playerId as string;
    await this.getPlayerDetails();
  }
});
</script>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.stat-bullet {
  color: var(--primary-color, #0d6efd);
  font-size: 1.2em;
  margin-right: 0.5em;
  vertical-align: middle;
  display: inline-block;
}
</style>