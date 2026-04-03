<template>
  <div class="reminder-window">
    <div class="reminder-header">
      <div class="reminder-icon">
        <span class="bell-icon">🔔</span>
      </div>
      <div class="reminder-title">{{ reminder?.title }}</div>
    </div>
    <div class="reminder-content">
      {{ reminder?.description || reminder?.message }}
    </div>
    <div class="reminder-time">提醒时间：{{ formatTime(reminder?.time) }}</div>
    <div class="reminder-actions" v-if="reminder">
      <el-input v-model="reminder.snoozeTime" :min="1" :max="60" :step="1" type="number" size="small" style="width: 60px" />
      <el-select v-model="reminder.timeType" size="small" style="width: 60px">
        <el-option label="分钟" value="minute" />
        <el-option label="小时" value="hour" />
      </el-select>
      <el-button size="small" @click="handleSnooze">稍后提醒</el-button>
    </div>
    <el-button size="small" @click="handleClose">朕已阅</el-button>
  </div>
</template>

<script setup>
defineOptions({ name: 'ReminderWindow' })
import { ref, onMounted } from 'vue'
import { emitTo } from '@tauri-apps/api/event'
import moment from 'moment'
import 'moment/locale/zh-cn'

const reminder = ref(null)

onMounted(async () => {
  const hash = window.location.search.slice(1)
  const pathParts = JSON.parse(decodeURIComponent(hash))
  reminder.value = {
    ...pathParts,
    snoozeTime: 10,
    timeType: 'minute'
  }
})

const handleClose = async () => {
  await emitTo('main', 'reminder-action-done', reminder.value)
}

const handleSnooze = async () => {
  await emitTo('main', 'reminder-action-snooze', reminder.value)
}

const formatTime = (time) => {
  if (!time) return ''
  return moment(time).format('HH:mm:ss')
}
</script>

<style lang="less">
.reminder-window {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-end) 100%);
  box-shadow: 0 10px 40px rgba(102, 126, 234, 0.5);
  padding: 16px;
  position: relative;
  overflow: hidden;
}

.reminder-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 16px;
  position: relative;
}

.reminder-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.bell-icon {
  font-size: 22px;
  animation: bell-shake 1s ease-in-out infinite;
}

.reminder-title {
  flex: 1;
  font-size: 18px;
  font-weight: 600;
  color: #fff;
  height: 50px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.reminder-content {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin-bottom: 16px;
  // 多行文本省略号显示
  height: 116px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
}

.reminder-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.reminder-actions {
  margin: 12px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@keyframes bell-shake {
  0%, 100% { transform: rotate(0); }
  10%, 30%, 50%, 70%, 90% { transform: rotate(10deg); }
  20%, 40%, 60%, 80% { transform: rotate(-10deg); }
}
</style>
