import { defineStore } from 'pinia'
import { ref } from 'vue'
import { usePreferredDark } from '@vueuse/core'

export const useAppStore = defineStore('app', () => {
  const preferredDark = usePreferredDark()

  const sidebarCollapsed = ref(false)
  const isDark = ref(false)
  const windowOpacity = ref(1.0)
  const bossKeyEnabled = ref(true)
  const showSettings = ref(false)

  const STORAGE_KEY_SIDEBAR = 'moyu-sidebar-collapsed'
  const STORAGE_KEY_THEME = 'moyu-theme'

  function loadState() {
    const savedSidebar = localStorage.getItem(STORAGE_KEY_SIDEBAR)
    if (savedSidebar !== null) {
      sidebarCollapsed.value = savedSidebar === 'true'
    }

    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME)
    if (savedTheme !== null) {
      isDark.value = savedTheme === 'dark'
    } else {
      isDark.value = preferredDark.value
    }
    applyTheme()
  }

  function applyTheme() {
    document.documentElement.classList.toggle('dark', isDark.value)
    document.documentElement.style.colorScheme = isDark.value ? 'dark' : 'light'
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem(STORAGE_KEY_SIDEBAR, String(sidebarCollapsed.value))
  }

  function toggleTheme() {
    isDark.value = !isDark.value
    localStorage.setItem(STORAGE_KEY_THEME, isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  function setOpacity(opacity) {
    windowOpacity.value = Math.max(0, Math.min(1, opacity))
  }

  function toggleSettings() {
    showSettings.value = !showSettings.value
  }

  return {
    sidebarCollapsed,
    isDark,
    windowOpacity,
    bossKeyEnabled,
    showSettings,
    loadState,
    toggleSidebar,
    toggleTheme,
    setOpacity,
    toggleSettings,
  }
})
