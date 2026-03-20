<template>
  <div class="favorite-wallpaper">
    <div class="favorite-header">
      <span>共 {{ store.favorites.length }} 条收藏</span>
    </div>
    
    <el-scrollbar v-if="store.favorites.length > 0">
      <div class="favorite-grid">
        <div 
          v-for="item in paginatedFavorites" 
          :key="item.url + item.timestamp"
          class="favorite-item"
        >
          <img v-if="item.type === 'image'" :src="item.url" :alt="item.name" />
          <video v-else :src="item.url"></video>
          <div class="hover-actions">
            <el-icon @click.stop="applyItem(item)" title="设为壁纸"><PictureFilled /></el-icon>
            <el-icon @click.stop="removeItem(item.url)" title="取消收藏"><Star /></el-icon>
          </div>
        </div>
      </div>
    </el-scrollbar>
    
    <div v-else class="empty-tip">
      暂无收藏内容
    </div>
    
    <div class="pagination-wrapper" v-if="store.favorites.length > pageSize">
      <el-pagination
        v-model:current-page="pageNo"
        :page-size="pageSize"
        :total="store.favorites.length"
        layout="total, prev, pager, next"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { PictureFilled, Star } from '@element-plus/icons-vue'
import { invoke } from '@tauri-apps/api/core'
import { useWallpaperStore } from '@/stores/modules/wallpaper'

const store = useWallpaperStore()
const pageNo = ref(1)
const pageSize = 20

const paginatedFavorites = computed(() => {
  const start = (pageNo.value - 1) * pageSize
  return store.favorites.slice(start, start + pageSize)
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
  store.removeFromFavorites(url)
}
</script>

<style scoped>
.favorite-header {
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

.favorite-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20%, 1fr));
  gap: 10px;
  min-height: 200px;
}

.favorite-item {
  position: relative;
  height: 16vh;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.favorite-item img,
.favorite-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.favorite-item:hover img,
.favorite-item:hover video {
  transform: scale(1.1);
}

.favorite-item .hover-actions {
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

.favorite-item:hover .hover-actions {
  opacity: 1;
}

.favorite-item .hover-actions .el-icon {
  cursor: pointer;
  font-size: 18px;
  color: #fff;
}

.favorite-item .hover-actions .el-icon:hover {
  color: var(--primary-color);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 15px 0 0;
}
</style>
