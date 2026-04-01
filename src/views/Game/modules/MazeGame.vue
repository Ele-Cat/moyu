<template>
  <div class="maze-runner">
    <div class="game-info-container">
      时间:<span>{{ formatTime(elapsedTime) }}</span>
    </div>
    
    <div class="controls-row">
      <el-select v-model="currentDifficulty" @change="handleDifficultyChange" placeholder="选择难度" style="width: 180px;">
        <el-option :value="10" label="Easy (10x10)" />
        <el-option :value="15" label="Medium (15x15)" />
        <el-option :value="20" label="Hard (20x20)" />
        <el-option :value="30" label="Very Hard (30x30)" />
      </el-select>
      <el-button type="primary" @click="startGame">
        {{ isGameStarted ? '重新开始' : '开始游戏' }}
      </el-button>
    </div>

    <div class="best-time" v-if="bestTime">
      <span>最快记录: {{ formatTime(bestTime) }}</span>
    </div>
    
    <div class="canvas-container">
      <canvas ref="canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { h, ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useGameStore } from '@/stores/modules/game'

const gameStore = useGameStore()

const canvas = ref(null)
const currentDifficulty = ref(10)
const elapsedTime = ref(0)
const timer = ref(null)
const isPlaying = ref(false)
const isGameStarted = ref(false)
const isTimerStarted = ref(false)
const isNewRecord = ref(false)

let ctx = null
let maze = null
let player = null
let mazeHeight = 0
let mazeWidth = 0
const mazeOffset = 10
let cellSize = 50

const difficultyText = computed(() => {
  const map = { 10: 'Easy', 15: 'Medium', 20: 'Hard', 30: 'Very Hard' }
  return map[currentDifficulty.value] || 'Easy'
})

const bestTime = computed(() => {
  return gameStore.getMazeRecord(currentDifficulty.value.toString())
})

class Cell {
  constructor(column, row) {
    this.column = column
    this.row = row
    this.wallTop = true
    this.wallRight = true
    this.wallBottom = true
    this.wallLeft = true
    this.visited = false
  }
}

class Player {
  constructor() {
    this.column = 0
    this.row = 0
    this.color = '#2e7d32'
  }
}

class Maze {
  constructor(columns, rows, cellSize) {
    this.columns = columns
    this.rows = rows
    this.cellSize = cellSize
    this.finishColor = '#dc143c'
    this.backgroundColor = '#dcdcdc'
    this.cells = []
    this.createMaze()
  }

  createMaze() {
    mazeHeight = this.cellSize * this.rows
    mazeWidth = this.cellSize * this.columns

    canvas.value.height = mazeHeight + (mazeOffset * 2)
    canvas.value.width = mazeWidth + (mazeOffset * 2)
    
    ctx = canvas.value.getContext('2d')

    for (let i = 0; i < this.columns; i++) {
      this.cells[i] = []
      for (let j = 0; j < this.rows; j++) {
        this.cells[i][j] = new Cell(i, j)
      }
    }

    const stack = []
    const randomColumn = getRandomNumber(this.columns)
    const randomRow = getRandomNumber(this.rows)

    stack.push(this.cells[randomColumn][randomRow])

    let currentCell
    let nextCell
    let neighbour
    let option

    while (this.hasAnyUnvisitedCells()) {
      currentCell = stack[stack.length - 1]
      currentCell.visited = true

      if (this.hasAnyUnvisitedNeighbours(currentCell)) {
        nextCell = null
        neighbour = false
        do {
          option = getRandomNumber(4)
          switch (option) {
            case 0:
              if (currentCell.row !== 0 && !this.cells[currentCell.column][currentCell.row - 1].visited) {
                currentCell.wallTop = false
                nextCell = this.cells[currentCell.column][currentCell.row - 1]
                nextCell.wallBottom = false
                neighbour = true
              }
              break
            case 1:
              if (currentCell.column !== (this.columns - 1) && !this.cells[currentCell.column + 1][currentCell.row].visited) {
                currentCell.wallRight = false
                nextCell = this.cells[currentCell.column + 1][currentCell.row]
                nextCell.wallLeft = false
                neighbour = true
              }
              break
            case 2:
              if (currentCell.row !== (this.rows - 1) && !this.cells[currentCell.column][currentCell.row + 1].visited) {
                currentCell.wallBottom = false
                nextCell = this.cells[currentCell.column][currentCell.row + 1]
                nextCell.wallTop = false
                neighbour = true
              }
              break
            case 3:
              if (currentCell.column !== 0 && !this.cells[currentCell.column - 1][currentCell.row].visited) {
                currentCell.wallLeft = false
                nextCell = this.cells[currentCell.column - 1][currentCell.row]
                nextCell.wallRight = false
                neighbour = true
              }
              break
          }
          if (neighbour) {
            stack.push(nextCell)
          }
        } while (!neighbour)
      } else {
        stack.pop()
      }
    }

    this.drawMaze()
  }

  hasAnyUnvisitedCells() {
    for (let i = 0; i < this.columns; i++) {
      for (let j = 0; j < this.rows; j++) {
        if (!this.cells[i][j].visited) {
          return true
        }
      }
    }
    return false
  }

  hasAnyUnvisitedNeighbours(cell) {
    return (
      (cell.column !== 0 && !this.cells[cell.column - 1][cell.row].visited) ||
      (cell.column !== (this.columns - 1) && !this.cells[cell.column + 1][cell.row].visited) ||
      (cell.row !== 0 && !this.cells[cell.column][cell.row - 1].visited) ||
      (cell.row !== (this.rows - 1) && !this.cells[cell.column][cell.row + 1].visited)
    )
  }

