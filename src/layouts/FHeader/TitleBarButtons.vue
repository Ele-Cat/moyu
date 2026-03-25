<template>
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
</template>

<script setup>
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useDark } from '@/hooks/useDark'

const emit = defineEmits(['toggle-theme'])

const { isDark, toggle: toggleDark } = useDark()
const isMaximized = ref(false)

function handleToggleTheme(e) {
  toggleDark(e)
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

getCurrentWindow().isMaximized().then(max => {
  isMaximized.value = max
})
</script>

<style lang="less" scoped>
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

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .icon {
    width: 14px;
    height: 14px;
    filter: var(--icon-filter);
  }

  &.close:hover {
    background: #e81123;
  }
}
</style>
