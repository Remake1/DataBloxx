<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import HUD from './ui/HUD.vue'
import { createGame } from './core/gameConfig'

const gameRoot = ref<HTMLDivElement | null>(null)
let game: Phaser.Game | null = null

onMounted(() => {
  if (!gameRoot.value) {
    return
  }

  game = createGame(gameRoot.value)
})

onBeforeUnmount(() => {
  game?.destroy(true)
  game = null
})
</script>

<template>
  <main class="game-shell">
    <section class="game-stage" aria-label="DataBloxx game">
      <div ref="gameRoot" class="game-root" />
      <HUD />
    </section>
  </main>
</template>
