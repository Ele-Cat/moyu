<template>
  <div class="countdown-tool">
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
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'

const targetTime = ref('18:00')
const countdownText = ref('00:00:00')
const mode = ref('countdown')
const pomodoroRunning = ref(false)
const breakRunning = ref(false)
let countdownInterval = null

function getRemainingSeconds() {
  const now = new Date()
  const target = new Date()
  const [hours, minutes] = targetTime.value.split(':').map(Number)
  target.setHours(hours, minutes, 0, 0)

  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }

  return Math.floor((target.getTime() - now.getTime()) / 1000)
}

function updateCountdown() {
  if (mode.value !== 'countdown') return

  const totalSeconds = getRemainingSeconds()
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

onMounted(() => {
  startCountdown()
})

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})
</script>

<style lang="less" scoped>
.countdown-tool {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.countdown-display {
  text-align: center;
  padding: 40px 20px;
  background: var(--bg-color-secondary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  margin-bottom: 24px;

  .time {
    font-size: 72px;
    font-weight: bold;
    font-family: 'Courier New', monospace;
    color: var(--text-color);
    margin-bottom: 12px;
  }

  .target {
    font-size: 16px;
    color: var(--text-color-secondary);
  }
}

.countdown-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 12px;

  label {
    font-size: 14px;
    color: var(--text-color);
  }

  input[type="time"] {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-color-secondary);
    color: var(--text-color);
    font-size: 16px;
  }
}

.modes {
  display: flex;
  gap: 12px;

  button {
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-color-secondary);
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;

    &:hover {
      border-color: var(--primary-color);
    }

    &.active {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }
  }
}

.pomodoro-settings {
  display: flex;
  gap: 12px;

  button {
    flex: 1;
    padding: 14px;
    border-radius: 8px;
    border: none;
    background: var(--primary-color);
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;

    &:hover:not(:disabled) {
      opacity: 0.9;
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .break-btn {
    background: var(--success-color);
  }
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;

  button {
    flex: 1;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-color-secondary);
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;

    &:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
  }

  .minimize-btn {
    background: var(--warning-color);
    color: white;
    border-color: var(--warning-color);

    &:hover {
      opacity: 0.9;
    }
  }
}
</style>
