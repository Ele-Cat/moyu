<template>
  <div class="wallpaper-page">
    <h2>🖼️ 换壁纸</h2>
    <video autoplay loop muted controls style="width: 100%;" src="https://oss.ytab.top/yy_video_wallpaper/02ed430b-b136-43e9-8539-0a2233749e9b.mp4"></video>
    
    <div class="wallpaper-content">
      <!-- 图片壁纸 -->
      <div class="section">
        <h3>📷 图片壁纸</h3>
        <div class="preview" :style="currentWallpaper ? { backgroundImage: `url(${currentWallpaper})` } : {}">
          <div v-if="!currentWallpaper" class="preview-placeholder">
            暂无预览
          </div>
        </div>
        
        <div class="actions">
          <button class="select-btn" @click="selectWallpaper">
            📂 选择图片
          </button>
          <button 
            v-if="currentWallpaper" 
            class="apply-btn" 
            @click="applyWallpaper"
            :disabled="applying"
          >
            {{ applying ? '应用中...' : '✓ 设为桌面壁纸' }}
          </button>
        </div>
      </div>

      <!-- 视频壁纸 -->
      <div class="section">
        <h3>🎬 视频壁纸</h3>
        <div class="preview" :style="currentVideo ? { backgroundImage: `url(${videoPreview})` } : {}">
          <div v-if="!currentVideo" class="preview-placeholder">
            暂无预览
          </div>
          <div v-else class="video-indicator">🎥</div>
        </div>
        
        <div class="actions">
          <button class="select-btn" @click="selectVideo">
            📂 选择视频
          </button>
          <button 
            v-if="currentVideo" 
            class="apply-btn video-btn" 
            @click="startVideoWallpaper"
            :disabled="starting"
          >
            {{ starting ? '启动中...' : '▶️ 设为视频壁纸' }}
          </button>
          <button 
            v-if="currentVideo || videoActive" 
            class="stop-btn" 
            @click="stopVideoWallpaper"
          >
            ⬛ 停止视频壁纸
          </button>
        </div>
        
        <div v-if="videoActive" class="video-tip">
          视频壁纸已启动，按 Esc 或点击右上角关闭
        </div>
      </div>
      
      <div v-if="message" :class="['message', messageType]">
        {{ message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'

const currentWallpaper = ref('')
const currentVideo = ref('')
const applying = ref(false)
const starting = ref(false)
const videoActive = ref(false)
const message = ref('')
const messageType = ref('')

const videoPreview = computed(() => {
  if (!currentVideo.value) return ''
  return currentVideo.value.replace(/\.(mp4|avi|mkv|wmv|mov|webm)$/i, '.jpg')
})

async function selectWallpaper() {
  try {
    const selected = await open({
      multiple: false,
      title: '选择壁纸图片',
      filters: [{
        name: '图片',
        extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
      }]
    })

    if (selected) {
      currentWallpaper.value = `file://${selected}`
      message.value = ''
    }
  } catch (e) {
    console.error('选择图片失败:', e)
    showMessage('选择图片失败: ' + e, 'error')
  }
}

async function applyWallpaper() {
  if (!currentWallpaper.value) return

  applying.value = true
  message.value = ''

  try {
    const path = currentWallpaper.value.replace('file://', '')
    await invoke('set_wallpaper', { path })
    showMessage('壁纸设置成功！', 'success')
  } catch (e) {
    console.error('设置壁纸失败:', e)
    showMessage('设置失败: ' + e, 'error')
  } finally {
    applying.value = false
  }
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
      currentVideo.value = `file://${selected}`
      message.value = ''
    }
  } catch (e) {
    console.error('选择视频失败:', e)
    showMessage('选择视频失败: ' + e, 'error')
  }
}

async function startVideoWallpaper() {
  if (!currentVideo.value) return

  starting.value = true
  message.value = ''

  try {
    const path = currentVideo.value.replace('file://', '')
    await invoke('start_video_wallpaper', { videoPath: path })
    videoActive.value = true
    showMessage('视频壁纸已启动！', 'success')
  } catch (e) {
    console.error('启动视频壁纸失败:', e)
    showMessage('启动失败: ' + e, 'error')
  } finally {
    starting.value = false
  }
}

async function stopVideoWallpaper() {
  try {
    await invoke('stop_video_wallpaper')
    videoActive.value = false
    showMessage('视频壁纸已停止', 'success')
  } catch (e) {
    console.error('停止视频壁纸失败:', e)
    showMessage('停止失败: ' + e, 'error')
  }
}

function showMessage(msg, type) {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = ''
  }, 3000)
}
</script>

<style scoped>
.wallpaper-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  background: var(--bg-color);
  min-height: 100%;
}

.wallpaper-page h2 {
  margin-bottom: 30px;
  color: var(--text-color);
}

.wallpaper-content {
  width: 100%;
  max-width: 600px;
}

.section {
  background: var(--bg-color-secondary);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.section h3 {
  margin-bottom: 15px;
  color: var(--text-color);
}

.preview {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  background-color: var(--bg-color);
  background-size: cover;
  background-position: center;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preview-placeholder {
  color: var(--text-color-muted);
  font-size: 16px;
}

.video-indicator {
  font-size: 48px;
  opacity: 0.8;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.select-btn,
.apply-btn,
.stop-btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.select-btn {
  background: var(--bg-color);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.select-btn:hover {
  background: var(--hover-bg);
}

.apply-btn {
  background: var(--primary-color);
  color: #fff;
}

.apply-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.apply-btn:disabled,
.stop-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stop-btn {
  background: #666;
  color: #fff;
}

.video-tip {
  margin-top: 10px;
  text-align: center;
  font-size: 12px;
  color: var(--text-color-muted);
}

.message {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
}

.message.success {
  background: #d4edda;
  color: #155724;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
}
</style>
