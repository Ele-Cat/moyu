let timer = null

export function useThrottleFn(fn, delay = 200) {
  const throttledFn = (...args) => {
    if (timer) return
    
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delay)
  }
  
  const cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
  
  return { throttledFn, cancel }
}
