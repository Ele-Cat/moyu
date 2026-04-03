<template>
  <div class="todo-reminder">
    <div class="todo-header">
      <!-- <el-button type="primary" size="small" :icon="Close" @click="closeAllReminderWindows">
        关闭所有提醒
      </el-button> -->
      <el-button type="primary" size="small" :icon="Plus" @click="openAddDialog">
        添加待办
      </el-button>
    </div>
    <el-tabs v-model="activeTab" class="todo-tabs">
      <el-tab-pane label="待办列表" name="pending">
        <el-scrollbar class="todo-scrollbar">
          <div v-if="filteredTodos.length === 0" class="empty-tip">
            <el-empty description="暂无待办任务" />
          </div>

          <div v-else class="todo-card-list">
            <TodoCard 
              v-for="todo in filteredTodos" 
              :key="todo.id" 
              :todo="todo"
              @edit="editTodo"
              @delete="handleDeleteTodo"
            />
          </div>
        </el-scrollbar>
      </el-tab-pane>

      <el-tab-pane label="历史待办" name="history">
        <el-scrollbar class="history-scrollbar">
          <div v-if="historyTodos.length === 0" class="empty-tip">
            <el-empty description="暂无历史记录" />
          </div>

          <div v-else class="todo-card-list">
            <TodoCard 
              v-for="todo in historyTodos" 
              :key="todo.id + '-' + todo.completedAt" 
              :todo="todo"
              :is-history="true"
              @delete="deleteHistoryTodo"
            />
          </div>
        </el-scrollbar>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加/编辑待办对话框 -->
    <el-dialog 
      v-model="showDialog" 
      :title="editingTodo ? '编辑待办' : '添加待办'" 
      width="500px"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="待办任务" prop="title">
          <el-input v-model="formData.title" maxlength="20" placeholder="请输入待办任务" />
        </el-form-item>
        <el-form-item label="待办详情">
          <el-input 
            v-model="formData.description" 
            type="textarea" 
            maxlength="80"
            placeholder="请输入待办详情" 
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="显示位置">
          <el-radio-group v-model="formData.position">
            <el-radio-button value="top-left">左上角</el-radio-button>
            <el-radio-button value="top-right">右上角</el-radio-button>
            <el-radio-button value="bottom-left">左下角</el-radio-button>
            <el-radio-button value="bottom-right">右下角</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="运行方式">
          <el-radio-group v-model="formData.runMode">
            <el-radio value="time">指定时间</el-radio>
            <el-tooltip content="CRON表达式是一种定时任务配置格式，如：*/5 * * * * 表示每5分钟执行一次" popper-style="width: 200px" placement="top-start">
              <el-radio value="cron">CRON表达式</el-radio>
            </el-tooltip>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="指定时间" prop="scheduleTime" v-if="formData.runMode === 'time'">
          <el-date-picker
            v-model="formData.scheduleTime"
            type="datetime"
            placeholder="选择日期时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
        <template v-else>
          <el-form-item label="CRON表达式" prop="cronExpression">
            <el-input v-model="formData.cronExpression" placeholder="请输入CRON表达式" />
          </el-form-item>
          <div class="cron-builder">
            <div style="font-size: 12px;">
              未来执行提醒时间：<p v-for="item in getCronNextTimes(formData.cronExpression, 2)">{{ item }}</p>
              <el-tooltip popper-style="width: 200px" placement="right-start">
                <template #content>
                  <p v-for="item in getCronNextTimes(formData.cronExpression, 8)">{{ item }}</p>
                  ...
                </template>
                更多
              </el-tooltip>
            </div>
            <el-collapse v-if="formData.runMode === 'cron'" v-model="showCronBuilder" accordion class="cron-collapse">
              <el-collapse-item title="配置CRON" name="builder">
                <el-form :model="cronForm" label-width="60px">
                  <el-form-item label="分钟">
                    <el-select v-model="cronForm.minute" style="width: 120px" @change="updateCronExpression">
                      <el-option label="每分钟" value="*" />
                      <el-option label="每5分钟" value="*/5" />
                      <el-option label="每10分钟" value="*/10" />
                      <el-option label="每15分钟" value="*/15" />
                      <el-option label="每30分钟" value="*/30" />
                      <el-option label="特定分钟" value="custom" />
                    </el-select>
                    <el-input 
                      v-if="cronForm.minute === 'custom'" 
                      v-model="cronForm.minuteValue" 
                      @change="updateCronExpression"
                      placeholder="如：0,15,30,45"
                      style="width: 120px; margin-left: 10px"
                    />
                  </el-form-item>
                  <el-form-item label="小时">
                    <el-select v-model="cronForm.hour" style="width: 120px" @change="updateCronExpression">
                      <el-option label="每小时" value="*" />
                      <el-option label="每6小时" value="*/6" />
                      <el-option label="每12小时" value="*/12" />
                      <el-option label="特定小时" value="custom" />
                    </el-select>
                    <el-input 
                      v-if="cronForm.hour === 'custom'" 
                      v-model="cronForm.hourValue" 
                      @change="updateCronExpression"
                      placeholder="如：9,12,18"
                      style="width: 120px; margin-left: 10px"
                    />
                  </el-form-item>
                  <el-form-item label="日期">
                    <el-select v-model="cronForm.day" style="width: 120px" @change="updateCronExpression">
                      <el-option label="每天" value="*" />
                      <el-option label="工作日" value="1-5" />
                      <el-option label="特定日期" value="custom" />
                    </el-select>
                    <el-input 
                      v-if="cronForm.day === 'custom'" 
                      v-model="cronForm.dayValue" 
                      @change="updateCronExpression"
                      placeholder="如：1,15"
                      style="width: 120px; margin-left: 10px"
                    />
                  </el-form-item>
                  <el-form-item label="月份">
                    <el-select v-model="cronForm.month" style="width: 120px" @change="updateCronExpression">
                      <el-option label="每月" value="*" />
                      <el-option label="特定月份" value="custom" />
                    </el-select>
                    <el-input 
                      v-if="cronForm.month === 'custom'" 
                      v-model="cronForm.monthValue" 
                      @change="updateCronExpression"
                      placeholder="如：1,3,5"
                      style="width: 120px; margin-left: 10px"
                    />
                  </el-form-item>
                  <el-form-item label="星期">
                    <el-select v-model="cronForm.weekday" style="width: 120px" @change="updateCronExpression">
                      <el-option label="每天" value="*" />
                      <el-option label="周末" value="6,0" />
                      <el-option label="特定星期" value="custom" />
                    </el-select>
                    <el-input 
                      v-if="cronForm.weekday === 'custom'" 
                      v-model="cronForm.weekdayValue" 
                      @change="updateCronExpression"
                      placeholder="如：1,3,5"
                      style="width: 120px; margin-left: 10px"
                    />
                  </el-form-item>
                </el-form>
              </el-collapse-item>
            </el-collapse>
          </div>
        </template>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDialog = false">取消</el-button>
          <el-button type="primary" @click="saveTodo">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
