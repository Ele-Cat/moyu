<template>
  <div class="game2048">
    <div class="game-header">
      <div class="score-board">
        <div class="score-box">
          <div class="label">得分</div>
          <div class="value">{{ score }}</div>
        </div>
        <div class="score-box">
          <div class="label">最高</div>
          <div class="value">{{ bestScore }}</div>
        </div>
      </div>
      <el-button type="primary" @click="initGame">新游戏</el-button>
    </div>
    <div class="game-container" @keydown="handleKeydown" tabindex="0" ref="gameContainer">
      <div class="grid">
        <div v-for="i in 16" :key="i" class="cell"></div>
      </div>
      <div class="tiles">
        <div
          v-for="tile in tiles"
          :key="tile.id"
          class="tile"
          :class="'tile-' + tile.value"
          :style="{
            transform: `translate(${tile.x * 110}px, ${tile.y * 110}px)`
          }"
        >
          {{ tile.value }}
        </div>
      </div>
    </div>
    <div class="tips">↑ ↓ ← → 或 WASD 控制移动</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/modules/game'

const gameStore = useGameStore()

const score = ref(0)
const bestScore = ref(0)
const tiles = ref([])
const gameContainer = ref(null)

let tileId = 0

const directions = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
  W: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  A: { x: -1, y: 0 },
  D: { x: 1, y: 0 }
}

function initGame() {
  tiles.value = []
  score.value = 0
  addRandomTile()
  addRandomTile()
}

function addRandomTile() {
  const emptyCells = []
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 4; y++) {
      if (!tiles.value.find(t => t.x === x && t.y === y)) {
        emptyCells.push({ x, y })
      }
    }
  }

  if (emptyCells.length > 0) {
    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)]
    tiles.value.push({
      id: tileId++,
      x: cell.x,
      y: cell.y,
      value: Math.random() < 0.9 ? 2 : 4
    })
  }
}

function move(direction) {
  const { x: dx, y: dy } = direction
  let moved = false

  const grid = Array(4).fill(null).map(() => Array(4).fill(null))
  for (const tile of tiles.value) {
    grid[tile.y][tile.x] = tile
  }

  const isRow = dx !== 0
  const isReverse = dx > 0 || dy > 0

  const processLine = (line) => {
    const filtered = line.filter(t => t !== null)
    const result = []
    let skip = false

    for (let i = 0; i < filtered.length; i++) {
      if (skip) {
        skip = false
        continue
      }
      if (i < filtered.length - 1 && filtered[i].value === filtered[i + 1].value) {
        result.push({ ...filtered[i], value: filtered[i].value * 2 })
        score.value += filtered[i].value * 2
        skip = true
      } else {
        result.push(filtered[i])
      }
    }

    while (result.length < 4) {
      result.push(null)
    }

    return result
  }

  for (let i = 0; i < 4; i++) {
    let line
    if (isRow) {
      line = [grid[i][0], grid[i][1], grid[i][2], grid[i][3]]
    } else {
      line = [grid[0][i], grid[1][i], grid[2][i], grid[3][i]]
    }

    if (isReverse) {
      line.reverse()
    }

    const processed = processLine(line)

    if (isReverse) {
      processed.reverse()
    }

    for (let j = 0; j < 4; j++) {
      if (isRow) {
        if (grid[i][j]?.id !== processed[j]?.id) {
          moved = true
        }
        grid[i][j] = processed[j]
      } else {
        if (grid[j][i]?.id !== processed[j]?.id) {
          moved = true
        }
        grid[j][i] = processed[j]
      }
    }
  }

  const newTiles = []
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      if (grid[y][x]) {
        grid[y][x].x = x
        grid[y][x].y = y
        newTiles.push(grid[y][x])
      }
    }
  }
  tiles.value = newTiles

  if (moved) {
    addRandomTile()
  }

  if (score.value > bestScore.value) {
    bestScore.value = score.value
  }

  checkGameOver()
}

function checkGameOver() {
  if (tiles.value.length < 16) return

  for (const tile of tiles.value) {
    for (const { x, y } of [
      { x: tile.x + 1, y: tile.y },
      { x: tile.x - 1, y: tile.y },
      { x: tile.x, y: tile.y + 1 },
      { x: tile.x, y: tile.y - 1 }
    ]) {
      const neighbor = tiles.value.find(t => t.x === x && t.y === y)
      if (neighbor && neighbor.value === tile.value) {
        return
      }
    }
  }

  setTimeout(() => {
    alert('游戏结束！得分: ' + score.value)
  }, 300)
}

function handleKeydown(e) {
  if (directions[e.key]) {
    e.preventDefault()
    move(directions[e.key])
  }
}

onMounted(() => {
  initGame()
  bestScore.value = gameStore.game2048Best
  gameContainer.value?.focus()
})

onUnmounted(() => {
  gameStore.save2048Score(bestScore.value)
})
</script>

<style lang="less" scoped>
.game2048 {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  height: 100%;
}

.game-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 15px;

  h2 {
    margin: 0;
    color: var(--text-color);
  }
}

.score-board {
  display: flex;
  gap: 10px;
}

.score-box {
  background: #bbada0;
  border-radius: 6px;
  padding: 5px 15px;
  text-align: center;
  min-width: 60px;

  .label {
    font-size: 12px;
    color: #eee4da;
  }

  .value {
    font-size: 20px;
    font-weight: bold;
    color: #fff;
  }
}

.game-container {
  position: relative;
  width: 450px;
  height: 450px;
  background: #bbada0;
  border-radius: 10px;
  padding: 10px;
  outline: none;
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 10px;
  width: 100%;
  height: 100%;
}

.cell {
  background: rgba(238, 228, 218, 0.35);
  border-radius: 6px;
}

.tiles {
  position: absolute;
  top: 10px;
  left: 10px;
  width: calc(100% - 20px);
  height: calc(100% - 20px);
}

.tile {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: bold;
  transition: transform 0.1s ease;
  color: #776e65;

  &-2 { background: #eee4da; }
  &-4 { background: #ede0c8; }
  &-8 { background: #f2b179; color: #f9f6f2; }
  &-16 { background: #f59563; color: #f9f6f2; }
  &-32 { background: #f67c5f; color: #f9f6f2; }
  &-64 { background: #f65e3b; color: #f9f6f2; }
  &-128 { background: #edcf72; color: #f9f6f2; font-size: 32px; }
  &-256 { background: #edcc61; color: #f9f6f2; font-size: 32px; }
  &-512 { background: #edc850; color: #f9f6f2; font-size: 32px; }
  &-1024 { background: #edc53f; color: #f9f6f2; font-size: 24px; }
  &-2048 { background: #edc22e; color: #f9f6f2; font-size: 24px; }
}

.tips {
  margin-top: 15px;
  color: var(--text-color-secondary);
  font-size: 14px;
}
</style>
