<template>
  <div class="history-wallpaper">
    <div class="history-header">
      <span>共 {{ store.history.length }} 条记录</span>
      <el-button size="small" type="danger" @click="clearHistory" v-if="store.history.length">清空历史</el-button>
    </div>
    
    <el-scrollbar v-if="store.history.length > 0">
      <div class="history-grid">
        <div 
          v-for="item in paginatedHistory" 
          :key="item.url + item.timestamp"
          class="history-item"
        >
          <img v-if="item.type === 'image'" :src="item.url" :alt="item.name" />
          <video v-else :src="item.url"></video>
          <div class="hover-actions">
            <el-icon @click.stop="applyItem(item)" title="设为壁纸"><PictureFilled /></el-icon>
            <el-icon @click.stop="removeItem(item.url)" title="删除"><Delete /></el-icon>
          </div>
        </div>
      </div>
    </el-scrollbar>
    
    <div v-else class="empty-tip">
      暂无历史记录
    </div>
    
    <div class="pagination-wrapper" v-if="store.history.length > pageSize">
      <el-pagination
        v-model:current-page="pageNo"
        :page-size="pageSize"
        :total="store.history.length"
        layout="total, prev, pager, next"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { PictureFilled, Delete } from '@element-plus/icons-vue'
import { invoke } from '@tauri-apps/api/core'
import { useWallpaperStore } from '@/stores/modules/wallpaper'

const store = useWallpaperStore()
const pageNo = ref(1)
const pageSize = 20

const paginatedHistory = computed(() => {
  const start = (pageNo.value - 1) * pageSize
  return store.history.slice(start, start + pageSize)
})

async function applyItem(item) {
  try {
    if (item.type === 'image') {
      await invoke('set_wallpaper', { url: item.url })
    }
  } catch (e) {
    console.error('设置壁纸失败:', e)
  }
}

function removeItem(url) {
  store.removeFromHistory(url)
}

function clearHistory() {
  store.clearHistory()
}
</script>

<style scoped>
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.empty-tip {
  text-align: center;
  padding: 60px;
  color: var(--text-color-muted);
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20%, 1fr));
  gap: 10px;
  min-height: 200px;
}

.history-item {
  position: relative;
  height: 16vh;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.history-item img,
.history-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.history-item:hover img,
.history-item:hover video {
  transform: scale(1.1);
}

.history-item .hover-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  display: flex;
  justify-content: center;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
  gap: 18px;
  opacity: 0;
  transition: opacity 0.2s;
}

.history-item:hover .hover-actions {
  opacity: 1;
}

.history-item .hover-actions .el-icon {
  cursor: pointer;
  font-size: 18px;
  color: #fff;
}

.history-item .hover-actions .el-icon:hover {
  color: var(--primary-color);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 15px 0 0;
}
</style>
