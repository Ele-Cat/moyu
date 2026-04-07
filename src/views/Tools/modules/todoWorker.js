let timer = null
let todos = []
let initializedCronIds = new Set()
let activeReminderIds = new Set()

self.onmessage = function(e) {
  const { type, data } = e.data
  
  switch(type) {
    case 'start':
      todos = data.todos || []
      todos.forEach(todo => {
        if (todo.runMode === 'cron') {
          if (!initializedCronIds.has(todo.id)) {
            todo._createdMinute = new Date().getHours() * 60 + new Date().getMinutes()
            todo._lastRemindedMinute = -1
            initializedCronIds.add(todo.id)
          }
        }
      })
      startTimer()
      break
      
    case 'stop':
      stopTimer()
      break
      
    case 'update':
      todos = data.todos || []
      todos.forEach(todo => {
        if (todo.runMode === 'cron') {
          if (!initializedCronIds.has(todo.id)) {
            todo._createdMinute = new Date().getHours() * 60 + new Date().getMinutes()
            todo._lastRemindedMinute = -1
            initializedCronIds.add(todo.id)
          }
        }
      })
      break
      
    case 'activeReminder':
      if (data && data.id) {
        activeReminderIds.add(data.id)
      }
      break
      
    case 'closedReminder':
      if (data && data.id) {
        activeReminderIds.delete(data.id)
      }
      break
  }
}

function startTimer() {
  if (timer) return
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
  const nowTimestamp = Date.now()
  const currentMinute = now.getHours() * 60 + now.getMinutes()
  
  todos.forEach(todo => {
    if (todo.status !== 'pending') return
    
    if (activeReminderIds.has(todo.id)) return
    
    if (todo.runMode === 'time') {
      const scheduleTime = new Date(todo.scheduleTime)
      const timeDiff = scheduleTime.getTime() - nowTimestamp
      
      if (timeDiff <= 0 && timeDiff > -10000) {
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
        todo.status = 'reminded'
        activeReminderIds.add(todo.id)
      }
    } else if (todo.runMode === 'cron') {
      const createdMinute = todo._createdMinute
      const lastRemindedMinute = todo._lastRemindedMinute
      
      if (createdMinute === undefined) {
        todo._createdMinute = currentMinute
        todo._lastRemindedMinute = -1
        return
      }
      
      if (matchesCron(todo.cronExpression, now)) {
        if (currentMinute !== lastRemindedMinute && currentMinute !== createdMinute) {
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
          todo._lastRemindedMinute = currentMinute
          activeReminderIds.add(todo.id)
        }
      }
    }
  })
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
