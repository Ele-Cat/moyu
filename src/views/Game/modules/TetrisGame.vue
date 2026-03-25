<template>
  <div class="tetris-game">
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
        <div class="score-box">
          <div class="label">等级</div>
          <div class="value">{{ level }}</div>
        </div>
        <div class="score-box">
          <div class="label">行数</div>
          <div class="value">{{ lines }}</div>
        </div>
      </div>
      <el-button type="primary" @click="startGame">{{ isRunning ? '重新开始' : '开始游戏' }}</el-button>
    </div>
    <div class="game-area">
      <canvas ref="canvas" width="300" height="500"></canvas>
      <div class="next-piece">
        <div class="next-label">下一个</div>
        <canvas ref="nextCanvas" width="120" height="120"></canvas>
      </div>
    </div>
    <div class="tips">← → 控制移动 | ↑ 旋转 | ↓ 加速</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/modules/game'

const gameStore = useGameStore()

const canvas = ref(null)
const nextCanvas = ref(null)
const score = ref(0)
const bestScore = ref(0)
const level = ref(1)
const lines = ref(0)
const isRunning = ref(false)

let ctx = null
let nextCtx = null
let gameInterval = null

const COLS = 10
const ROWS = 20
const BLOCK_SIZE = 30

const SHAPES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1], [0, 1, 0]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]]
]

const COLORS = [
  '#00f0f0',
  '#f0f000',
  '#a000f0',
  '#00f000',
  '#f00000',
  '#0000f0',
  '#f0a000'
]

const board = ref([])
const currentPiece = ref(null)
const nextPiece = ref(null)

function createPiece(type) {
  const shape = SHAPES[type]
  return {
    shape: shape.map(row => [...row]),
    type,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0
  }
}

function initBoard() {
  board.value = Array(ROWS).fill(null).map(() => Array(COLS).fill(0))
}

function drawBlock(ctx, x, y, color, size = BLOCK_SIZE) {
  ctx.fillStyle = color
  ctx.fillRect(x * size, y * size, size, size)
  
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'
  ctx.lineWidth = 2
  ctx.strokeRect(x * size, y * size, size, size)
  
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.fillRect(x * size + 2, y * size + 2, size - 4, 4)
  ctx.fillRect(x * size + 2, y * size + 2, 4, size - 4)
  
  ctx.fillStyle = 'rgba(0,0,0,0.2)'
  ctx.fillRect(x * size + size - 6, y * size + 6, 4, size - 8)
  ctx.fillRect(x * size + 6, y * size + size - 6, size - 8, 4)
}

function drawBoard() {
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
  
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board.value[r][c]) {
        drawBlock(ctx, c, r, COLORS[board.value[r][c] - 1])
      } else {
        ctx.strokeStyle = '#2a2a4e'
        ctx.lineWidth = 1
        ctx.strokeRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
      }
    }
  }
}

function drawPiece() {
  if (!currentPiece.value) return
  
  const { shape, x, y, type } = currentPiece.value
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        drawBlock(ctx, x + c, y + r, COLORS[type])
      }
    }
  }
}

function drawNextPiece() {
  if (!nextCtx || !nextPiece.value) return
  
  nextCtx.fillStyle = '#1a1a2e'
  nextCtx.fillRect(0, 0, nextCanvas.value.width, nextCanvas.value.height)
  
  const { shape, type } = nextPiece.value
  const blockSize = 25
  const offsetX = (4 - shape[0].length) / 2
  const offsetY = (4 - shape.length) / 2
  
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        drawBlock(nextCtx, offsetX + c, offsetY + r, COLORS[type], blockSize)
      }
    }
  }
}

function rotatePiece(piece) {
  const rotated = {
    ...piece,
    shape: piece.shape[0].map((_, i) => piece.shape.map(row => row[i]).reverse())
  }
  return rotated
}

function isValid(piece, boardToCheck = board.value) {
  const { shape, x, y } = piece
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const newX = x + c
        const newY = y + r
        if (newX < 0 || newX >= COLS || newY >= ROWS) return false
        if (newY >= 0 && boardToCheck[newY][newX]) return false
      }
    }
  }
  return true
}

