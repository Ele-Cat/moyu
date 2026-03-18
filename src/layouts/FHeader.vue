<template>
  <header class="titlebar" data-tauri-drag-region>
    <div class="titlebar-left">
      <span class="title">摸鱼日常</span>
    </div>
    <div class="titlebar-right">
      <button class="window-btn theme-btn" @click="handleToggleTheme" :title="isDark ? '切换亮色模式' : '切换暗黑模式'">
        <img v-if="isDark" src="@/assets/svg/sun.svg" alt="sun" class="icon" />
        <img v-else src="@/assets/svg/moon.svg" alt="moon" class="icon" />
      </button>
      <button class="window-btn minimize" @click="minimizeWindow">
        <img src="@/assets/svg/minimize.svg" alt="minimize" class="icon" />
      </button>
      <button class="window-btn maximize" @click="toggleMaximize">
        <img v-if="isMaximized" src="@/assets/svg/restore.svg" alt="restore" class="icon" />
        <img v-else src="@/assets/svg/maximize.svg" alt="maximize" class="icon" />
      </button>
      <button class="window-btn close" @click="closeWindow">
        <img src="@/assets/svg/close.svg" alt="close" class="icon" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'

defineProps<{
  isDark: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-theme'): void
}>()

const isMaximized = ref(false)

function handleToggleTheme(e: MouseEvent) {
  const { clientX: x, clientY: y } = e
  document.documentElement.style.setProperty('--click-x', `${x}px`)
  document.documentElement.style.setProperty('--click-y', `${y}px`)

  if (!document.startViewTransition) {
    emit('toggle-theme')
    return
  }

  const transition = document.startViewTransition(() => {
    emit('toggle-theme')
  })

  transition.finished.finally(() => {
    document.documentElement.style.removeProperty('--click-x')
    document.documentElement.style.removeProperty('--click-y')
  })
}

async function minimizeWindow() {
  try {
    const win = getCurrentWindow()
    await win.minimize()
  } catch (e) {
    console.error('最小化失败:', e)
  }
}

async function toggleMaximize() {
  try {
    const win = getCurrentWindow()
    const maximized = await win.isMaximized()
    if (maximized) {
      await win.unmaximize()
    } else {
      await win.maximize()
    }
    isMaximized.value = !maximized
  } catch (e) {
    console.error('最大化切换失败:', e)
  }
}

async function closeWindow() {
  try {
    await invoke('hide_to_tray')
  } catch (e) {
    console.error('关闭失败:', e)
  }
}

onMounted(async () => {
  try {
    const win = getCurrentWindow()
    isMaximized.value = await win.isMaximized()
  } catch (e) {
    console.error('初始化失败:', e)
  }
})
</script>

<style scoped>
.titlebar {
  height: var(--header-height);
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-end) 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  user-select: none;
  -webkit-app-region: drag;
}

.titlebar-left {
  display: flex;
  align-items: center;
}

.title {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.titlebar-right {
  display: flex;
  gap: 5px;
  -webkit-app-region: no-drag;
}

.window-btn {
  width: 36px;
  height: 28px;
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-size: 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.window-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.window-btn.close:hover {
  background: #e74c3c;
}

.theme-btn {
  width: 32px;
}

.icon {
  width: 14px;
  height: 14px;
  filter: invert(1);
}
</style>
