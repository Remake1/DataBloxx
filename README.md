# DataBloxx

DataBloxx is a small web game starter inspired by the tower-building feel of
City/Tower Bloxx, rebranded around stacking datacenter modules.
Can be played online by following this [link](https://data-bloxx.vercel.app/).
To install locally follow set-up instructions below

## Stack

- Phaser 4
- Matter.js physics through Phaser
- Vite
- TypeScript
- Vue 3

## Run

```sh
pnpm install
pnpm dev
```

Build the production bundle:

```sh
pnpm build
```

## Structure

```txt
src/
  core/       game config, constants, generated asset registry, event bus
  scenes/     BootScene, MenuScene, GameScene, UIScene
  entities/   DatacenterBlock, CraneArm, Effects
  systems/    Placement, scoring, stability, difficulty
  ui/         Vue HUD, score readouts, combo, uptime meter
  audio/      placeholder for sound assets
  assets/     placeholder for source art assets
```

## Current Slice

- Tap, click, or press space to drop a datacenter block from the moving crane.
- Matter physics handles falling, collision, tilt, and settling.
- Score rewards alignment, combo rewards clean deployments, and uptime drains
  when the tower drifts or tilts.
- Vue renders the HUD above the Phaser canvas.

Phaser install guidance: https://docs.phaser.io/phaser/getting-started/installation
