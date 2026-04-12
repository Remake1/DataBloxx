<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import HUD from './ui/HUD.vue'
import { createGame } from './core/gameConfig'

const gameRoot = ref<HTMLDivElement | null>(null)
let game: Phaser.Game | null = null
let isUnmounted = false

const pixelFont = '"Press Start 2P"'

async function waitForPixelFont() {
  if (!('fonts' in document)) {
    return
  }

  await document.fonts.load(`56px ${pixelFont}`)
  await document.fonts.ready
}

onMounted(async () => {
  const root = gameRoot.value
  if (!root) {
    return
  }

  try {
    await waitForPixelFont()
  } catch (error) {
    console.warn('Pixel font failed to load before game start.', error)
  }

  if (isUnmounted || game) {
    return
  }

  game = createGame(root)
})

onBeforeUnmount(() => {
  isUnmounted = true
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
