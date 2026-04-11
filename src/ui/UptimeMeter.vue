<script setup lang="ts">
defineProps<{
  value: number
}>()
</script>

<template>
  <div class="hud-card uptime">
    <span class="hud-card__label">Uptime</span>
    <div class="uptime__track" aria-hidden="true">
      <div class="uptime__bar" :style="{ width: `${Math.round(value)}%` }" />
    </div>
    <span class="hud-card__value">{{ Math.round(value) }}%</span>
  </div>
</template>
