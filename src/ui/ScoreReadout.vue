<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
}>()
</script>

<template>
  <div class="hud-card">
    <span class="hud-card__label">{{ label }}</span>
    <span class="hud-card__value">{{ value }}</span>
  </div>
</template>
