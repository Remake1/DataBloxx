<script setup lang="ts">
import ScoreReadout from './ScoreReadout.vue'
import UptimeMeter from './UptimeMeter.vue'
import { hudState } from './gameState'
</script>

<template>
  <aside v-if="hudState.isInGame" class="hud" aria-live="polite">
    <div class="hud__top-container">
      <div class="hud__bar">
        <ScoreReadout label="Score" :value="hudState.score" />
        <ScoreReadout label="Blocks" :value="`${hudState.blocks}/${hudState.targetBlocks}`" />
        <UptimeMeter :value="hudState.uptime" />
      </div>
      <div v-if="hudState.combo > 1" class="hud__combo">
        x{{ hudState.combo }}
      </div>
    </div>

    <div class="hud__bottom_line">
      <div class="hud__bottom_uptime_bar" :style="{ width: `${Math.round(hudState.uptime)}%` }" />
    </div>
  </aside>
</template>
