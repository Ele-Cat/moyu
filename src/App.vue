<template>
  <div class="app-container">
    <el-config-provider :locale="locale" :message="messageConfig">
      <router-view />
    </el-config-provider>
  </div>
</template>

<script setup>
import { computed, reactive, onMounted } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useAppStore } from '@/stores/modules/app'
import { useDark } from '@/hooks/useDark'
import { useVideoWallpaper } from '@/hooks/useVideoWallpaper'
import { useWallpaperStore } from '@/stores/modules/wallpaper'
import { useReminderStore } from '@/stores/modules/reminder'
import { useReminder } from '@/hooks/useReminder'
import todoWorker from './views/Tools/modules/todoWorker.js?worker'

const appStore = useAppStore()
const { isDark, init: initDark } = useDark()

const wallpaperStore = useWallpaperStore()
const { openVideoWallpaper } = useVideoWallpaper()

const reminderStore = useReminderStore()
const { openReminderWindow, setWorkerRef } = useReminder()

const locale = computed(() => zhCn)
const messageConfig = reactive({
  max: 3,
  offset: 60,
})

const isFirstMount = true || !import.meta.hot

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
      todos: JSON.parse(JSON.stringify(reminderStore.todos)) 
    } 
  })
  
  setWorkerRef(worker)
}

onMounted(() => {
  initDark()
  appStore.initTheme()
  if (isFirstMount) {
    initWallpaper()
  }
  initWorker()
})

function initWallpaper() {
  if (wallpaperStore.isVideoActive) {
    openVideoWallpaper({ url: wallpaperStore.videoPath })
  }
}
</script>

<style lang="less">
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
</style>
