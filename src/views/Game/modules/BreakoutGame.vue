<template>
  <div class="breakout-game">
    <div class="game-header">
      <h2>🎮 打砖块</h2>
      <div class="score">得分: {{ score }}</div>
      <div class="game-btns">
        <el-button type="primary" size="small" @click="startGame">{{ isRunning ? '重新开始' : '开始游戏' }}</el-button>
      </div>
    </div>
    <div class="game-container">
      <canvas ref="canvas" width="400" height="500"></canvas>
    </div>
    <div class="tips">← → 或 A D 控制挡板</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref(null)
const score = ref(0)
const isRunning = ref(false)

let ctx = null
let animationId = null

const paddle = {
  x: 150,
  y: 470,
  width: 80,
  height: 12,
  speed: 8,
  dx: 0
}

const ball = {
  x: 200,
  y: 250,
  radius: 8,
  speed: 4,
  dx: 3,
  dy: -3
}

const bricks = []
const brickRowCount = 6
const brickColumnCount = 8
const brickWidth = 45
const brickHeight = 18
const brickPadding = 5
const brickOffsetTop = 40
const brickOffsetLeft = 10

let rightPressed = false
let leftPressed = false

function initBricks() {
  bricks.length = 0
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = []
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 }
    }
  }
}

function drawBall() {
  ctx.beginPath()
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
  ctx.fillStyle = '#ff6b6b'
  ctx.fill()
  ctx.closePath()
}

function drawPaddle() {
  ctx.beginPath()
  ctx.roundRect(paddle.x, paddle.y, paddle.width, paddle.height, 6)
  ctx.fillStyle = '#4ecdc4'
  ctx.fill()
  ctx.closePath()
}

function drawBricks() {
  const colors = ['#ff6b6b', '#ffa502', '#ffeaa7', '#55efc4', '#74b9ff', '#a29bfe']
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft
        const brickY = r * (brickHeight + brickPadding) + brickOffsetTop
        bricks[c][r].x = brickX
        bricks[c][r].y = brickY
        ctx.beginPath()
        ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 4)
        ctx.fillStyle = colors[r % colors.length]
        ctx.fill()
        ctx.closePath()
      }
    }
  }
}

function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r]
      if (b.status === 1) {
        if (ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
          ball.dy = -ball.dy
          b.status = 0
          score.value += 10
          if (score.value === brickRowCount * brickColumnCount * 10) {
            gameOver(true)
          }
        }
      }
    }
  }
}

function draw() {
  if (!ctx) return
  
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  drawBricks()
  drawBall()
  drawPaddle()
  collisionDetection()
  
  if (ball.x + ball.dx > canvas.value.width - ball.radius || ball.x + ball.dx < ball.radius) {
    ball.dx = -ball.dx
  }
  
  if (ball.y + ball.dy < ball.radius) {
    ball.dy = -ball.dy
  } else if (ball.y + ball.dy > canvas.value.height - ball.radius - paddle.height) {
    if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
      const hitPoint = (ball.x - paddle.x) / paddle.width
      ball.dx = (hitPoint - 0.5) * 8
      ball.dy = -ball.dy * 1.02
    } else if (ball.y + ball.dy > canvas.value.height - ball.radius) {
      gameOver(false)
      return
    }
  }
  
  ball.x += ball.dx
  ball.y += ball.dy
  
  if (rightPressed && paddle.x < canvas.value.width - paddle.width) {
    paddle.x += paddle.speed
  } else if (leftPressed && paddle.x > 0) {
    paddle.x -= paddle.speed
  }
  
  if (isRunning.value) {
    animationId = requestAnimationFrame(draw)
  }
}

function startGame() {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  score.value = 0
  ball.x = 200
  ball.y = 250
  ball.dx = 3
  ball.dy = -3
  paddle.x = 150
  initBricks()
  isRunning.value = true
  draw()
}

function gameOver(win) {
  isRunning.value = false
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  
  if (win) {
    alert('🎉 恭喜通关！得分: ' + score.value)
  }
}

function keyDownHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    rightPressed = true
  } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    leftPressed = true
  }
}

function keyUpHandler(e) {
  if (e.key === 'Right' || e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    rightPressed = false
  } else if (e.key === 'Left' || e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    leftPressed = false
  }
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  initBricks()
  draw()
  document.addEventListener('keydown', keyDownHandler)
  document.addEventListener('keyup', keyUpHandler)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  document.removeEventListener('keydown', keyDownHandler)
  document.removeEventListener('keyup', keyUpHandler)
})
</script>

<style lang="less" scoped>
.breakout-game {
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
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.tips {
  margin-top: 15px;
  color: var(--text-color-secondary);
  font-size: 14px;
}
</style>
