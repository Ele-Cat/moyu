<template>
  <div class="wallpaper-page">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="壁纸" name="static">
        <Static @apply="handleApply" @favorite="handleFavorite" />
      </el-tab-pane>
      <el-tab-pane label="动态壁纸" name="dynamic">
        <Dynamic @apply="handleApply" @favorite="handleFavorite" />
      </el-tab-pane>
      <el-tab-pane label="历史" name="history">
        <History @apply="handleApply" @favorite="handleFavorite" />
      </el-tab-pane>
      <el-tab-pane label="收藏" name="favorite">
        <Favorite @apply="handleApply" @favorite="handleFavorite" />
      </el-tab-pane>
    </el-tabs>
    <div class="stop-btn">
      <el-button 
        v-if="wallpaperStore.videoActive"
        type="danger" 
        size="small"
        @click="handleApply(null)"
      >
        关闭动态壁纸
      </el-button>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'Wallpaper' })
import { ref, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { ElMessage } from 'element-plus'
import { useWallpaperStore } from '@/stores/modules/wallpaper'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { setDesktopUnderlay } from 'tauri-plugin-desktop-underlay-api'
import Static from './Static.vue'
import Dynamic from './Dynamic.vue'
import History from './History.vue'
import Favorite from './Favorite.vue'
let underlayWindow = null

onMounted(async () => {
  if (wallpaperStore.videoActive) {
    const existingWindow = await WebviewWindow.getByLabel('underlay')
    if (existingWindow) {
      underlayWindow = existingWindow
    }
  }
})

const activeTab = ref('static')

const wallpaperStore = useWallpaperStore()

async function handleApply(item) {
  try {
    if (item && item.type == 'image') {
      await invoke('set_wallpaper', { url: item.url })
    } else {
      if (item == null) {
        try {
          if (underlayWindow) {
            await setDesktopUnderlay(false, 'underlay')
            await underlayWindow.close()
            underlayWindow = null
          }
          wallpaperStore.setVideoActive(false)
          await invoke('refresh_wallpaper')
        } catch (e) {
          console.error('停止失败:', e)
        }
        return
      }
      try {
        if (underlayWindow) {
          await setDesktopUnderlay(false, 'underlay')
          await underlayWindow.close()
        }
        
        underlayWindow = new WebviewWindow('underlay', {
          url: `/video-wallpaper?path=${encodeURIComponent(item.url)}`,
          title: 'VideoWallpaper',
          width: 1920,
          height: 1080,
          x: 0,
          y: 0,
          resizable: false,
          transparent: true,
          visible: true,
          decorations: false,
          alwaysOnBottom: true,
          skipTaskbar: true,
          fullscreen: true,
        })
        
        underlayWindow.once('tauri://created', async () => {
          await setDesktopUnderlay(true, 'underlay')
        })
        
        // underlayWindow.on('tauri://close-requested', async () => {
        //   underlayWindow = null
        //   wallpaperStore.setVideoActive(false)
        //   await invoke('refresh_wallpaper')
        // })
        
        wallpaperStore.setVideoActive(true)
        wallpaperStore.setCurrentVideoPath(item.url)
      } catch (e) {
        console.error('启动失败:', e)
      }
    }
    wallpaperStore.addToHistory({
      ...item,
      timestamp: Date.now()
    })
    ElMessage.success('壁纸设置成功')
  } catch (e) {
    console.error('设置壁纸失败:', e)
    ElMessage.error('壁纸设置失败')
  }
}

function handleFavorite(item) {
  if (wallpaperStore.isFavorited(item)) {
    wallpaperStore.removeFromFavorites(item.url)
    ElMessage.success('取消收藏成功')
  } else {
    wallpaperStore.addToFavorites({
      ...item,
      timestamp: Date.now()
    })
    ElMessage.success('收藏成功')
  }
}
</script>

<style scoped>
.wallpaper-page {
  height: 100%;
  padding: 10px 20px;
}

.stop-btn {
  position: absolute;
  top: 16px;
  right: 20px;
}
</style>
