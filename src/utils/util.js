// 格式化时间戳为日期时间格式
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp)
  // 补零处理
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

// 补零处理
export function pad(num) {
  return num < 10 ? '0' + num : num
}