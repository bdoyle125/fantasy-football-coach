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
import { Button as PrimeButton, Drawer } from "primevue";

interface componentData {
  sidebarVisible: boolean;
}

export default defineComponent({
  name: "AppShell",
  components: {
    RouterLink,
    PrimeButton,
    Drawer,
  },
  data(): componentData {
    return {
      sidebarVisible: false,
    };
  },
});
</script>

<style scoped>
.app-header-logo {
  height: 36px;
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
