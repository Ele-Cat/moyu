<template>
  <div class="media-grid-container">
    <div v-if="loading" class="skeleton-container" :style="{ height: height }">
      <el-skeleton animated>
        <template #template>
          <div class="skeleton-grid">
            <el-skeleton-item v-for="i in 16" :key="i" variant="image" class="skeleton-item" />
          </div>
        </template>
      </el-skeleton>
    </div>
    <el-scrollbar v-if="items.length > 0 && !loading">
      <div class="media-grid" :style="{height: height}">
        <div 
          v-for="item in items" 
          :key="itemKey ? item[itemKey] : item.url + item.timestamp"
          class="media-item"
          @click="handleClick(item)"
        >
          <el-image class="media-image" :src="item.cover" :alt="item.name" lazy>
            <template #placeholder>
              <div class="image-slot">加载中<span class="dot">...</span></div>
            </template>
          </el-image>
          
          <div v-if="['static'].includes(type)" class="hover-title" :title="item.name">
            {{ item.name }}
          </div>
          <div v-if="['favorite', 'history'].includes(type)" class="hover-title">
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
    
    <div v-if="items.length == 0 && !loading" class="empty-tip">
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
  loading: {
    type: Boolean,
    default: false
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
  if (val !== currentPage.value) {
    currentPage.value = val
  }
})

watch(() => props.total, () => {
  currentPage.value = 1
})

function handleClick(item) {
  previewing.value = item
  emit('preview', item)
}

function closePreview() {
  previewing.value = null
}

function handlePageChange(pageNo) {
  emit('page-change', pageNo)
}
</script>

<style lang="less" scoped>
.media-grid-container {
  width: 100%;
}

.skeleton-container {
  overflow: auto;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.skeleton-item {
  display: flex;
  flex-direction: column;
  height: 14vh;
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

  .media-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s;
  }

  &:hover {
    .media-image {
      transform: scale(1.1);
    }

    .hover-title {
      opacity: 1;
    }

    .hover-actions {
      opacity: 1;
    }
  }
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  font-size: 12px;
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

  &.bottom-actions {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    align-items: flex-end;
    padding-bottom: 8px;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.5));
  }

  .el-icon {
    cursor: pointer;
    font-size: 18px;
    color: #fff;
    transition: color 0.2s;

    &:hover {
      color: var(--primary-color);
    }
  }
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

  img,
  video {
    max-width: 90vw;
    max-height: 80vh;
  }
}

.preview-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}
</style>
