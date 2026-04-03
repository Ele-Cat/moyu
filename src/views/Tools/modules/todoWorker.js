let timer = null
let todos = []
let lastCheckMinute = -1
let lastCheckTime = 0
const remindedCronIds = new Set()
const remindedTimeIds = new Set()
const activeReminders = new Set()
const cooldownCronIds = new Set()
const newCronIds = new Set()

self.onmessage = function(e) {
  const { type, data } = e.data
  
  switch(type) {
    case 'start':
      todos = data.todos || []
      lastCheckMinute = -1
      lastCheckTime = 0
      remindedCronIds.clear()
      cooldownCronIds.clear()
      newCronIds.clear()
      todos.forEach(todo => {
        if (todo.runMode === 'cron') {
          newCronIds.add(todo.id)
        }
      })
      startTimer()
      break
      
    case 'stop':
      stopTimer()
      break
      
    case 'update':
      const oldIds = new Set(todos.map(t => t.id))
      todos = data.todos || []
      todos.forEach(todo => {
        if (todo.runMode === 'cron' && !oldIds.has(todo.id)) {
          newCronIds.add(todo.id)
        }
      })
      break
      
    case 'check':
      checkTodos()
      break
      
    case 'reset':
      remindedCronIds.clear()
      remindedTimeIds.clear()
      lastCheckMinute = -1
      lastCheckTime = 0
      break

    case 'activeReminder':
      if (data && data.id) {
        activeReminders.add(data.id)
      }
      break
      
    case 'closedReminder':
      if (data && data.id) {
        activeReminders.delete(data.id)
        newCronIds.delete(data.id)
        cooldownCronIds.add(data.id)
      }
      break
  }
}

function startTimer() {
  if (timer) {
    clearInterval(timer)
  }
  timer = setInterval(() => {
    checkTodos()
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

function checkTodos() {
  const now = new Date()
  const currentMinute = now.getMinutes()
  const currentTime = now.getTime()
  
  if (currentMinute !== lastCheckMinute) {
    lastCheckMinute = currentMinute
    remindedCronIds.clear()
    const nextMinute = (currentMinute + 1) % 60
    todos.forEach(todo => {
      if (todo.runMode === 'cron' && !matchesCronAtMinute(todo.cronExpression, currentMinute) && !matchesCronAtMinute(todo.cronExpression, nextMinute)) {
        cooldownCronIds.delete(todo.id)
      }
    })
  }

  const timeSinceLastCheck = currentTime - lastCheckTime
  const isSystemSleep = lastCheckTime > 0 && timeSinceLastCheck > 120000
  
  if (isSystemSleep) {
    console.log('检测到系统休眠或时间跳过，跳过本次检查')
    lastCheckTime = currentTime
    return
  }
  
  lastCheckTime = currentTime
  
  todos.forEach(todo => {
    if (todo.status !== 'pending') return

    if (activeReminders.has(todo.id)) {
      return
    }
    
    if (todo.runMode === 'time') {
      const scheduleTime = new Date(todo.scheduleTime)
      const timeDiff = scheduleTime.getTime() - now.getTime()
      const timeKey = `${todo.id}_${scheduleTime.getTime()}`
      
      if (timeDiff <= 0 && timeDiff > -10000 && !remindedTimeIds.has(timeKey)) {
        remindedTimeIds.add(timeKey)
        activeReminders.add(todo.id)
        self.postMessage({
          type: 'remind',
          data: {
            id: todo.id,
            title: todo.title,
            description: todo.description,
            time: todo.scheduleTime,
            position: todo.position,
            message: `提醒：${todo.title}`,
            runMode: todo.runMode
          }
        })
      }
    } else if (todo.runMode === 'cron') {
      if (cooldownCronIds.has(todo.id)) {
        return
      }
      
      if (newCronIds.has(todo.id)) {
        return
      }
      
      const cronKey = `${todo.id}_${currentMinute}`
      
      if (matchesCron(todo.cronExpression, now) && !remindedCronIds.has(cronKey)) {
        remindedCronIds.add(cronKey)
        activeReminders.add(todo.id)
        self.postMessage({
          type: 'remind',
          data: {
            id: todo.id,
            title: todo.title,
            description: todo.description,
            time: now.toISOString(),
            position: todo.position,
            message: `提醒：${todo.title}`,
            runMode: todo.runMode
          }
        })
      }
    }
  })
}

function matchesCronAtMinute(expression, minute) {
  const parts = expression.split(' ')
  if (parts.length !== 5) return false
  return matchCronField(minute, parts[0])
}

function matchesCron(expression, date) {
  const parts = expression.split(' ')
  if (parts.length !== 5) return false
  
  const [minute, hour, day, month, weekday] = parts
  
  const d = {
    minute: date.getMinutes(),
    hour: date.getHours(),
    day: date.getDate(),
    month: date.getMonth() + 1,
    weekday: date.getDay()
  }
  
  if (!matchCronField(d.minute, minute)) return false
  if (!matchCronField(d.hour, hour)) return false
  if (!matchCronField(d.day, day)) return false
  if (!matchCronField(d.month, month)) return false
  if (!matchCronField(d.weekday, weekday)) return false
  
  return true
}

function matchCronField(value, field) {
  if (field === '*') return true
  
  if (field.includes('/')) {
    const [base, step] = field.split('/')
    if (base === '*') {
      return value % parseInt(step) === 0
    }
    const [start] = base.split('-').map(Number)
    return value >= start && value % parseInt(step) === 0
  }
  
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(Number)
    return value >= start && value <= end
  }
  
  if (field.includes(',')) {
    const values = field.split(',').map(Number)
    return values.includes(value)
  }
  
  return value === parseInt(field)
}
