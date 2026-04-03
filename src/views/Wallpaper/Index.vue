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
import { useVideoWallpaper } from '@/hooks/useVideoWallpaper'
import Static from './modules/Static.vue'
import Dynamic from './modules/Dynamic.vue'
import History from './modules/History.vue'
import Favorite from './modules/Favorite.vue'

const { openVideoWallpaper, closeVideoWallpaper } = useVideoWallpaper()

const activeTab = ref('static')

const wallpaperStore = useWallpaperStore()

async function handleApply(item) {
  try {
    if (item && item.type == 'image') {
      await invoke('set_wallpaper', { url: item.url })
    } else {
      if (item == null) {
        await closeVideoWallpaper()
        return
      }
      await openVideoWallpaper(item)
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

<style lang="less" scoped>
.wallpaper-page {
  height: 100%;
  padding: 10px 20px;
}

.stop-btn {
  position: absolute;
  top: 56px;
  right: 20px;
}
</style>
