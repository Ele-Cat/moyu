<template>
  <div class="media-grid-container">
    <el-scrollbar v-if="items.length > 0">
      <div class="media-grid" :style="{height: height}">
        <div 
          v-for="item in items" 
          :key="itemKey ? item[itemKey] : item.url + item.timestamp"
          class="media-item"
          @click="handleClick(item)"
        >
          <img :src="item.cover" :alt="item.name" />
          
          <div v-if="['static', 'dynamic'].includes(type)" class="hover-title" :title="item.name">
            {{ item.name }}
          </div>
          <div v-else class="hover-title">
            {{ type === 'favorite' ? '收藏于：' : '使用于：'}}{{ formatTimestamp(item.timestamp) }}
          </div>
          
          <div class="hover-actions bottom-actions">
            <slot name="actions" :item="item">
              <el-icon 
                v-if="showApply" 
                @click.stop="$emit('apply', item)" 
                title="设为壁纸"
              >
                <PictureFilled />
              </el-icon>
              <el-icon 
                @click.stop="handleClick(item)" 
                title="预览"
              >
                <View />
              </el-icon>
              <el-icon 
                v-if="showFavorite" 
                @click.stop="$emit('favorite', item)" 
                :title="isFavorited(item) ? '取消收藏' : '收藏'"
              >
                <component :is="isFavorited(item) ? StarFilled : Star" />
              </el-icon>
              <el-icon 
                v-if="showDelete" 
                @click.stop="$emit('delete', item)" 
                title="删除"
              >
                <Delete />
              </el-icon>
            </slot>
          </div>
        </div>
      </div>
    </el-scrollbar>
    
    <div v-else class="empty-tip">
      {{ emptyText }}
    </div>
    
    <div class="pagination-wrapper" v-if="total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        :layout="paginationLayout"
        @current-change="handlePageChange"
      />
    </div>
    
    <div v-if="previewing" class="preview-modal" @click="closePreview">
      <div class="preview-content" @click.stop>
        <img v-if="previewing.type === 'image'" :src="previewing.url" :alt="previewing.name" />
        <video v-else :src="previewing.url" controls autoplay muted></video>
        <div class="preview-actions">
          <slot name="preview-actions" :item="previewing">
            <el-button v-if="showApply" type="primary" @click="$emit('apply', previewing); closePreview()">设为壁纸</el-button>
            <el-button v-if="showFavorite" @click="$emit('favorite', previewing);">{{isFavorited(previewing) ? '取消收藏' : '收藏'}}</el-button>
          </slot>
          <el-button @click="closePreview">关闭</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { PictureFilled, View, StarFilled, Star, Delete } from '@element-plus/icons-vue'
import { useWallpaperStore } from '@/stores/modules/wallpaper'
import { formatTimestamp } from '@/utils/util'

const store = useWallpaperStore()

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  type: {
    type: String,
    default: 'static'
  },
  height: {
    type: String,
    default: '100%'
  },
  itemKey: {
    type: String,
    default: ''
  },
  urlField: {
    type: String,
    default: 'url'
  },
  total: {
    type: Number,
    default: 0
  },
  pageSize: {
    type: Number,
    default: 16
  },
  currentPage: {
    type: Number,
    default: 1
  },
  showTitle: {
    type: Boolean,
    default: false
  },
  showApply: {
    type: Boolean,
    default: false
  },
  showFavorite: {
    type: Boolean,
    default: false
  },
  showDelete: {
    type: Boolean,
    default: false
  },
  favorites: {
    type: Array,
    default: () => []
  },
  emptyText: {
    type: String,
    default: '暂无数据'
  },
  paginationLayout: {
    type: String,
    default: 'total, prev, pager, next'
  },
})

const emit = defineEmits(['click', 'apply', 'favorite', 'preview', 'delete', 'page-change'])

const currentPage = ref(props.currentPage)
const previewing = ref(null)

const favoriteUrls = computed(() => new Set(store.favorites.map(f => f.url)))

function isFavorited(item) {
  return favoriteUrls.value.has(item[props.urlField])
}

watch(() => props.currentPage, (val) => {
  currentPage.value = val
})

function handleClick(item) {
  previewing.value = item
  emit('preview', item)
}

function closePreview() {
  previewing.value = null
}

function handlePageChange(page) {
  emit('page-change', page)
}
</script>

<style scoped>
.media-grid-container {
  width: 100%;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20%, 1fr));
  gap: 10px;
  min-height: 200px;
}

.media-item {
  position: relative;
  height: 16vh;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.media-item img,
.media-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.media-item:hover img,
.media-item:hover video {
  transform: scale(1.1);
}

.hover-title {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  padding: 8px;
  color: #fff;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: linear-gradient(rgba(0, 0, 0, 0.6), transparent);
  opacity: 0;
  transition: opacity 0.2s;
}

.media-item:hover .hover-title {
  opacity: 1;
}

.hover-actions {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  gap: 18px;
  opacity: 0;
  transition: opacity 0.2s;
}

.hover-actions.bottom-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  top: auto;
  align-items: flex-end;
  padding-bottom: 8px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
}

.media-item:hover .hover-actions {
  opacity: 1;
}

.hover-actions .el-icon {
  cursor: pointer;
  font-size: 18px;
  color: #fff;
  transition: color 0.2s;
}

.hover-actions .el-icon:hover {
  color: var(--primary-color);
}

.empty-tip {
  text-align: center;
  padding: 60px;
  color: var(--text-color-muted);
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

.preview-content img,
.preview-content video {
  max-width: 90vw;
  max-height: 80vh;
}

.preview-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}
</style>