defineOptions({ name: 'TodoReminder' })
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import moment from 'moment'
import 'moment/locale/zh-cn'
import todoWorker from './todoWorker.js?worker'
import { useReminderStore } from '@/stores/modules/reminder'
import { useReminder } from '@/hooks/useReminder'
import TodoCard from '@/views/Tools/Components/TodoCard.vue'
import { getCronNextTimes } from '@/utils/util'

const reminderStore = useReminderStore()
const { openReminderWindow, closeAllReminderWindows, setOnReminderDoneCallback } = useReminder()

const onReminderDone = (reminder) => {
  if (worker) {
    worker.postMessage({ type: 'closedReminder', data: { id: reminder.id } })
  }
}

const activeTab = ref('pending')
const showDialog = ref(false)
const showCronBuilder = ref('builder')
const editingTodo = ref(null)
const formRef = ref(null)

const formData = ref({
  title: '',
  description: '',
  runMode: 'time',
  position: 'bottom-right',
  scheduleTime: moment().format('YYYY-MM-DD HH:mm:ss'),
  cronExpression: '* * * * *',
  status: 'pending'
})

const cronForm = ref({
  minute: '*',
  minuteValue: '',
  hour: '*',
  hourValue: '',
  day: '*',
  dayValue: '',
  month: '*',
  monthValue: '',
  weekday: '*',
  weekdayValue: ''
})

