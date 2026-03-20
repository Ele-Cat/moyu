<template>
  <div class="dynamic-wallpaper">
    <div class="tab-header">
      <div class="category-tabs">
        <div 
          :class="['cat-item', { active: activeTab === 'online' }]"
          @click="activeTab = 'online'; fetchOnlineVideos()"
        >
          在线视频
        </div>
        <div 
          :class="['cat-item', { active: activeTab === 'local' }]"
          @click="activeTab = 'local'"
        >
          本地视频
        </div>
      </div>
      <el-button 
        v-if="wallpaperStore.videoActive"
        type="danger" 
        size="small"
        @click="stopVideoWallpaper"
      >
        停止壁纸
      </el-button>
    </div>
    
    <template v-if="activeTab === 'online'">
      <el-scrollbar>
        <div class="video-grid">
          <div 
            v-for="video in onlineVideos" 
            :key="video.id"
            class="video-item"
            @click="previewVideo(video)"
          >
            <img :src="video.image" :alt="video.name" />
            <div class="hover-actions">
              <el-icon title="预览"><VideoPlay /></el-icon>
            </div>
          </div>
        </div>
      </el-scrollbar>
      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="pageNo"
          :page-size="20"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </template>
    
    <div v-if="activeTab === 'local'" class="local-section">
      <el-button type="primary" @click="selectVideo">选择本地视频</el-button>
      <div v-if="selectedVideo" class="selected-info">
        <span>已选择: {{ selectedVideo }}</span>
      </div>
      
      <div class="actions" v-if="selectedVideo && !wallpaperStore.videoActive">
        <el-button 
          type="primary" 
          @click="startVideoWallpaper"
        >
          启动视频壁纸
        </el-button>
      </div>
    </div>
    
    <div v-if="previewing" class="preview-modal" @click="previewing = null">
      <div class="preview-content" @click.stop>
        <video :src="previewing.videoUrl" controls autoplay muted></video>
        <div class="preview-actions">
          <el-button type="primary" @click="applyVideoWallpaper(previewing)">设为壁纸</el-button>
          <el-button @click="previewing = null">关闭</el-button>
        </div>
      </div>
    </div>
    
    <div v-if="wallpaperStore.videoActive" class="video-tip">
      视频壁纸已启动
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { VideoPlay } from '@element-plus/icons-vue'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { setDesktopUnderlay } from 'tauri-plugin-desktop-underlay-api'
import { useWallpaperStore } from '@/stores/modules/wallpaper'

const wallpaperStore = useWallpaperStore()
const activeTab = ref('online')
const selectedVideo = ref('')
const onlineVideos = ref([])
const pageNo = ref(1)
const total = ref(0)
const previewing = ref(null)
let underlayWindow = null

const BASE_URL = 'https://oss.ytab.top/yy_video_wallpaper/'

async function fetchOnlineVideos(page = 1) {
  try {
    const res = await fetch(`https://go.ytab.top/users/video_wallpaper_list?page=${page}&limit=16`)
    const { data } = await res.json()
    
    onlineVideos.value = data.data.map(item => ({
      id: item.id,
      name: item.video,
      image: BASE_URL + item.image,
      videoUrl: BASE_URL + item.video,
    }))
    total.value = data.total || 0
  } catch (e) {
    console.error('获取在线视频失败:', e)
  }
}

function handlePageChange(page) {
  fetchOnlineVideos(page)
}

function previewVideo(video) {
  previewing.value = video
}

async function applyVideoWallpaper(video) {
  selectedVideo.value = video.videoUrl
  previewing.value = null
  await startVideoWallpaper()
}

async function selectVideo() {
  try {
    const selected = await open({
      multiple: false,
      title: '选择视频文件',
      filters: [{
        name: '视频',
        extensions: ['mp4', 'avi', 'mkv', 'wmv', 'mov', 'webm']
      }]
    })
    if (selected) {
      selectedVideo.value = selected
    }
  } catch (e) {
    console.error('选择视频失败:', e)
  }
}

async function startVideoWallpaper() {
  if (!selectedVideo.value) return
  
  try {
    if (underlayWindow) {
      await setDesktopUnderlay(false, 'underlay')
      await underlayWindow.close()
    }
    
    underlayWindow = new WebviewWindow('underlay', {
      url: `/video-wallpaper?path=${encodeURIComponent(selectedVideo.value)}`,
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
    wallpaperStore.setCurrentVideoPath(selectedVideo.value)
    wallpaperStore.addToHistory({ path: selectedVideo.value, type: 'video' })
  } catch (e) {
    console.error('启动失败:', e)
  }
}

async function stopVideoWallpaper() {
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
}

onMounted(async () => {
  if (wallpaperStore.videoActive) {
    const existingWindow = await WebviewWindow.getByLabel('underlay')
    if (existingWindow) {
      underlayWindow = existingWindow
    }
  }
  fetchOnlineVideos()
})
</script>

<style scoped>
.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cat-item {
  padding: 5px 12px;
  border-radius: 15px;
  cursor: pointer;
  background: var(--bg-color-secondary);
  font-size: 12px;
  transition: all 0.2s;
}

.cat-item:hover {
  background: var(--hover-bg);
}

.cat-item.active {
  background: var(--primary-color);
  color: #fff;
}

.local-section {
  padding: 20px 0;
}

.selected-info {
  margin-top: 15px;
  padding: 12px;
  background: var(--bg-color-secondary);
  border-radius: 6px;
  font-size: 14px;
}

.actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.video-grid {
  height: calc(100vh - 214px);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20%, 1fr));
  gap: 12px;
  min-height: 300px;
}

.video-item {
  position: relative;
  height: 18vh;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.video-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.video-item:hover img {
  transform: scale(1.1);
}

.video-item .hover-actions {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.2s;
}

.video-item:hover .hover-actions {
  opacity: 1;
}

.video-item .hover-actions .el-icon {
  font-size: 32px;
  color: #fff;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 15px 0 0;
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-content video {
  max-width: 90vw;
  max-height: 80vh;
}

.preview-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.video-tip {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 20px;
}
</style>
