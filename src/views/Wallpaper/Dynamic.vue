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
    </div>
    
    <template v-if="activeTab === 'online'">
      <MediaGrid
        type="dynamic"
        :items="onlineVideos"
        height="calc(100vh - 214px)"
        item-key="id"
        show-apply
        show-favorite
        :total="total"
        :current-page="pageNo"
        @apply="handleApplyVideo"
        @favorite="item => emit('favorite', item)"
        @page-change="handlePageChange"
      >
      </MediaGrid>
    </template>
    
    <div v-if="activeTab === 'local'" class="local-section">
      <el-button type="primary" @click="selectVideo">选择本地视频</el-button>
      <div v-if="selectedVideo" class="selected-info">
        <span>已选择: {{ selectedVideo }}</span>
      </div>
      
      <div class="actions" v-if="selectedVideo">
        <el-button 
          type="primary" 
          @click="handleApplyVideo"
        >
          启动视频壁纸
        </el-button>
      </div>
    </div>
    
    <!-- <div v-if="wallpaperStore.videoActive" class="video-tip">
      视频壁纸已启动
    </div> -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import { useWallpaperStore } from '@/stores/modules/wallpaper'
import MediaGrid from './components/MediaGrid.vue'

const wallpaperStore = useWallpaperStore()
const activeTab = ref('online')
const selectedVideo = ref('')
const onlineVideos = ref([])
const pageNo = ref(1)
const total = ref(0)

const emit = defineEmits(['apply', 'favorite'])

const BASE_URL = 'https://oss.ytab.top/yy_video_wallpaper/'

onMounted(async () => {
  fetchOnlineVideos()
})

async function fetchOnlineVideos(page = 1) {
  try {
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
  }
}

function handlePageChange(page) {
  fetchOnlineVideos(page)
}

async function handleApplyVideo(video) {
  selectedVideo.value = video.url
  emit('apply', video)
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
      console.log('selected: ', selected);
      selectedVideo.value = selected
    }
  } catch (e) {
    console.error('选择视频失败:', e)
  }
}
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
