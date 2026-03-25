<template>
  <div class="game2048">
    <div class="game-header">
      <h2>🎮 2048</h2>
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
      <el-button type="primary" size="small" @click="initGame">新游戏</el-button>
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
  const mergedTiles = []
  
  const order = dx > 0 || dy > 0 
    ? [[...tiles.value].sort((a, b) => b.x - a.x + (b.y - a.y) * 0.1)]
    : [[...tiles.value].sort((a, b) => a.x - b.x + (a.y - b.y) * 0.1)]
  
  const sorted = dx > 0 || dy > 0
    ? [...tiles.value].sort((a, b) => (b.y * 4 + b.x) - (a.y * 4 + a.x))
    : [...tiles.value].sort((a, b) => (a.y * 4 + a.x) - (b.y * 4 + b.x))
  
  const newTiles = []
  const visited = new Set()
  
  for (const tile of sorted) {
    let x = tile.x
    let y = tile.y
    
    while (true) {
      const nextX = x + dx
      const nextY = y + dy
      
      if (nextX < 0 || nextX > 3 || nextY < 0 || nextY > 3) break
      
      const obstacle = newTiles.find(t => t.x === nextX && t.y === nextY)
      
      if (obstacle) {
        if (obstacle.value === tile.value && !mergedTiles.includes(obstacle.id)) {
          obstacle.value *= 2
          score.value += obstacle.value
          mergedTiles.push(obstacle.id)
          moved = true
        }
        break
      }
      
      x = nextX
      y = nextY
      moved = true
    }
    
    if (x !== tile.x || y !== tile.y) {
      newTiles.push({ ...tile, x, y })
    } else {
      newTiles.push(tile)
    }
  }
  
  tiles.value = newTiles
  
  if (moved) {
    setTimeout(addRandomTile, 150)
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
      if (!neighbor || neighbor.value === tile.value) {
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
  bestScore.value = parseInt(localStorage.getItem('2048-best') || '0')
  gameContainer.value?.focus()
})

onUnmounted(() => {
  localStorage.setItem('2048-best', bestScore.value.toString())
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