const cronRegex = /^(\*|(\d+(-\d+)?)(,\d+(-\d+)?)*)(\/(\d+))?\s+(\*|(\d+(-\d+)?)(,\d+(-\d+)?)*)(\/(\d+))?\s+(\*|(\d+(-\d+)?)(,\d+(-\d+)?)*)(\/(\d+))?\s+(\*|(\d+(-\d+)?)(,\d+(-\d+)?)*)(\/(\d+))?\s+(\*|(\d+(-\d+)?)(,\d+(-\d+)?)*)(\/(\d+))?$/

const validateCron = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请输入CRON表达式'))
    return
  }
  
  const parts = value.trim().split(/\s+/)
  if (parts.length !== 5) {
    callback(new Error('CRON表达式需要5个字段'))
    return
  }
  
  if (!cronRegex.test(value)) {
    callback(new Error('CRON格式不正确'))
    return
  }
  
  const [minute, hour, day, month, weekday] = parts
  
  const minuteValid = validateField(minute, 0, 59)
  const hourValid = validateField(hour, 0, 23)
  const dayValid = validateField(day, 1, 31)
  const monthValid = validateField(month, 1, 12)
  const weekdayValid = validateField(weekday, 0, 6)
  
  if (!minuteValid) {
    callback(new Error('分钟范围应为0-59'))
    return
  }
  if (!hourValid) {
    callback(new Error('小时范围应为0-23'))
    return
  }
  if (!dayValid) {
    callback(new Error('日期范围应为1-31'))
    return
  }
  if (!monthValid) {
    callback(new Error('月份范围应为1-12'))
    return
  }
  if (!weekdayValid) {
    callback(new Error('星期范围应为0-6'))
    return
  }
  
  callback()
}

const validateField = (field, min, max) => {
  if (field === '*') return true
  
  const stepOnlyMatch = field.match(/^\*\/(\d+)$/)
  if (stepOnlyMatch) {
    const step = parseInt(stepOnlyMatch[1])
    return step > 0 && step <= (max - min + 1)
  }
  
  const stepMatch = field.match(/^(\d+)-(\d+)\/(\d+)$/)
  if (stepMatch) {
    const start = parseInt(stepMatch[1])
    const end = parseInt(stepMatch[2])
    const step = parseInt(stepMatch[3])
    return start >= min && end <= max && step > 0 && start <= end
  }
  
  const rangeMatch = field.match(/^(\d+)-(\d+)$/)
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1])
    const end = parseInt(rangeMatch[2])
    return start >= min && end <= max && start <= end
  }
  
  const listMatch = field.match(/^(\d+,)*\d+$/)
  if (listMatch) {
    const values = field.split(',').map(Number)
    return values.every(v => v >= min && v <= max)
  }
  
  const singleMatch = field.match(/^\d+$/)
  if (singleMatch) {
    const value = parseInt(field)
    return value >= min && value <= max
  }
  
  return false
}

const rules = {
  title: [{ required: true, message: '请输入待办任务', trigger: 'blur' }],
  scheduleTime: [
    { required: true, message: '请选择指定时间', trigger: 'change' }
  ],
  cronExpression: [
    { required: true, message: '请输入CRON表达式', trigger: 'blur' },
    { validator: validateCron, trigger: 'blur' }
  ]
}

const todos = computed(() => reminderStore.todos)
const historyTodos = computed(() => reminderStore.historyTodos)

const filteredTodos = computed(() => {
  return todos.value.filter(t => t.status === 'pending')
})

let worker = null

const initWorker = () => {
  if (worker) return
  
  worker = new todoWorker()
  
  worker.onmessage = (e) => {
    const { type, data } = e.data
    
    if (type === 'remind') {
      openReminderWindow({
        ...data,
        runMode: data.runMode || 'time',
      })
    }
  }
  
  worker.postMessage({ 
    type: 'start', 
    data: { 
      todos: JSON.parse(JSON.stringify(todos.value)) 
    } 
  })
}

const stopWorker = () => {
  if (worker) {
    worker.postMessage({ type: 'stop' })
    worker = null
  }
}

const refreshWorker = () => {
  if (worker) {
    worker.postMessage({ 
      type: 'update', 
      data: { 
        todos: JSON.parse(JSON.stringify(todos.value)) 
      } 
    })
  }
}

