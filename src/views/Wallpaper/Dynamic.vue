<template>
  <div class="dynamic-wallpaper">
    <CategoryTabs
      v-model="activeTab"
      :categories="tabs"
      @change="handleTabChange"
    />
    
    <template v-if="activeTab === 'online'">
      <MediaGrid
        type="dynamic"
        :items="onlineVideos"
        :loading="loading"
        height="calc(100vh - 214px)"
        item-key="id"
        show-apply
        show-favorite
        :total="total"
        :current-page="pageNo"
        @apply="item => emit('apply', item)"
        @favorite="item => emit('favorite', item)"
        @page-change="handlePageChange"
      >
      </MediaGrid>
    </template>
    
    <template v-if="activeTab === 'local'">
      <el-button type="primary" @click="selectVideo">选择本地视频</el-button>
      <el-button v-if="selectedVideo" type="danger" @click="removeSelectedVideo">移除本地视频</el-button>
      <p class="tip">提示：推荐选择适合自己屏幕分辨率的视频，否则可能会导致壁纸显示异常。当前桌面分辨率为：<span class="screen-resolution">{{ screenResolution }}</span></p>
      <div class="selected-info" v-if="selectedVideo">
        <video :src="selectedVideo" controls autoplay muted loop style="width: auto; max-height: 50vh; object-fit: contain;"></video>
        <div v-if="videoResolution" class="video-resolution">{{ videoResolution }}</div>
      </div>
      
      <div class="actions" v-if="selectedVideo">
        <el-button 
          type="primary" 
          @click="handleApplyLocalVideo"
        >
          启动本地视频壁纸
        </el-button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { convertFileSrc } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import MediaGrid from './components/MediaGrid.vue'

const activeTab = ref('online')
const tabs = [
  { id: 'online', category: '在线视频' },
  { id: 'local', category: '本地视频' }
]
const selectedVideo = ref('')
const videoResolution = ref('')
const onlineVideos = ref([])
const pageNo = ref(1)
const total = ref(0)
const screenResolution = ref('')

const emit = defineEmits(['apply', 'favorite'])

const BASE_URL = 'https://oss.ytab.top/yy_video_wallpaper/'

function getScreenResolution() {
  screenResolution.value = `${window.screen.width}*${window.screen.height}`
}

onMounted(async () => {
  getScreenResolution()
  fetchOnlineVideos()
})

function handleTabChange(cat) {
  if (cat.id === 'online') {
    fetchOnlineVideos()
  }
}

const loading = ref(false)

async function fetchOnlineVideos(page = 1) {
  try {
    loading.value = true
    const res = await fetch(`https://go.ytab.top/users/video_wallpaper_list?page=${page}&limit=16`)
    const { data } = await res.json()
    
    onlineVideos.value = data.data.map(item => ({
      id: item.id,
      name: item.video,
      type: 'video',
      cover: BASE_URL + item.image,
      url: BASE_URL + item.video,
    }))
    total.value = data.total || 0
  } catch (e) {
    console.error('获取在线视频失败:', e)
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  fetchOnlineVideos(page)
}

async function handleApplyLocalVideo() {
  emit('apply', { url: selectedVideo.value })
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
      selectedVideo.value = convertFileSrc(selected)
      
      const video = document.createElement('video')
      video.src = selectedVideo.value
      video.onloadedmetadata = () => {
        videoResolution.value = `${video.videoWidth} x ${video.videoHeight}`
      }
      video.onerror = () => {
        videoResolution.value = ''
      }
    }
  } catch (e) {
    console.error('选择视频失败:', e)
  }
}

function removeSelectedVideo() {
  selectedVideo.value = ''
  videoResolution.value = ''
}
</script>

<style scoped>
.screen-resolution {
  font-size: 14px;
  font-weight: bold;
}

.selected-info {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 15px;
  padding: 12px;
  background: var(--bg-color-secondary);
  border-radius: 6px;
  font-size: 14px;
}

.video-resolution {
  margin-top: 10px;
  padding: 4px 10px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
}

.tip {
  font-size: 12px;
  margin-top: 5px;
  color: var(--text-color-secondary);
}

.actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}
</style>
