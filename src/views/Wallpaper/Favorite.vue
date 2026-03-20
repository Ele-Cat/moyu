<template>
  <div class="favorite-wallpaper">
    <div class="favorite-header">
      <span>共 {{ store.favorites.length }} 条收藏</span>
    </div>
    
    <div v-if="store.favorites.length === 0" class="empty-tip">
      暂无收藏内容
    </div>
    
    <div v-else class="favorite-list">
      <div 
        v-for="item in store.favorites" 
        :key="item.path + item.timestamp"
        class="favorite-item"
      >
        <div class="item-thumb">
          {{ item.type === 'video' ? '🎬' : '🖼️' }}
        </div>
        <div class="item-info">
          <span class="item-name">{{ item.name || item.path }}</span>
          <span class="item-time">{{ formatTime(item.timestamp) }}</span>
        </div>
        <div class="item-actions">
          <button @click="applyItem(item)">应用</button>
          <button @click="store.removeFromFavorites(item.path)">取消收藏</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useWallpaperStore } from '@/stores/modules/wallpaper'

const store = useWallpaperStore()

function formatTime(timestamp) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function applyItem(item) {
  console.log('应用:', item)
}
</script>

<style scoped>
.favorite-header {
  margin-bottom: 20px;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: var(--text-color-muted);
}

.favorite-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.favorite-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--bg-color-secondary);
  border-radius: 8px;
}

.item-thumb {
  font-size: 24px;
  margin-right: 12px;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.item-time {
  font-size: 12px;
  color: var(--text-color-muted);
}

.item-actions {
  display: flex;
  gap: 8px;
}

.item-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: var(--bg-color);
}

.item-actions button:hover {
  background: var(--hover-bg);
}
</style>
