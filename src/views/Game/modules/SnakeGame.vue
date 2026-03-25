<template>
  <div class="snake-game">
    <div class="game-header">
      <h2>🐍 贪吃蛇</h2>
      <div class="score">得分: {{ score }}</div>
      <el-button type="primary" size="small" @click="startGame">{{ isRunning ? '重新开始' : '开始游戏' }}</el-button>
    </div>
    <div class="game-container">
      <canvas ref="canvas" width="400" height="400"></canvas>
    </div>
    <div class="tips">↑ ↓ ← → 控制方向</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref(null)
const score = ref(0)
const isRunning = ref(false)

let ctx = null
let gameInterval = null

const gridSize = 20
const tileCount = 20

const snake = ref([])
const food = ref({ x: 10, y: 10 })
const direction = ref({ x: 0, y: 0 })
const nextDirection = ref({ x: 0, y: 0 })

function initGame() {
  snake.value = [
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 }
  ]
  direction.value = { x: 0, y: -1 }
  nextDirection.value = { x: 0, y: -1 }
  score.value = 0
  spawnFood()
}

function spawnFood() {
  let valid = false
  while (!valid) {
    food.value = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    }
    valid = !snake.value.some(s => s.x === food.value.x && s.y === food.value.y)
  }
}

function draw() {
  if (!ctx) return
  
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
  
  for (let i = 0; i < tileCount; i++) {
    ctx.strokeStyle = '#2a2a4e'
    ctx.beginPath()
    ctx.moveTo(i * gridSize, 0)
    ctx.lineTo(i * gridSize, canvas.value.height)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i * gridSize)
    ctx.lineTo(canvas.value.width, i * gridSize)
    ctx.stroke()
  }
  
  snake.value.forEach((segment, index) => {
    const gradient = ctx.createRadialGradient(
      segment.x * gridSize + gridSize / 2,
      segment.y * gridSize + gridSize / 2,
      0,
      segment.x * gridSize + gridSize / 2,
      segment.y * gridSize + gridSize / 2,
      gridSize / 2
    )
    
    if (index === 0) {
      gradient.addColorStop(0, '#7bed9f')
      gradient.addColorStop(1, '#2ed573')
    } else {
      gradient.addColorStop(0, '#7bed9f')
      gradient.addColorStop(1, '#26de81')
    }
    
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(
      segment.x * gridSize + 1,
      segment.y * gridSize + 1,
      gridSize - 2,
      gridSize - 2,
      4
    )
    ctx.fill()
  })
  
  ctx.fillStyle = '#ff6b6b'
  ctx.beginPath(
  )
  ctx.arc(
    food.value.x * gridSize + gridSize / 2,
    food.value.y * gridSize + gridSize / 2,
    gridSize / 2 - 2,
    0,
    Math.PI * 2
  )
  ctx.fill()
  
  ctx.fillStyle = '#ffcccc'
  ctx.beginPath()
  ctx.arc(
    food.value.x * gridSize + gridSize / 2 - 3,
    food.value.y * gridSize + gridSize / 2 - 3,
    3,
    0,
    Math.PI * 2
  )
  ctx.fill()
}

function update() {
  direction.value = { ...nextDirection.value }
  
  const head = {
    x: snake.value[0].x + direction.value.x,
    y: snake.value[0].y + direction.value.y
  }
  
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    gameOver()
    return
  }
  
  if (snake.value.some(s => s.x === head.x && s.y === head.y)) {
    gameOver()
    return
  }
  
  snake.value.unshift(head)
  
  if (head.x === food.value.x && head.y === food.value.y) {
    score.value += 10
    spawnFood()
  } else {
    snake.value.pop()
  }
  
  draw()
}

function startGame() {
  if (gameInterval) {
    clearInterval(gameInterval)
  }
  
  initGame()
  isRunning.value = true
  gameInterval = setInterval(update, 100)
  draw()
}

function gameOver() {
  isRunning.value = false
  clearInterval(gameInterval)
  setTimeout(() => {
    alert('游戏结束！得分: ' + score.value)
  }, 100)
}

function handleKeydown(e) {
  const keyMap = {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 }
  }
  
  const newDir = keyMap[e.key]
  if (newDir) {
    e.preventDefault()
    if (newDir.x !== -direction.value.x || newDir.y !== -direction.value.y) {
      nextDirection.value = newDir
    }
  }
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  initGame()
  draw()
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (gameInterval) {
    clearInterval(gameInterval)
  }
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="less" scoped>
.snake-game {
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

.score {
  font-size: 20px;
  font-weight: bold;
  color: #ffa502;
}

.game-container {
  border: 3px solid #333;
  border-radius: 8px;
  overflow: hidden;
}

canvas {
  display: block;
}

.tips {
  margin-top: 15px;
  color: var(--text-color-secondary);
  font-size: 14px;
}
</style>
