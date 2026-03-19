<template>
  <div class="tools-page">
    <div class="content">
      <div class="tool-section">
        <h3>⏰ 摸鱼倒计时</h3>

        <div class="countdown-display">
          <div class="time">{{ countdownText }}</div>
          <div class="target">目标: {{ targetTime }}</div>
        </div>

        <div class="countdown-controls">
          <div class="input-group">
            <label>目标时间：</label>
            <input type="time" v-model="targetTime" @change="updateCountdown" />
          </div>

          <div class="modes">
            <button
              :class="{ active: mode === 'countdown' }"
              @click="setMode('countdown')"
            >
              倒计时
            </button>
            <button
              :class="{ active: mode === 'pomodoro' }"
              @click="setMode('pomodoro')"
            >
              番茄钟
            </button>
          </div>

          <div v-if="mode === 'pomodoro'" class="pomodoro-settings">
            <button @click="startPomodoro" :disabled="pomodoroRunning">
              {{ pomodoroRunning ? '工作中...' : '开始工作 (25分钟)' }}
            </button>
            <button @click="startBreak" :disabled="breakRunning" class="break-btn">
              {{ breakRunning ? '休息中...' : '开始休息 (5分钟)' }}
            </button>
          </div>

          <div class="actions">
            <button @click="resetCountdown">重置</button>
            <button @click="minimizeToTray" class="minimize-btn">
              最小化到托盘
            </button>
          </div>
        </div>
      </div>

      <div class="tool-section">
        <h3>📋 剪贴板工具</h3>

        <div class="clipboard-header">
          <span>历史记录 ({{ clipboardList.length }})</span>
          <button @click="clearClipboard">清空</button>
        </div>

        <div class="clipboard-list">
          <div
            v-for="(item, index) in clipboardList"
            :key="index"
            class="clipboard-item"
            @click="copyToClipboard(item)"
          >
            {{ item }}
          </div>

          <div v-if="clipboardList.length === 0" class="empty">
            暂无剪贴板历史
          </div>
        </div>

        <div class="tip">
          按 Ctrl+Alt+V 快速打开剪贴板
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'

const targetTime = ref('18:00')
const countdownText = ref('00:00:00')
const mode = ref('countdown')
const pomodoroRunning = ref(false)
const breakRunning = ref(false)
let countdownInterval = null

const remainingSeconds = computed(() => {
  const now = new Date()
  const target = new Date()
  const [hours, minutes] = targetTime.value.split(':').map(Number)
  target.setHours(hours, minutes, 0, 0)

  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }

  return Math.floor((target.getTime() - now.getTime()) / 1000)
})

function updateCountdown() {
  if (mode.value !== 'countdown') return

  const totalSeconds = remainingSeconds.value
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  countdownText.value = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

function startCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
  updateCountdown()
  countdownInterval = window.setInterval(updateCountdown, 1000)
}

function resetCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
  pomodoroRunning.value = false
  breakRunning.value = false
  countdownText.value = '00:00:00'
}

function setMode(newMode) {
  mode.value = newMode
  resetCountdown()
  if (newMode === 'countdown') {
    startCountdown()
  }
}

function startPomodoro() {
  pomodoroRunning.value = true
  breakRunning.value = false
  countdownText.value = '25:00'

  let seconds = 25 * 60
  if (countdownInterval) clearInterval(countdownInterval)

  countdownInterval = window.setInterval(() => {
    seconds--
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    countdownText.value = `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`

    if (seconds <= 0) {
      clearInterval(countdownInterval)
      pomodoroRunning.value = false
      alert('工作时间结束！开始休息吧~')
    }
  }, 1000)
}

function startBreak() {
  breakRunning.value = true
  pomodoroRunning.value = false
  countdownText.value = '05:00'

  let seconds = 5 * 60
  if (countdownInterval) clearInterval(countdownInterval)

  countdownInterval = window.setInterval(() => {
    seconds--
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    countdownText.value = `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`

    if (seconds <= 0) {
      clearInterval(countdownInterval)
      breakRunning.value = false
      alert('休息结束！开始工作吧~')
    }
  }, 1000)
}

async function minimizeToTray() {
  try {
    await invoke('hide_to_tray')
  } catch (e) {
    console.error('最小化失败:', e)
  }
}

const clipboardList = ref([])
const MAX_HISTORY = 50

const sensitiveWords = ['摸鱼', '游戏', '色情', '赌博']

async function readClipboard() {
  try {
    const text = await readText()
    if (text && text.trim()) {
      const isSensitive = sensitiveWords.some(word =>
        text.toLowerCase().includes(word)
      )

      if (!isSensitive) {
        if (clipboardList.value[0] !== text) {
          clipboardList.value.unshift(text)
          if (clipboardList.value.length > MAX_HISTORY) {
            clipboardList.value.pop()
          }
        }
      }
    }
  } catch (e) {
  }
}

async function copyToClipboard(text) {
  try {
    await writeText(text)
    alert('已复制到剪贴板')
  } catch (e) {
    console.error('复制失败:', e)
  }
}

function clearClipboard() {
  clipboardList.value = []
}

let clipboardInterval = null

onMounted(() => {
  startCountdown()
  clipboardInterval = window.setInterval(readClipboard, 1000)
})

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
  if (clipboardInterval) {
    clearInterval(clipboardInterval)
  }
})
</script>

<style scoped>
.tools-page {
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.tool-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.tool-section h3 {
  margin: 0 0 20px;
  color: #333;
}

.countdown-display {
  text-align: center;
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  margin-bottom: 20px;
}

.time {
  font-size: 48px;
  font-weight: bold;
  color: #fff;
  font-family: monospace;
}

.target {
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.8);
}

.countdown-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-group label {
  color: #666;
}

.input-group input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
}

.modes {
  display: flex;
  gap: 10px;
}

.modes button {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.modes button.active {
  background: #667eea;
  color: #fff;
  border-color: #667eea;
}

.pomodoro-settings {
  display: flex;
  gap: 10px;
}

.pomodoro-settings button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 6px;
  background: #4caf50;
  color: #fff;
  cursor: pointer;
}

.pomodoro-settings button.break-btn {
  background: #ff9800;
}

.pomodoro-settings button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.actions {
  display: flex;
  gap: 10px;
}

.actions button {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.actions .minimize-btn {
  background: #667eea;
  color: #fff;
  border: none;
}

.clipboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.clipboard-header span {
  color: #666;
}

.clipboard-header button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #ff6b6b;
  color: #fff;
  cursor: pointer;
}

.clipboard-list {
  max-height: 300px;
  overflow-y: auto;
}

.clipboard-item {
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.clipboard-item:hover {
  background: #f9f9f9;
}

.empty {
  padding: 30px;
  text-align: center;
  color: #888;
}

.tip {
  margin-top: 15px;
  text-align: center;
  color: #888;
  font-size: 12px;
}
</style>
