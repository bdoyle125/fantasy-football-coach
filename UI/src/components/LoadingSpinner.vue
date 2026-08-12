<template>
  <div
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
    <span class="ms-3">{{ label }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { ProgressSpinner } from "primevue";

export default defineComponent({
  name: "LoadingSpinner",
  components: {
    ProgressSpinner,
  },
  props: {
    label: {
      type: String,
      default: "Loading...",
    },
  },
});
</script>
