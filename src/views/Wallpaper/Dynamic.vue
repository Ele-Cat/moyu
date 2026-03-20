<template>
  <div class="dynamic-wallpaper">
    <div class="section">
      <h3>本地视频</h3>
      <div class="local-video">
        <button @click="selectVideo">选择本地视频</button>
        <div v-if="selectedVideo" class="selected-info">
          <span>已选择: {{ selectedVideo }}</span>
        </div>
      </div>
      
      <div class="actions">
        <button 
          class="start-btn" 
          @click="startVideoWallpaper"
          :disabled="!selectedVideo || store.videoActive"
        >
          {{ store.videoActive ? '已启动' : '启动视频壁纸' }}
        </button>
        <button 
          class="stop-btn" 
          @click="stopVideoWallpaper"
        >
          停止
        </button>
      </div>
    </div>
    
    <div class="section">
      <h3>在线视频</h3>
      <div class="online-videos">
        <div 
          v-for="video in onlineVideos" 
          :key="video.id"
          class="video-item"
          @click="selectOnlineVideo(video)"
        >
          <div class="video-thumb">{{ video.thumb }}</div>
          <div class="video-name">{{ video.name }}</div>
        </div>
      </div>
    </div>
    
    <div v-if="store.videoActive" class="video-tip">
      视频壁纸已启动
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { setDesktopUnderlay } from 'tauri-plugin-desktop-underlay-api'
import { useWallpaperStore } from '@/stores/modules/wallpaper'

const store = useWallpaperStore()
const selectedVideo = ref('')
let underlayWindow = null

// 列表
// https://go.ytab.top/users/video_wallpaper_list?page=1&limit=20

const onlineVideos = ref([
  { id: 1, name: '动漫风景1', thumb: '🎬', url: 'https://oss.ytab.top/yy_video_wallpaper/02ed430b-b136-43e9-8539-0a2233749e9b.mp4' },
  { id: 2, name: '动漫风景2', thumb: '🎬', url: 'https://example.com/video2.mp4' },
])

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

function selectOnlineVideo(video) {
  selectedVideo.value = video.url
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
    
    underlayWindow.on('tauri://close-requested', async () => {
      underlayWindow = null
      store.setVideoActive(false)
      await invoke('refresh_wallpaper')
    })
    
    store.setVideoActive(true)
    store.setCurrentVideoPath(selectedVideo.value)
    store.addToHistory({ path: selectedVideo.value, type: 'video' })
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
    store.setVideoActive(false)
    await invoke('refresh_wallpaper')
  } catch (e) {
    console.error('停止失败:', e)
  }
}
</script>

<style scoped>
.section {
  margin-bottom: 30px;
}

.section h3 {
  margin-bottom: 15px;
}

.local-video button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  background: var(--primary-color);
  color: #fff;
  cursor: pointer;
}

.selected-info {
  margin-top: 10px;
  padding: 10px;
  background: var(--bg-color-secondary);
  border-radius: 6px;
}

.actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.start-btn, .stop-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.start-btn {
  background: var(--primary-color);
  color: #fff;
}

.start-btn:disabled {
  opacity: 0.5;
}

.stop-btn {
  background: #666;
  color: #fff;
}

.stop-btn:disabled {
  opacity: 0.5;
}

.online-videos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.video-item {
  padding: 15px;
  background: var(--bg-color-secondary);
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
}

.video-item:hover {
  background: var(--hover-bg);
}

.video-thumb {
  font-size: 32px;
}

.video-name {
  margin-top: 8px;
  font-size: 14px;
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
