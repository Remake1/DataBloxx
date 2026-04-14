# DataBloxx

DataBloxx is a small web game starter inspired by the tower-building feel of
City/Tower Bloxx, rebranded around stacking datacenter modules.
Can be played online by following this [link](https://data-bloxx.vercel.app/).
To install locally, follow the set-up instructions below.

https://www.youtube.com/watch?v=Kk_5rGTnLEA

<img width="806" height="496" alt="image" src="https://github.com/user-attachments/assets/9f717e24-403b-4bd0-a128-753dafb30913" />
<img width="806" height="496" alt="image" src="https://github.com/user-attachments/assets/b9ce4cd9-a42f-4bb8-96af-c391d08dcc4e" />
<img width="806" height="496" alt="image" src="https://github.com/user-attachments/assets/f86d5181-39e5-4b67-9b8a-4514c72b0e49" />


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
