<script setup lang="ts">
import ScoreReadout from './ScoreReadout.vue'
import UptimeMeter from './UptimeMeter.vue'
import { hudState } from './gameState'
</script>

<template>
  <aside v-if="hudState.isInGame" class="hud" aria-live="polite">
    <div class="hud__bar">
      <ScoreReadout label="Lv" :value="hudState.levelId" />
      <ScoreReadout label="Score" :value="hudState.score" />
      <ScoreReadout label="Blocks" :value="`${hudState.blocks}/${hudState.targetBlocks}`" />
      <ScoreReadout label="Combo" :value="`${hudState.combo}x`" />
      <UptimeMeter :value="hudState.uptime" />
    </div>

    <div class="hud__bottom">
      <p class="hud__message">{{ hudState.message }}</p>
    </div>
  </aside>
</template>
