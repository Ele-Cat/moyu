<template>
  <div class="typing-game">
    <div class="game-header">
      <div class="score-board">
        <div class="score-box">
          <div class="label">得分</div>
          <div class="value">{{ score }}</div>
        </div>
        <div class="score-box">
          <div class="label">速度</div>
          <div class="value">{{ speed }} WPM</div>
        </div>
        <div class="score-box">
          <div class="label">最高</div>
          <div class="value">{{ bestWpm }} WPM</div>
        </div>
        <div class="score-box">
          <div class="label">正确率</div>
          <div class="value">{{ accuracy }}%</div>
        </div>
      </div>
      <el-button type="primary" @click="startGame">{{ isRunning ? '重新开始' : '开始游戏' }}</el-button>
    </div>
    
    <div class="game-container" v-if="!isRunning && !currentWord">
      <div class="start-hint">点击"开始游戏"进入打字模式</div>
    </div>
    
    <div class="game-container" v-else>
      <div class="falling-words">
        <div
          v-for="word in fallingWords"
          :key="word.id"
          class="word"
          :class="{ 
            'typing': word.typedIndex > 0,
            'correct': word.typedIndex === word.text.length,
            'error': word.hasError
          }"
          :style="{ top: word.y + 'px', left: word.x + 'px' }"
        >
          <span v-for="(char, i) in word.text" :key="i" :class="{
            'typed': i < word.typedIndex,
            'current': i === word.typedIndex && !word.hasError,
            'error-char': word.hasError && i === word.typedIndex
          }">{{ char }}</span>
        </div>
      </div>
      <div class="input-area">
        <input
          ref="inputRef"
          v-model="inputValue"
          @input="handleInput"
          @keydown="handleKeydown"
          type="text"
          :placeholder="isRunning ? '请输入单词...' : '点击开始游戏'"
          :disabled="!isRunning"
          autofocus
        />
      </div>
    </div>
    
    <div class="tips">输入正确的单词即可消除，速度会越来越快！</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/modules/game'

const gameStore = useGameStore()

const score = ref(0)
const speed = ref(0)
const accuracy = ref(100)
const isRunning = ref(false)
const inputValue = ref('')
const inputRef = ref(null)
const currentWord = ref('')
const bestWpm = ref(0)

const fallingWords = ref([])
let wordId = 0
let gameInterval = null
let speedInterval = null
let startTime = null
let totalChars = ref(0)
let correctChars = ref(0)

const WORD_LIST = [
  'hello', 'world', 'javascript', 'python', 'coding', 'typing', 'game', 'keyboard',
  'mouse', 'screen', 'window', 'apple', 'banana', 'orange', 'grape', 'melon',
  'water', 'fire', 'earth', 'wind', 'cloud', 'rain', 'snow', 'sun', 'moon',
  'star', 'night', 'morning', 'evening', 'today', 'tomorrow', 'yesterday',
  'happy', 'smile', 'laugh', 'cry', 'dream', 'hope', 'love', 'peace', 'joy',
  'music', 'dance', 'sing', 'song', 'book', 'read', 'write', 'study', 'learn',
  'work', 'play', 'rest', 'sleep', 'wake', 'walk', 'run', 'jump', 'fly',
  'bird', 'fish', 'cat', 'dog', 'horse', 'tiger', 'lion', 'elephant', 'monkey',
  'rose', 'flower', 'tree', 'grass', 'leaf', 'garden', 'forest', 'beach', 'ocean',
  'mountain', 'river', 'lake', 'sea', 'sky', 'space', 'planet', 'rocket', 'astronaut',
  'computer', 'internet', 'website', 'browser', 'server', 'database', 'network',
  'function', 'variable', 'object', 'array', 'string', 'number', 'boolean',
  'import', 'export', 'return', 'switch', 'while', 'break', 'continue', 'class',
  'method', 'public', 'private', 'static', 'const', 'let', 'async', 'await'
]

const LEVELS = [
  { words: ['hello', 'world', 'game', 'play', 'jump', 'run', 'cat', 'dog', 'sun', 'moon'], speed: 2 },
  { words: ['apple', 'water', 'happy', 'music', 'dance', 'sleep', 'dream', 'smile'], speed: 2.5 },
  { words: ['coding', 'typing', 'keyboard', 'screen', 'window', 'flower', 'garden'], speed: 3 },
  { words: ['javascript', 'python', 'computer', 'internet', 'browser', 'website'], speed: 3.5 },
  { words: ['function', 'variable', 'object', 'array', 'import', 'export', 'async'], speed: 4 },
  { words: ['everything', 'beautiful', 'wonderful', 'amazing', 'fantastic', 'awesome'], speed: 5 }
]

