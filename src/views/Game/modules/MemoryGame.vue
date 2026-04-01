<template>
  <div class="memory-game">
    <div class="game-info-container">
      <div>关卡: <span>{{ level }}</span> | 错误: <span>{{ errorCount }}/3</span> | 得分: <span>{{ score }}</span> | 最高: <span>{{ gameStore.memoryBest }}</span></div>
      <el-button type="primary" @click="startGame">开始游戏</el-button>
    </div>

    <div class="game-container" :class="{ 'game-over': gameOver, 'playing': gameState === 'playing' }">
      <div 
        class="grid"
        :style="{ 
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`
        }"
      >
        <div
          v-for="(item, index) in gridItems"
          :key="index"
          class="cell"
          :class="{ 
            'highlighted': highlightedCells.includes(index),
            'clicked': clickedCells.includes(index),
            'correct': correctCells.includes(index),
            'wrong': wrongCells.includes(index)
          }"
          @click="handleCellClick(index)"
        >
          <span v-if="showNumbers">{{ item }}</span>
        </div>
      </div>

      <div v-if="gameState === 'idle'" class="overlay">
        <button class="start-btn" @click="startGame">开始游戏</button>
      </div>

      <div v-if="gameState === 'success'" class="overlay">
        <div class="message success">正确！进入下一关</div>
      </div>

      <div v-if="gameState === 'showing'" class="countdown-overlay">
        <div class="countdown">{{ countdown }}</div>
      </div>

      <div v-if="gameOver" class="overlay">
        <div class="game-over-content">
          <h3>游戏结束</h3>
          <p>最终关卡: {{ level }}</p>
          <p>最终得分: {{ score }}</p>
          <button class="start-btn" @click="startGame">重新开始</button>
        </div>
      </div>

      <div v-if="gameState === 'success'" class="overlay">
        <div class="message success">正确！进入下一关</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/modules/game'

const gameStore = useGameStore()

const level = ref(1)
const errorCount = ref(0)
const score = ref(0)
const gameState = ref('idle')
const gameOver = ref(false)

const gridSize = computed(() => Math.min(4 + Math.floor((level.value - 1) / 2), 6))
const highlightCount = computed(() => Math.min(2 + Math.floor((level.value - 1) / 2), 8))
const showNumbers = computed(() => level.value <= 3)

const gridItems = ref([])
const targetCells = ref([])
const highlightedCells = ref([])
const clickedCells = ref([])
const correctCells = ref([])
const wrongCells = ref([])
const countdown = ref(3)

let showTimer = null
let countdownTimer = null
let checkTimer = null

function initGrid() {
  const size = gridSize.value
  gridItems.value = Array.from({ length: size * size }, (_, i) => i + 1)
  targetCells.value = []
  highlightedCells.value = []
  clickedCells.value = []
  correctCells.value = []
  wrongCells.value = []
}

function startGame() {
  level.value = 1
  errorCount.value = 0
  score.value = 0
  gameOver.value = false
  gameState.value = 'idle'
  clearTimer()
  initGrid()
  startLevel()
}

function startLevel() {
  gameState.value = 'showing'
  clickedCells.value = []
  correctCells.value = []
  wrongCells.value = []
  countdown.value = 3
  
  const size = gridSize.value
  const totalCells = size * size
  const count = highlightCount.value
  
  const indices = []
  while (indices.length < count) {
    const idx = Math.floor(Math.random() * totalCells)
    if (!indices.includes(idx)) {
      indices.push(idx)
    }
  }
  
  highlightedCells.value = indices
  targetCells.value = [...indices]
  
  countdownTimer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
    }
  }, 1000)
  
  showTimer = setTimeout(() => {
    highlightedCells.value = []
    gameState.value = 'playing'
  }, 3000)
}

function handleCellClick(index) {
  if (gameState.value !== 'playing') return
  if (clickedCells.value.includes(index)) return
  
  clickedCells.value.push(index)
  
  if (targetCells.value.includes(index)) {
    correctCells.value.push(index)
    
    if (correctCells.value.length === targetCells.value.length) {
      score.value += level.value * 10
      gameState.value = 'success'
      correctCells.value = []
      wrongCells.value = []
      
      setTimeout(() => {
        level.value++
        initGrid()
        startLevel()
      }, 1000)
    }
  } else {
    wrongCells.value.push(index)
    errorCount.value++
    
    if (errorCount.value >= 3) {
      gameOver.value = true
      gameState.value = 'idle'
      if (score.value > 0) {
        gameStore.saveMemoryScore(score.value)
      }
    }
  }
}

function clearTimer() {
  if (showTimer) clearTimeout(showTimer)
  if (checkTimer) clearTimeout(checkTimer)
  if (countdownTimer) clearInterval(countdownTimer)
}


onUnmounted(() => {
  clearTimer()
})
</script>

<style lang="less" scoped>
.memory-game {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  height: 100%;
  background: var(--bg-color);
}

.game-container {
  position: relative;
  background: var(--bg-color-secondary);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow);
}

.grid {
  display: grid;
  gap: 10px;
  width: min(80vw, 500px);
  height: min(80vw, 500px);
  position: relative;
  z-index: 1;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-color-secondary);
  border-radius: 12px;
  cursor: pointer;
  font-size: 20px;
  font-weight: bold;
  color: var(--text-color);
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
  user-select: none;

  &:hover {
    background: var(--hover-bg);
    transform: scale(1.05);
  }

  &.highlighted {
    background: var(--primary-color);
    color: #fff;
    box-shadow: 0 0 20px var(--primary-color);
    animation: pulse 0.5s ease-in-out infinite;
  }

  &.clicked {
    opacity: 0.7;
  }

  &.correct {
    background: #4caf50 !important;
    box-shadow: 0 0 15px #4caf50;
  }

  &.wrong {
    background: #f44336 !important;
    box-shadow: 0 0 15px #f44336;
    animation: shake 0.3s ease;
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-color);
  opacity: 0.95;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  z-index: 10;
}

.countdown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  // background: var(--bg-color);
  opacity: 0.8;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.countdown {
  font-size: 80px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 20px #ffd700;
  animation: pulse 1s ease-in-out infinite;
}

.message {
  font-size: 24px;
  font-weight: bold;
  text-align: center;

  &.success {
    color: #4caf50;
    font-size: 28px;
  }
}

.game-over-content {
  text-align: center;

  h3 {
    font-size: 32px;
    color: #f44336;
    margin-bottom: 15px;
  }

  p {
    font-size: 18px;
    margin: 10px 0;
  }
}

.start-btn {
  padding: 15px 40px;
  font-size: 20px;
  font-weight: bold;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow);

  &:hover {
    background: var(--primary-color-end);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}

.game-controls {
  margin-top: 20px;

  button {
    padding: 10px 30px;
    font-size: 16px;
    background: var(--primary-color);
    color: #fff;
    border: 2px solid var(--primary-color);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: var(--primary-color-end);
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}
</style>