  drawMaze() {
    ctx.fillStyle = this.backgroundColor
    ctx.fillRect(mazeOffset, mazeOffset, mazeHeight, mazeWidth)

    ctx.fillStyle = this.finishColor
    ctx.fillRect(
      mazeOffset + ((this.columns - 1) * this.cellSize) + 4,
      mazeOffset + ((this.rows - 1) * this.cellSize) + 4,
      this.cellSize - 8,
      this.cellSize - 8
    )

    ctx.strokeStyle = '#2c3e50'
    ctx.lineWidth = 2

    for (let i = 0; i < this.columns; i++) {
      for (let j = 0; j < this.rows; j++) {
        if (this.cells[i][j].wallRight) {
          ctx.beginPath()
          ctx.moveTo(mazeOffset + ((i + 1) * this.cellSize), mazeOffset + (j * this.cellSize))
          ctx.lineTo(mazeOffset + ((i + 1) * this.cellSize), mazeOffset + ((j + 1) * this.cellSize))
          ctx.stroke()
        }
        if (this.cells[i][j].wallBottom) {
          ctx.beginPath()
          ctx.moveTo(mazeOffset + (i * this.cellSize), mazeOffset + ((j + 1) * this.cellSize))
          ctx.lineTo(mazeOffset + ((i + 1) * this.cellSize), mazeOffset + ((j + 1) * this.cellSize))
          ctx.stroke()
        }
        if (this.cells[i][j].wallLeft) {
          ctx.beginPath()
          ctx.moveTo(mazeOffset + (i * this.cellSize), mazeOffset + (j * this.cellSize))
          ctx.lineTo(mazeOffset + (i * this.cellSize), mazeOffset + ((j + 1) * this.cellSize))
          ctx.stroke()
        }
        if (this.cells[i][j].wallTop) {
          ctx.beginPath()
          ctx.moveTo(mazeOffset + (i * this.cellSize), mazeOffset + (j * this.cellSize))
          ctx.lineTo(mazeOffset + ((i + 1) * this.cellSize), mazeOffset + (j * this.cellSize))
          ctx.stroke()
        }
      }
    }

    this.drawPlayer()
  }

  drawPlayer() {
    ctx.fillStyle = player.color
    ctx.fillRect(
      mazeOffset + (player.column * this.cellSize) + 4,
      mazeOffset + (player.row * this.cellSize) + 4,
      this.cellSize - 8,
      this.cellSize - 8
    )
  }

  checkForVictory() {
    if (player.column === this.columns - 1 && player.row === this.rows - 1) {
      if (timer.value) {
        clearInterval(timer.value)
        timer.value = null
      }
      isPlaying.value = false
      isTimerStarted.value = false
      
      const currentBest = bestTime.value
      if (!currentBest || elapsedTime.value < currentBest) {
        isNewRecord.value = true
        gameStore.saveMazeRecord(currentDifficulty.value.toString(), elapsedTime.value)
      } else {
        isNewRecord.value = false
      }
      
      ElMessageBox({
        title: '恭喜通关! 👑',
        center: true,
        message: h('div', null, [
          h('p', null, `难度: ${difficultyText.value}`),
          h('p', null, `用时: ${formatTime(elapsedTime.value)}`),
          h('p', null, isNewRecord.value ? `🎉 新纪录!` : `最快记录: ${formatTime(bestTime.value)}`),
        ]),
        showCancelButton: true,
        cancelButtonText: '关闭',
        confirmButtonText: '再来一局',
        confirmButtonType: 'success',
      }).then(() => {
        startGame()
      })
    }
  }
}

function getRandomNumber(range) {
  return Math.floor(Math.random() * range)
}

function handleDifficultyChange() {
  startGame()
}

function startGame() {
  switch (currentDifficulty.value) {
    case 10:
      cellSize = 36
      break
    case 15:
      cellSize = 28
      break
    case 20:
      cellSize = 22
      break
    case 30:
      cellSize = 15
      break
  }

  player = new Player()
  maze = new Maze(currentDifficulty.value, currentDifficulty.value, cellSize)

  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }

  elapsedTime.value = 0
  isPlaying.value = true
  isGameStarted.value = true
  isTimerStarted.value = false
  isNewRecord.value = false
}

function startTimer() {
  if (isTimerStarted.value) return
  isTimerStarted.value = true
  timer.value = setInterval(() => {
    elapsedTime.value++
  }, 1000)
}

function handleKeydown(e) {
  if (!isPlaying.value || !maze) return

  const keyMap = {
    37: 'left',
    65: 'left',
    38: 'up',
    87: 'up',
    39: 'right',
    68: 'right',
    40: 'down',
    83: 'down'
  }

  const direction = keyMap[e.keyCode]
  if (direction) {
    e.preventDefault()

    startTimer()

    const cell = maze.cells[player.column][player.row]

    if (direction === 'left' && !cell.wallLeft) {
      player.column -= 1
    } else if (direction === 'right' && !cell.wallRight) {
      player.column += 1
    } else if (direction === 'up' && !cell.wallTop) {
      player.row -= 1
    } else if (direction === 'down' && !cell.wallBottom) {
      player.row += 1
    }

    maze.checkForVictory()
    maze.drawMaze()
  }
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  document.addEventListener('keydown', handleKeydown)
  startGame()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (timer.value) {
    clearInterval(timer.value)
  }
})
</script>

<style lang="less" scoped>
.maze-runner {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: var(--bg-color);

  .controls-row {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .best-time {
    margin-bottom: 10px;
    font-size: 14px;
    color: var(--text-color-muted);
  }

  .canvas-container {
    display: flex;
    justify-content: center;
    align-items: center;

    canvas {
      border: 3px solid #2c3e50;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
}
</style>