function spawnWord() {
  const levelIndex = Math.min(Math.floor(score.value / 500), LEVELS.length - 1)
  const level = LEVELS[levelIndex]
  const text = level.words[Math.floor(Math.random() * level.words.length)]
  
  const gameContainer = document.querySelector('.game-container')
  if (!gameContainer) return
  
  const maxX = gameContainer.clientWidth - 100
  
  fallingWords.value.push({
    id: wordId++,
    text,
    x: Math.random() * maxX,
    y: -30,
    typedIndex: 0,
    hasError: false,
    speed: level.speed
  })
}

function updateWords() {
  if (!isRunning.value) return
  
  fallingWords.value = fallingWords.value.filter(word => {
    word.y += word.speed
    
    if (word.y > 500) {
      return false
    }
    return true
  })
  
  if (Math.random() < 0.02) {
    spawnWord()
  }
}

function handleInput() {
  if (!isRunning.value) return
  
  const input = inputValue.value.trim().toLowerCase()
  
  for (const word of fallingWords.value) {
    if (input === word.text) {
      score.value += word.text.length * 10
      totalChars.value += word.text.length
      correctChars.value += word.text.length
      
      fallingWords.value = fallingWords.value.filter(w => w.id !== word.id)
      inputValue.value = ''
      updateAccuracy()
      return
    }
    
    if (word.text.startsWith(input) && input.length > 0) {
      word.typedIndex = input.length
      word.hasError = false
    } else if (input.length > 0 && !word.text.startsWith(input)) {
      word.hasError = true
    }
  }
  
  updateAccuracy()
}

function handleKeydown(e) {
  if (e.key === 'Escape') {
    inputValue.value = ''
    fallingWords.value.forEach(word => {
      word.typedIndex = 0
      word.hasError = false
    })
  }
}

function updateAccuracy() {
  if (totalChars.value === 0) {
    accuracy.value = 100
  } else {
    accuracy.value = Math.round((correctChars.value / totalChars.value) * 100)
  }
}

function updateSpeed() {
  if (!startTime || !isRunning.value) return
  
  const elapsed = (Date.now() - startTime) / 1000 / 60
  if (elapsed > 0) {
    const charsPerMinute = (correctChars.value / 5) / elapsed
    speed.value = Math.round(charsPerMinute)
  }
}

function startGame() {
  fallingWords.value = []
  score.value = 0
  speed.value = 0
  accuracy.value = 100
  inputValue.value = ''
  totalChars.value = 0
  correctChars.value = 0
  startTime = Date.now()
  isRunning.value = true
  
  for (let i = 0; i < 3; i++) {
    setTimeout(spawnWord, i * 500)
  }
  
  if (gameInterval) clearInterval(gameInterval)
  gameInterval = setInterval(updateWords, 50)
  
  if (speedInterval) clearInterval(speedInterval)
  speedInterval = setInterval(updateSpeed, 1000)
  
  inputRef.value?.focus()
}

onMounted(() => {
  if (gameStore.typingBest) {
    bestWpm.value = gameStore.typingBest.wpm
  }
})

onUnmounted(() => {
  if (gameInterval) clearInterval(gameInterval)
  if (speedInterval) clearInterval(speedInterval)
  if (speed.value > 0) {
    gameStore.saveTypingScore({ wpm: speed.value, accuracy: accuracy.value })
  }
})
</script>

<style lang="less" scoped>
.typing-game {
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
  min-width: 60px;

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

.game-container {
  position: relative;
  width: 600px;
  height: 400px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  border: 3px solid #333;
  overflow: hidden;
}

.start-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #666;
  font-size: 18px;
}

.falling-words {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - 60px);
}

.word {
  position: absolute;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  transition: transform 0.1s;

  &.typing {
    background: rgba(255, 193, 7, 0.8);
    color: #000;
  }

  &.correct {
    background: rgba(40, 167, 69, 0.8);
  }

  &.error {
    background: rgba(220, 53, 69, 0.8);
    animation: shake 0.3s;
  }

  .typed {
    color: inherit;
  }

  .current {
    text-decoration: underline;
    text-decoration-color: #fff;
  }

  .error-char {
    color: #ff0000;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.input-area {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;

  input {
    width: 100%;
    max-width: 400px;
    padding: 10px 20px;
    font-size: 18px;
    border: 2px solid #4ecdc4;
    border-radius: 25px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    outline: none;

    &::placeholder {
      color: #666;
    }

    &:focus {
      border-color: #ff6b6b;
      box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
    }
  }
}

.tips {
  margin-top: 15px;
  color: var(--text-color-secondary);
  font-size: 14px;
}
</style>