const openAddDialog = () => {
  editingTodo.value = null
  const now = moment()
  const minutes = now.minutes()
  const nextTenMinutes = Math.ceil(minutes / 10) * 10
  const adjusted = now.clone().minutes(nextTenMinutes).seconds(0)
  if (nextTenMinutes >= 60) {
    adjusted.add(1, 'hour').minutes(0)
  }
  
  formData.value = {
    title: '',
    description: '',
    position: 'bottom-right',
    runMode: 'time',
    scheduleTime: adjusted.format('YYYY-MM-DD HH:mm:ss'),
    cronExpression: '* * * * *',
    status: 'pending'
  }
  resetCronForm()
  showDialog.value = true
}

const editTodo = (todo) => {
  editingTodo.value = todo
  formData.value = { ...todo }
  parseCronExpression(todo.cronExpression)
  showDialog.value = true
}

const saveTodo = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (editingTodo.value) {
      reminderStore.updateTodo(editingTodo.value.id, formData.value)
    } else {
      reminderStore.addTodo({
        ...formData.value,
        id: Date.now().toString(),
        createdAt: moment().toISOString(),
        completedAt: null
      })
    }
    
    showDialog.value = false
    refreshWorker()
  } catch (error) {
    console.error('验证失败:', error)
  }
}

const handleDeleteTodo = (id) => {
  reminderStore.deleteTodo(id)
  refreshWorker()
}

const deleteHistoryTodo = (id, completedAt) => {
  reminderStore.deleteHistoryTodo(id, completedAt)
}

const resetCronForm = () => {
  cronForm.value = {
    minute: '*',
    minuteValue: '',
    hour: '*',
    hourValue: '',
    day: '*',
    dayValue: '',
    month: '*',
    monthValue: '',
    weekday: '*',
    weekdayValue: ''
  }
}

const parseCronExpression = (expression) => {
  if (!expression) return
  const parts = expression.split(' ')
  if (parts.length === 5) {
    cronForm.value.minute = parts[0]
    cronForm.value.hour = parts[1]
    cronForm.value.day = parts[2]
    cronForm.value.month = parts[3]
    cronForm.value.weekday = parts[4]
  }
}

const updateCronExpression = () => {
  const minute = cronForm.value.minute === 'custom' ? cronForm.value.minuteValue : cronForm.value.minute
  const hour = cronForm.value.hour === 'custom' ? cronForm.value.hourValue : cronForm.value.hour
  const day = cronForm.value.day === 'custom' ? cronForm.value.dayValue : cronForm.value.day
  const month = cronForm.value.month === 'custom' ? cronForm.value.monthValue : cronForm.value.month
  const weekday = cronForm.value.weekday === 'custom' ? cronForm.value.weekdayValue : cronForm.value.weekday
  
  formData.value.cronExpression = `${minute} ${hour} ${day} ${month} ${weekday}`
}

let isWorkerInitialized = false

onMounted(() => {
  setOnReminderDoneCallback(onReminderDone)
  initWorker()
  isWorkerInitialized = true
})

watch(() => reminderStore.todos, () => {
  if (isWorkerInitialized) {
    worker?.postMessage({ type: 'reset' })
    worker?.postMessage({ 
      type: 'update', 
      data: { 
        todos: JSON.parse(JSON.stringify(todos.value)) 
      } 
    })
  }
}, { deep: true })

onUnmounted(() => {
  stopWorker()
})
</script>

<style lang="less" scoped>
.todo-reminder {
  padding: 10px 20px;

  .todo-header {
    position: absolute;
    right: 20px;
    top: 16px;
    z-index: 100;
    display: flex;
    align-items: center;
  }

  .todo-scrollbar, .history-scrollbar {
    height: calc(100vh - 168px);
  }

  .empty-tip {
    padding: 40px 0;
  }

  .todo-card-list {
    display: grid;
    overflow: hidden;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .todo-card {
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-2px);
    }

    .todo-card-content {
      .todo-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;

        .todo-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-color-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .todo-card-desc {
        color: var(--text-color-regular);
        font-size: 14px;
        margin-bottom: 12px;
        line-height: 1.5;
        min-height: 42px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .todo-card-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .todo-card-time {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-color-secondary);
          font-size: 12px;
        }
      }
    }
  }

  .history-card {
    opacity: 0.85;
  }

  .cron-builder {
    margin-left: 120px;

    .el-form-item {
      margin-bottom: 4px;
    }
  }

  .cron-collapse {
    margin-top: 12px;
  }

  .dialog-footer {
    width: 100%;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style>
