<template>
  <div class="maze-game">
    <div class="game-header">
      <h3>迷宫小游戏</h3>
      <div class="difficulty-selector">
        <el-button 
          v-for="diff in difficulties" 
          :key="diff.value"
          :type="currentDifficulty === diff.value ? 'primary' : 'default'"
          size="small"
          @click="startGame(diff.value)"
        >
          {{ diff.label }}
        </el-button>
      </div>
    </div>
    
    <div class="game-info">
      <div class="timer">
        <span>用时: {{ formatTime(elapsedTime) }}</span>
      </div>
      <div class="best-time" v-if="bestTime">
        <span>最快记录: {{ formatTime(bestTime) }}</span>
      </div>
    </div>
    
    <div 
      class="maze-container" 
      tabindex="0" 
      @keydown="handleKeydown"
      ref="mazeContainer"
    >
      <div 
        class="maze"
        :style="{
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`
        }"
      >
        <div 
          v-for="(cell, index) in maze" 
          :key="index"
          :class="[
            'cell',
            {
              'wall': cell === 1,
              'path': cell === 0,
              'player': isPlayer(index),
              'start': index === startPos,
              'end': index === endPos
            }
          ]"
        >
          <span v-if="isPlayer(index)" class="player-icon">🧙</span>
          <span v-if="index === startPos" class="flag">🏁</span>
          <span v-if="index === endPos" class="flag">🚩</span>
        </div>
      </div>
    </div>
    
    <div class="game-controls">
      <el-button @click="startGame(currentDifficulty)">重新开始</el-button>
      <el-button @click="showHelp = true">操作说明</el-button>
    </div>
    
    <el-dialog v-model="showHelp" title="操作说明" width="400px">
      <div class="help-content">
        <p>使用 <b>方向键</b> 或 <b>WASD</b> 控制角色移动</p>
        <p>🏁 起点 - 角色位置</p>
        <p>🚩 终点 - 到达终点即通关</p>
        <p>🧱 墙壁 - 无法穿越</p>
      </div>
    </el-dialog>
    
    <el-dialog v-model="showWin" title="恭喜通关！" width="300px">
      <div class="win-content">
        <p>用时: {{ formatTime(elapsedTime) }}</p>
        <p v-if="isNewRecord" class="new-record">🎉 打破记录！</p>
        <p v-else>最快记录: {{ formatTime(bestTime) }}</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="showWin = false; startGame(currentDifficulty)">再来一局</el-button>
        <el-button @click="showWin = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/modules/game'

const gameStore = useGameStore()

const difficulties = [
  { value: 'easy', label: '简单', size: 9 },
  { value: 'medium', label: '中等', size: 13 },
  { value: 'hard', label: '困难', size: 17 }
]

const currentDifficulty = ref('easy')
const gridSize = ref(9)
const maze = ref([])
const playerPos = ref(0)
const startPos = ref(0)
const endPos = ref(0)
const elapsedTime = ref(0)
const timer = ref(null)
const isPlaying = ref(false)
const showHelp = ref(false)
const showWin = ref(false)
const isNewRecord = ref(false)
const mazeContainer = ref(null)

const bestTime = computed(() => {
  return gameStore.getMazeRecord(currentDifficulty.value)
})

function getGridSize(difficulty) {
  const diff = difficulties.find(d => d.value === difficulty)
  return diff ? diff.size : 9
}

function generateMaze(size) {
  const total = size * size
  const maze = new Array(total).fill(1)
  
  function carve(x, y) {
    const idx = y * size + x
    maze[idx] = 0
    
    const directions = [
      [0, -2], [0, 2], [-2, 0], [2, 0]
    ].sort(() => Math.random() - 0.5)
    
    for (const [dx, dy] of directions) {
      const nx = x + dx
      const ny = y + dy
      
      if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && maze[ny * size + nx] === 1) {
        const midX = x + dx / 2
        const midY = y + dy / 2
        maze[midY * size + midX] = 0
        carve(nx, ny)
      }
    }
  }
  
  carve(1, 1)
  
  const endX = size - 2
  const endY = size - 2
  maze[endY * size + endX] = 0
  
  return maze
}

function startGame(difficulty) {
  currentDifficulty.value = difficulty
  gridSize.value = getGridSize(difficulty)
  
  maze.value = generateMaze(gridSize.value)
  
  startPos.value = 1 * gridSize.value + 1
  endPos.value = (gridSize.value - 2) * gridSize.value + (gridSize.value - 2)
  
  playerPos.value = startPos.value
  
  elapsedTime.value = 0
  isPlaying.value = true
  showWin.value = false
  isNewRecord.value = false
  
  if (timer.value) clearInterval(timer.value)
  timer.value = setInterval(() => {
    elapsedTime.value++
  }, 1000)
  
  setTimeout(() => {
    mazeContainer.value?.focus()
  }, 100)
}

function isPlayer(index) {
  return playerPos.value === index
}

function canMove(index) {
  return maze.value[index] === 0
}

function movePlayer(direction) {
  if (!isPlaying.value) return
  
  const size = gridSize.value
  const current = playerPos.value
  const x = current % size
  const y = Math.floor(current / size)
  
  let newX = x
  let newY = y
  
  if (direction === 'up') newY--
  else if (direction === 'down') newY++
  else if (direction === 'left') newX--
  else if (direction === 'right') newX++
  
  if (newX < 0 || newX >= size || newY < 0 || newY >= size) return
  
  const newIdx = newY * size + newX
  if (canMove(newIdx)) {
    playerPos.value = newIdx
    
    if (newIdx === endPos.value) {
      winGame()
    }
  }
}

function handleKeydown(e) {
  const keyMap = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    W: 'up',
    s: 'down',
    S: 'down',
    a: 'left',
    A: 'left',
    d: 'right',
    D: 'right'
  }
  
  const direction = keyMap[e.key]
  if (direction) {
    e.preventDefault()
    movePlayer(direction)
  }
}

function winGame() {
  isPlaying.value = false
  clearInterval(timer.value)
  
  const currentBest = bestTime.value
  if (!currentBest || elapsedTime.value < currentBest) {
    isNewRecord.value = true
    gameStore.saveMazeRecord(currentDifficulty.value, elapsedTime.value)
  }
  
  showWin.value = true
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

onMounted(() => {
  startGame('easy')
})

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value)
})
</script>

<style scoped>
.maze-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.game-header {
  text-align: center;
  margin-bottom: 20px;
}

.game-header h3 {
  margin-bottom: 15px;
}

.difficulty-selector {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.game-info {
  display: flex;
  gap: 30px;
  margin-bottom: 15px;
  font-size: 16px;
}

.timer {
  font-weight: bold;
  color: var(--primary-color);
}

.best-time {
  color: var(--text-color-muted);
}

.maze-container {
  outline: none;
  padding: 10px;
  background: var(--bg-color-secondary);
  border-radius: 8px;
}

.maze {
  display: grid;
  gap: 1px;
  background: #333;
}

.cell {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  position: relative;
}

.cell.wall {
  background: #444;
}

.cell.path {
  background: #f5f5f5;
}

.cell.player {
  background: #e3f2fd;
}

.cell.start {
  background: #c8e6c9;
}

.cell.end {
  background: #ffcdd2;
}

.player-icon {
  font-size: 20px;
}

.flag {
  font-size: 16px;
}

.game-controls {
  margin-top: 20px;
  display: flex;
  gap: 15px;
}

.help-content, .win-content {
  text-align: center;
}

.help-content p {
  margin: 10px 0;
}

.new-record {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
}
</style>
