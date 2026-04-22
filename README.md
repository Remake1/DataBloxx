# DataBloxx

DataBloxx is a small web game starter inspired by the tower-building feel of
City/Tower Bloxx, rebranded around stacking datacenter modules.
Can be played online by following this [link](https://data-bloxx.vercel.app/).
To install locally, follow the set-up instructions below.

## Stack

- Phaser 4
- Matter.js physics through Phaser
- Vite
- TypeScript
- Vue 3

### Demo Video
https://www.youtube.com/watch?v=Kk_5rGTnLEA

### Screenshots

<img width="2940" height="1808" alt="image" src="https://github.com/user-attachments/assets/0b5c1be3-1c23-41c2-a479-a290316cd9e7" />

<img width="2940" height="1808" alt="image" src="https://github.com/user-attachments/assets/a65cac17-b7b2-4d37-addb-325ea56d2d1a" />
<img width="2940" height="1808" alt="image" src="https://github.com/user-attachments/assets/50593111-bb82-46b1-a88d-d84346d335d9" />





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
