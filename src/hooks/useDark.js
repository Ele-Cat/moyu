import { ref, watch } from 'vue'

const isDark = ref(false)
const initialized = ref(false)

export function useDark() {
  function init() {
    if (initialized.value) return
    initialized.value = true
    
    const savedTheme = localStorage.getItem('moyu-theme')
    if (savedTheme !== null) {
      isDark.value = savedTheme === 'dark'
    }
    applyTheme()
  }

  function applyTheme() {
    document.documentElement.classList.toggle('dark', isDark.value)
    document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light'
  }

  function toggle(event) {
    if (event) {
      const { clientX: x, clientY: y } = event
      document.documentElement.style.setProperty('--click-x', `${x}px`)
      document.documentElement.style.setProperty('--click-y', `${y}px`)

      if (document.startViewTransition) {
        const transition = document.startViewTransition(() => {
          doToggle()
        })
        transition.finished.finally(() => {
          document.documentElement.style.removeProperty('--click-x')
          document.documentElement.style.removeProperty('--click-y')
        })
        return
      }
    }
    doToggle()
  }

  function doToggle() {
    isDark.value = !isDark.value
    localStorage.setItem('moyu-theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  function setDark(value) {
    isDark.value = value
    localStorage.setItem('moyu-theme', value ? 'dark' : 'light')
    applyTheme()
  }

  watch(isDark, () => {
    applyTheme()
  })

  return {
    isDark,
    init,
    toggle,
    setDark
  }
}