function lockPiece() {
  const { shape, x, y, type } = currentPiece.value
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] && y + r >= 0) {
        board.value[y + r][x + c] = type + 1
      }
    }
  }
  
  clearLines()
  
  currentPiece.value = nextPiece.value
  nextPiece.value = createPiece(Math.floor(Math.random() * SHAPES.length))
  drawNextPiece()
  
  if (!isValid(currentPiece.value)) {
    gameOver()
  }
}

function clearLines() {
  let cleared = 0
  
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board.value[r].every(cell => cell !== 0)) {
      board.value.splice(r, 1)
      board.value.unshift(Array(COLS).fill(0))
      cleared++
      r++
    }
  }
  
  if (cleared > 0) {
    const points = [0, 100, 300, 500, 800]
    score.value += points[cleared] * level.value
    lines.value += cleared
    
    const newLevel = Math.floor(lines.value / 10) + 1
    if (newLevel > level.value) {
      level.value = newLevel
      if (gameInterval) {
        clearInterval(gameInterval)
        gameInterval = setInterval(update, Math.max(100, 800 - (level.value - 1) * 100))
      }
    }
  }
}

function update() {
  const moved = { ...currentPiece.value, y: currentPiece.value.y + 1 }
  
  if (isValid(moved)) {
    currentPiece.value.y++
  } else {
    lockPiece()
  }
  
  drawBoard()
  drawPiece()
}

function startGame() {
  if (gameInterval) {
    clearInterval(gameInterval)
  }
  
  initBoard()
  score.value = 0
  level.value = 1
  lines.value = 0
  
  nextPiece.value = createPiece(Math.floor(Math.random() * SHAPES.length))
  currentPiece.value = createPiece(Math.floor(Math.random() * SHAPES.length))
  nextPiece.value = createPiece(Math.floor(Math.random() * SHAPES.length))
  
  drawNextPiece()
  
  isRunning.value = true
  gameInterval = setInterval(update, 800)
  
  drawBoard()
  drawPiece()
}

function gameOver() {
  isRunning.value = false
  clearInterval(gameInterval)
  if (score.value > bestScore.value) {
    bestScore.value = score.value
  }
  setTimeout(() => {
    alert('游戏结束！得分: ' + score.value)
  }, 100)
}

function handleKeydown(e) {
  if (!isRunning.value) return
  
  let moved = null
  
  switch (e.key) {
    case 'ArrowLeft':
      moved = { ...currentPiece.value, x: currentPiece.value.x - 1 }
      break
    case 'ArrowRight':
      moved = { ...currentPiece.value, x: currentPiece.value.x + 1 }
      break
    case 'ArrowDown':
      moved = { ...currentPiece.value, y: currentPiece.value.y + 1 }
      break
    case 'ArrowUp':
      moved = rotatePiece(currentPiece.value)
      break
  }
  
  if (moved && isValid(moved)) {
    e.preventDefault()
    currentPiece.value = moved
    drawBoard()
    drawPiece()
  }
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  nextCtx = nextCanvas.value.getContext('2d')
  bestScore.value = gameStore.tetrisBest
  initBoard()
  drawBoard()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (gameInterval) {
    clearInterval(gameInterval)
  }
  document.removeEventListener('keydown', handleKeydown)
  gameStore.saveTetrisScore(bestScore.value)
})
</script>

<style lang="less" scoped>
.tetris-game {
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
  flex-wrap: wrap;
  justify-content: center;

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
  padding: 5px 12px;
  text-align: center;
  min-width: 50px;

  .label {
    font-size: 11px;
    color: #eee4da;
  }

  .value {
    font-size: 18px;
    font-weight: bold;
    color: #fff;
  }
}

.game-area {
  display: flex;
  gap: 20px;
}

.game-container {
  border: 3px solid #333;
  border-radius: 8px;
  overflow: hidden;
}

canvas {
  display: block;
}

.next-piece {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #bbada0;
  border-radius: 8px;
  padding: 10px;
}

.next-label {
  color: #eee4da;
  font-size: 14px;
  margin-bottom: 8px;
}

.next-piece canvas {
  background: #1a1a2e;
  border-radius: 4px;
}

.tips {
  margin-top: 15px;
  color: var(--text-color-secondary);
  font-size: 14px;
}
</style>
