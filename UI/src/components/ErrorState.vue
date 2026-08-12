<template>
  <div
    class="d-flex flex-column justify-content-center align-items-center text-center"
    style="height: 200px;"
  >
    <i
      class="pi pi-exclamation-triangle mb-2"
      style="font-size: 2rem; color: var(--p-orange-500);"
    />
    <span class="mb-3">{{ message }}</span>
    <PrimeButton
      v-if="showRetry"
      label="Retry"
      severity="secondary"
      @click="$emit('retry')"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Button as PrimeButton } from "primevue";

export default defineComponent({
  name: "ErrorState",
  components: {
    PrimeButton,
  },
  props: {
    message: {
      type: String,
      required: true,
    },
    showRetry: {
      type: Boolean,
      default: true,
    },
  },
  emits: ["retry"],
});
</script>
