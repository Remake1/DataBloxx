<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: number
}>()

const color = computed(() => {
  if (props.value > 85) return '#00ff66'
  if (props.value > 60) return '#ffcc00'
  return '#ff1a1a'
})
</script>

<template>
  <div class="hud-card uptime">
    <span class="hud-card__label" :style="{ color: color }">Uptime</span>
    <div class="uptime__track" aria-hidden="true" :style="{ borderColor: color }">
      <div class="uptime__bar" :style="{ width: `${Math.round(value)}%`, backgroundColor: color }" />
    </div>
    <span class="hud-card__value" :style="{ color: color }">{{ Math.round(value) }}%</span>
  </div>
</template>
