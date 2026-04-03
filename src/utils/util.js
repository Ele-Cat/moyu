import moment from 'moment'
import 'moment/locale/zh-cn'

export function formatDateTime(dateStr, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!dateStr) return ''
  return moment(dateStr).format(format)
}

export function getCronDescription(expression) {
  if (!expression) return ''
  const parts = expression.split(' ')
  if (parts.length !== 5) return ''
  
  const [minute, hour, day, month, weekday] = parts
  let description = ''
  
  if (minute === '*') description += '每分钟 '
  else if (minute.startsWith('*/')) description += `每${minute.slice(2)}分钟 `
  else description += `在第${minute}分钟 `
  
  if (hour === '*') description += '每小时 '
  else if (hour.startsWith('*/')) description += `每${hour.slice(2)}小时 `
  else description += `在${hour}点 `
  
  if (day === '*') description += '每天 '
  else if (day === '1-5') description += '每个工作日 '
  else description += `在每月${day}号 `
  
  if (month === '*') description += '每月 '
  else description += `在${month}月 `
  
  if (weekday === '*') description += '每天'
  else if (weekday === '6,0') description += '每个周末'
  else description += `在星期${weekday}`
  
  return description
}

export function getCronNextTimes(expression, count = 0) {
  if (!expression) return count === 0 ? getCronDescription(expression) : []
  
  const parts = expression.split(' ')
  if (parts.length !== 5) return count === 0 ? getCronDescription(expression) : []
  
  const [minute, hour, day, month, weekday] = parts
  
  if (count === 0) {
    return getCronDescription(expression)
  }
  
  const results = []
  let current = moment()
  
  const maxIterations = 1000
  let iterations = 0
  
  while (results.length < count && iterations < maxIterations) {
    iterations++
    current = current.add(1, 'minute')
    current.second(0)
    current.millisecond(0)
    
    if (!matchCronField(current.minute(), minute)) continue
    if (!matchCronField(current.hour(), hour)) continue
    if (!matchCronField(current.date(), day)) continue
    if (!matchCronField(current.month() + 1, month)) continue
    if (!matchCronField(current.day(), weekday)) continue
    
    results.push(formatDateTime(current))
  }
  
  return results
}

function matchCronField(current, field) {
  if (field === '*') return true
  
  if (field.startsWith('*/')) {
    const interval = parseInt(field.slice(2))
    return current % interval === 0
  }
  
  if (field.includes(',')) {
    return field.split(',').some(f => parseInt(f) === current)
  }
  
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(Number)
    return current >= start && current <= end
  }
  
  return parseInt(field) === current
}
