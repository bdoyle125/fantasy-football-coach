<template>
  <div class="app-shell">
    <header class="app-header d-flex align-items-center gap-2 px-3 py-2 border-bottom">
      <PrimeButton
        icon="pi pi-bars"
        text
        aria-label="Toggle navigation"
        @click="sidebarVisible = true"
      />
      <RouterLink
        :to="{ name: 'Home' }"
        class="d-flex align-items-center"
      >
        <img
          src="/coach-frank-header.png"
          alt="Coach Frank"
          class="app-header-logo"
        />
      </RouterLink>
      <RouterLink
        v-if="activeLeagueName"
        v-tooltip.bottom="'Switch league'"
        :to="{ name: 'Leagues' }"
        class="app-active-league ms-auto"
      >
        <Tag
          :value="activeLeagueName"
          severity="secondary"
        />
      </RouterLink>
      <PrimeButton
        v-tooltip.left="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        :icon="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"
        text
        aria-label="Toggle dark mode"
        :class="{ 'ms-auto': !activeLeagueName }"
        @click="toggleDarkMode"
      />
    </header>

    <Drawer
      v-model:visible="sidebarVisible"
      header="Coach Frank"
    >
      <nav class="d-flex flex-column gap-2">
        <RouterLink
          :to="{ name: 'Home' }"
          class="app-nav-link"
          :class="{ active: $route.name === 'Home' }"
          @click="sidebarVisible = false"
        >
          Roster
        </RouterLink>
        <RouterLink
          :to="{ name: 'Leagues' }"
          class="app-nav-link"
          :class="{ active: $route.name === 'Leagues' }"
          @click="sidebarVisible = false"
        >
          Leagues
        </RouterLink>
        <RouterLink
          :to="{ name: 'AskCoach' }"
          class="app-nav-link"
          :class="{ active: $route.name === 'AskCoach' }"
          @click="sidebarVisible = false"
        >
          Ask Coach Anything
        </RouterLink>
      </nav>
    </Drawer>

    <main>
      <slot />
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { RouterLink } from "vue-router";
import { Button as PrimeButton, Drawer, Tag } from "primevue";
import { isDarkModeActive, setDarkMode, onSystemDarkModeChange } from "../utils/darkMode";
import { LeagueService } from "../service/LeagueService";
import { RefreshActiveLeagueKey } from "../utils/injectionKeys";

interface componentData {
  sidebarVisible: boolean;
  isDarkMode: boolean;
  stopWatchingSystemDarkMode: (() => void) | null;
  activeLeagueName: string | null;
}

export default defineComponent({
  name: "AppShell",
  components: {
    RouterLink,
    PrimeButton,
    Drawer,
    Tag,
  },
  setup() {
    return {
      LeagueService: new LeagueService(),
    };
  },
  provide() {
    return {
      [RefreshActiveLeagueKey]: this.loadActiveLeague,
    };
  },
  data(): componentData {
    return {
      sidebarVisible: false,
      isDarkMode: isDarkModeActive(),
      stopWatchingSystemDarkMode: null,
      activeLeagueName: null,
    };
  },
  methods: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      setDarkMode(this.isDarkMode);
    },
    async loadActiveLeague() {
      try {
        const settings = await this.LeagueService.fetchActiveLeagueSettings();
        this.activeLeagueName = settings ? settings.leagueName || '(unnamed league)' : null;
      } catch (error) {
        console.error("Error loading active league:", error);
        this.activeLeagueName = null;
      }
    },
  },
  watch: {
    '$route.name'() {
      this.loadActiveLeague();
    },
  },
  mounted() {
    this.stopWatchingSystemDarkMode = onSystemDarkModeChange((isDark) => {
      this.isDarkMode = isDark;
    });
    this.loadActiveLeague();
  },
  beforeUnmount() {
    this.stopWatchingSystemDarkMode?.();
  },
});
</script>

<style scoped>
.app-header-logo {
  height: 36px;
}

.app-active-league {
  display: inline-block;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.app-nav-link {
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  color: var(--p-text-color);
}

.app-nav-link.active {
  background-color: var(--p-primary-color);
  color: var(--p-primary-contrast-color);
  font-weight: 600;
}
</style>
