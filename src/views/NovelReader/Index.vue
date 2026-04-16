<template>
  <div class="bookshelf">
    <div class="toolbar">
      <div>
        <el-button @click="refreshBooks" type="primary" :icon="Refresh">刷新书架</el-button>
        <el-button @click="showSettings = true" type="primary" :icon="Setting">阅读配置</el-button>
      </div>
      <span class="book-count">共 {{ bookStore.sortedBooks.length }} 本书</span>
    </div>

    <SettingsModal v-model="showSettings" />

    <el-skeleton :loading="loading" animated class="skeleton-container">
      <template #template>
        <div v-for="i in 8" :key="i">
          <el-skeleton-item variant="image" />
          <el-skeleton-item variant="text" />
        </div>
      </template>
      <template #default>
        <el-scrollbar v-if="bookStore.sortedBooks.length > 0" class="scrollbar-container">
          <div class="book-grid">
            <div
              v-for="book in bookStore.sortedBooks"
              :key="book.filePath"
              class="book-card"
              @click="openBook(book)"
            >
              <div class="card-cover">
                <img v-if="book.coverUrl" :src="book.coverUrl" @error="book.coverUrl = ''" />
                <div v-else class="cover-placeholder">
                  <span class="format-badge">{{ book.format.toUpperCase() }}</span>
                  <span class="book-icon">📚</span>
                </div>
                <div class="card-overlay">
                  <el-button type="primary" size="small" :icon="Reading" circle />
                </div>
              </div>
              <div class="card-info">
                <h3 class="book-name">{{ book.bookName }}</h3>
                <div v-if="getLastReadTime(book.filePath)" class="last-read">
                  <el-icon><Clock /></el-icon>
                  <span>{{ formatLastRead(getLastReadTime(book.filePath)) }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-scrollbar>
        
        <div v-else class="empty">
          <div class="empty-illustration">
            <div class="stack-books">
              <span>📚</span>
              <span>📖</span>
              <span>📕</span>
            </div>
          </div>
          <p class="empty-title">书架空空如也</p>
          <p class="empty-tip">在 storagePath/books 目录下放入 txt 或 epub 文件</p>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBookStore } from '@/stores/modules/book'
import { useAppStore } from '@/stores/modules/app'
import { Refresh, Reading, Clock, Setting } from '@element-plus/icons-vue'
import { useReader } from '@/hooks/useReader'
import SettingsModal from './components/SettingsModal.vue'

const bookStore = useBookStore()
const appStore = useAppStore()
const { openReaderWindow } = useReader()

const loading = ref(true)
const showSettings = ref(false)

const getLastReadTime = (filePath) => {
  return bookStore.readingHistory[filePath]?.lastReadTime || 0
}

const formatLastRead = (timestamp) => {
  if (!timestamp) return ''
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return new Date(timestamp).toLocaleDateString()
}

const refreshBooks = async () => {
  loading.value = true
  try {
    await bookStore.scanBooks(appStore.storagePath)
  } catch (e) {
    console.error('加载书籍失败:', e)
  } finally {
    loading.value = false
  }
}

const openBook = async (book) => {
  try {
    await openReaderWindow(book)
    bookStore.updateReadTime(book.filePath)
  } catch (e) {
    console.error('打开窗口失败:', e)
  }
}

onMounted(() => {
  refreshBooks()
})
</script>

<style lang="less" scoped>
.bookshelf {
  padding: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .book-count {
    color: #909399;
    font-size: 14px;
  }
}

.skeleton-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  padding-top: 20px;
}

.el-skeleton__image {
  width: 100%;
  height: 16vh;
  margin-bottom: 8px;
}

.scrollbar-container {
  height: calc(100vh - 100px);
}

.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  padding-top: 20px;
}

.book-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
    
    .card-overlay {
      opacity: 1;
    }
    
    .card-cover img {
      transform: scale(1.05);
    }
  }
}

.card-cover {
  position: relative;
  height: 16vh;
  overflow: hidden;
  background: linear-gradient(145deg, #e8e8e8 0%, #d4d4d4 100%);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .cover-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(145deg, #667eea 0%, #764ba2 100%);
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-end) 100%);
    position: relative;
    overflow: hidden;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    
    .format-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      backdrop-filter: blur(4px);
    }
    
    .book-icon {
      font-size: 36px;
      opacity: 0.9;
    }
  }
  
  .card-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
}

.card-info {
  padding: 10px;
  
  .book-name {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin: 0 0 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
  }
  
  .last-read {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    color: #c0c4cc;
    
    .el-icon {
      font-size: 10px;
    }
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #909399;
  
  .empty-illustration {
    margin-bottom: 24px;
    
    .stack-books {
      display: flex;
      gap: 8px;
      font-size: 48px;
      animation: float 3s ease-in-out infinite;
      
      span:nth-child(2) {
        animation-delay: 0.5s;
      }
      
      span:nth-child(3) {
        animation-delay: 1s;
      }
    }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  .empty-title {
    font-size: 18px;
    font-weight: 500;
    color: #606266;
    margin: 0 0 8px;
  }
  
  .empty-tip {
    font-size: 14px;
    color: #909399;
    margin: 0;
  }
}
</style>
