<template>
  <div class="maze-game">
    <div class="game-content">
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
        <div class="maze-instructions">
          请使用键盘上的 ←↑→↓ 键或 WASD 进行游戏
        </div>
        <div class="maze-wrapper">
          <div 
            class="maze"
            :style="{
              width: `${mazeSize}px`,
              height: `${mazeSize}px`,
              gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              gridTemplateRows: `repeat(${gridSize}, 1fr)`
            }"
          >
            <div 
              v-for="(cell, index) in mazeCells"
              :key="index"
              class="cell"
              :class="{
                'wall': cell === 1,
                'path': cell === 0,
                'start': index === startIndex,
                'end': index === endIndex,
                'player': index === playerIndex,
                'visited': visitedCells.includes(index)
              }"
            >
              <div v-if="index === playerIndex" class="player">🧙</div>
              <div v-if="index === startIndex" class="start-text">start</div>
              <div v-if="index === endIndex" class="end-text">end</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="game-controls">
        <el-button @click="startGame(currentDifficulty)">重新开始</el-button>
      </div>
    </div>
    
    <el-dialog v-model="showHelp" title="操作说明" width="400px">
      <div class="help-content">
        <p>使用 <b>方向键</b> 或 <b>WASD</b> 控制角色移动</p>
        <p>🏁 起点 - 角色位置（左上角）</p>
        <p>🚩 终点 - 到达终点即通关（右下角）</p>
        <p>🧱 墙壁 - 无法穿越</p>
        <p>🟡 黄色 - 已走过的路径</p>
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
import { useRouter } from 'vue-router'
import { ArrowLeft, QuestionFilled } from '@element-plus/icons-vue'
import { useGameStore } from '@/stores/modules/game'

const router = useRouter()
const gameStore = useGameStore()

const difficulties = [
  { value: 'easy', label: '简单', size: 10 },
  { value: 'medium', label: '中等', size: 15 },
  { value: 'hard', label: '困难', size: 20 }
]

const currentDifficulty = ref('easy')
const gridSize = ref(10)
const mazeSize = ref(400)
const mazeCells = ref([])
const visitedCells = ref([])
const playerIndex = ref(0)
const startIndex = ref(0)
const endIndex = ref(0)
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

function goBack() {
  router.push('/game')
}

function getGridSize(difficulty) {
  const diff = difficulties.find(d => d.value === difficulty)
  return diff ? diff.size : 10
}

// 生成迷宫 - 深度优先搜索算法
function generateMaze(size) {
  const maze = Array(size * size).fill(1)
  const stack = []
  
  // 起点
  const start = 0
  maze[start] = 0
  stack.push(start)
  
  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const neighbors = getUnvisitedNeighbors(current, size, maze)
    
    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)]
      const wall = Math.floor((current + next) / 2)
      maze[wall] = 0
      maze[next] = 0
      stack.push(next)
    } else {
      stack.pop()
    }
  }
  
  // 确保终点是路径
  const end = size * size - 1
  maze[end] = 0
  
  // 确保终点周围有路径
  const endX = end % size
  const endY = Math.floor(end / size)
  
  if (endX > 0) maze[end - 1] = 0
  if (endY > 0) maze[end - size] = 0
  
  return maze
}

function getUnvisitedNeighbors(index, size, maze) {
  const neighbors = []
  const x = index % size
  const y = Math.floor(index / size)
  
  // 上
  if (y > 1 && maze[index - size * 2] === 1) {
    neighbors.push(index - size * 2)
  }
  // 下
  if (y < size - 2 && maze[index + size * 2] === 1) {
    neighbors.push(index + size * 2)
  }
  // 左
  if (x > 1 && maze[index - 2] === 1) {
    neighbors.push(index - 2)
  }
  // 右
  if (x < size - 2 && maze[index + 2] === 1) {
    neighbors.push(index + 2)
  }
  
  return neighbors
}

function startGame(difficulty) {
  currentDifficulty.value = difficulty
  gridSize.value = getGridSize(difficulty)
  
  // 生成迷宫
  mazeCells.value = generateMaze(gridSize.value)
  
  // 起点和终点
  startIndex.value = 0
  endIndex.value = gridSize.value * gridSize.value - 1
  
  playerIndex.value = startIndex.value
  visitedCells.value = [startIndex.value]
  
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

function canMove(index) {
  return index >= 0 && index < gridSize.value * gridSize.value && mazeCells.value[index] === 0
}

function movePlayer(direction) {
  if (!isPlaying.value) return
  
  const current = playerIndex.value
  let newIndex = current
  
  if (direction === 'up') newIndex = current - gridSize.value
  else if (direction === 'down') newIndex = current + gridSize.value
  else if (direction === 'left') newIndex = current - 1
  else if (direction === 'right') newIndex = current + 1
  
  if (canMove(newIndex)) {
    playerIndex.value = newIndex
    
    // 添加到已访问路径
    if (!visitedCells.value.includes(newIndex)) {
      visitedCells.value.push(newIndex)
    }
    
    if (newIndex === endIndex.value) {
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

<style lang="less" scoped>
.maze-game {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-color);
}

.game-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-color-secondary);
  border-bottom: 1px solid var(--border-color);
}

.game-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
}

.game-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  overflow: auto;
}

.difficulty-selector {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 15px;
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
  padding: 20px;
  background: var(--bg-color-secondary);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.maze-instructions {
  font-size: 14px;
  color: var(--text-color-muted);
  margin-bottom: 10px;
  text-align: center;
}

.maze-wrapper {
  border: 2px solid #000;
  border-radius: 4px;
  overflow: hidden;
}

.maze {
  display: grid;
  gap: 0;
  background: #000;
}

.cell {
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  position: relative;
  border: none !important;
  outline: none !important;

  > div {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.wall {
    background: #000;
  }

  &.path {
    background: #fff;
  }

  &.start {
    background: #fff;
    position: relative;
  }

  &.end {
    background: #fff;
    position: relative;
  }

  &.player {
    background: #e3f2fd;
    animation: pulse 1s infinite;
  }

  &.visited {
    background: #fff3cd;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.player {
  font-size: 16px;
  z-index: 10;
}

.start-text {
  color: red;
  font-weight: bold;
  font-size: 10px;
}

.end-text {
  color: green;
  font-weight: bold;
  font-size: 10px;
}

.game-controls {
  margin-top: 20px;
  display: flex;
  gap: 15px;
}

.help-content, .win-content {
  text-align: center;

  p {
    margin: 10px 0;
  }
}

.new-record {
  color: #f56c6c;
  font-weight: bold;
  font-size: 18px;
}
</style>
