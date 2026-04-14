<template>
  <div class="reader-view" :style="readerContainerStyle">
    <div class="reader-header" :style="headerStyle">
      <span class="back-btn" @click="goBack">← 返回</span>
      <span class="chapter-title">{{ bookStore.currentChapter?.title }}</span>
      <span class="settings-btn" @click="showSettings = true">⚙️</span>
    </div>
    
    <div class="reader-content" :style="contentStyle">
      <div class="chapter-content" v-html="chapterContent"></div>
    </div>
    
    <div class="reader-footer" :style="footerStyle">
      <button class="nav-btn" @click="prevChapter" :disabled="bookStore.currentChapterIndex <= 0">上一章</button>
      <div class="chapter-info">
        <span class="current">{{ bookStore.currentChapterIndex + 1 }}</span>
        <span class="separator">/</span>
        <span class="total">{{ bookStore.chapterList.length }}</span>
      </div>
      <button class="nav-btn" @click="nextChapter" :disabled="bookStore.currentChapterIndex >= bookStore.chapterList.length - 1">下一章</button>
    </div>
    
    <div v-if="showSettings" class="settings-overlay" @click="showSettings = false">
      <div class="settings-panel" @click.stop>
        <div class="settings-header">
          <h3>阅读设置</h3>
          <button class="close-btn" @click="showSettings = false">×</button>
        </div>
        
        <div class="setting-group">
          <label>字体大小</label>
          <div class="slider-row">
            <span class="slider-label">A-</span>
            <el-slider v-model="localSettings.fontSize" :min="12" :max="32" :step="1" @change="updateSettings" />
            <span class="slider-label">A+</span>
          </div>
          <span class="slider-value">{{ localSettings.fontSize }}px</span>
        </div>
        
        <div class="setting-group">
          <label>行间距</label>
          <div class="slider-row">
            <span class="slider-label">紧凑</span>
            <el-slider v-model="localSettings.lineHeight" :min="20" :max="40" :step="2" @change="updateSettings" />
            <span class="slider-label">宽松</span>
          </div>
          <span class="slider-value">{{ localSettings.lineHeight }}px</span>
        </div>
        
        <div class="setting-group">
          <label>背景透明度</label>
          <div class="slider-row">
            <span class="slider-label">透</span>
            <el-slider v-model="localSettings.bgOpacity" :min="20" :max="100" :step="5" @change="updateSettings" />
            <span class="slider-label">实</span>
          </div>
          <span class="slider-value">{{ localSettings.bgOpacity }}%</span>
        </div>
        
        <div class="setting-group">
          <label>阅读主题</label>
          <div class="theme-grid">
            <div
              v-for="theme in themes"
              :key="theme.id"
              class="theme-option"
              :class="{ active: localSettings.bgTheme === theme.bg && localSettings.textColor === theme.text }"
              :style="{ background: theme.bg }"
              @click="selectTheme(theme)"
            >
              <span :style="{ color: theme.text }">文</span>
              <span v-if="localSettings.bgTheme === theme.bg" class="check-icon">✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookStore } from '@/stores/modules/book'
import { useAppStore } from '@/stores/modules/app'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const bookStore = useBookStore()
const appStore = useAppStore()

const chapterContent = ref('')
const showSettings = ref(false)

const themes = [
  { id: 'light', bg: '#f5f5f5', text: '#333333' },
  { id: 'sepia', bg: '#e8d4b8', text: '#5c4033' },
  { id: 'green', bg: '#c9e4ca', text: '#2d4a2d' },
  { id: 'dark', bg: '#1a1a1a', text: '#cccccc' },
  { id: 'blue', bg: '#e3f2fd', text: '#1565c0' },
  { id: 'pink', bg: '#fce4ec', text: '#c2185b' },
]

const localSettings = ref({
  fontSize: 18,
  lineHeight: 28,
  bgTheme: '#f5f5f5',
  bgOpacity: 100,
  textColor: '#333333'
})

const headerStyle = computed(() => ({
  background: `rgba(51, 51, 51, ${localSettings.value.bgOpacity / 100})`,
  backdropFilter: localSettings.value.bgOpacity < 100 ? 'blur(10px)' : 'none'
}))

const footerStyle = computed(() => ({
  background: `rgba(51, 51, 51, ${localSettings.value.bgOpacity / 100})`,
  backdropFilter: localSettings.value.bgOpacity < 100 ? 'blur(10px)' : 'none'
}))

const contentStyle = computed(() => ({
  fontSize: localSettings.value.fontSize + 'px',
  lineHeight: localSettings.value.lineHeight + 'px',
  background: localSettings.value.bgTheme,
  color: localSettings.value.textColor,
  opacity: localSettings.value.bgOpacity / 100
}))

const readerContainerStyle = computed(() => ({
  background: localSettings.value.bgTheme
}))

const updateSettings = () => {
  bookStore.updateReaderSettings(localSettings.value)
  bookStore.saveSettingsToStorage()
}

const selectTheme = (theme) => {
  localSettings.value.bgTheme = theme.bg
  localSettings.value.textColor = theme.text
  updateSettings()
}

const loadChapter = async (index) => {
  bookStore.setCurrentChapterIndex(index)
  chapterContent.value = await bookStore.getChapterContent(index)
}

const prevChapter = () => {
  if (bookStore.currentChapterIndex > 0) {
    loadChapter(bookStore.currentChapterIndex - 1)
  }
}

const nextChapter = () => {
  if (bookStore.currentChapterIndex < bookStore.chapterList.length - 1) {
    loadChapter(bookStore.currentChapterIndex + 1)
  }
}

const goBack = () => {
  window.close()
}

const getStoragePath = () => {
  try {
    return localStorage.getItem('app-storagePath') || ''
  } catch {
    return ''
  }
}

onMounted(async () => {
  bookStore.loadSettingsFromStorage()
  localSettings.value = { ...bookStore.readerSettings }
  
  const bookPath = route.query.book
  const format = route.query.format
  
  console.log('[Reader] bookPath:', bookPath, 'format:', format)
  
  if (bookPath && format) {
    await bookStore.scanBooks(appStore.storagePath)
    console.log('[Reader] books:', bookStore.books)
    const book = bookStore.books.find(b => b.filePath === decodeURIComponent(bookPath))
    console.log('[Reader] found book:', book)
    
    if (book) {
      await bookStore.loadBook(book)
      console.log('[Reader] chapterList:', bookStore.chapterList)
      bookStore.updateReadTime(book.filePath)
      bookStore.saveSettingsToStorage()
      
      if (bookStore.chapterList.length > 0) {
        await loadChapter(0)
        console.log('[Reader] chapterContent:', chapterContent.value)
      }
    }
  }
})
</script>

<style lang="less" scoped>
.reader-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  color: #fff;
  flex-shrink: 0;
  transition: all 0.3s ease;
  
  .back-btn, .settings-btn {
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 4px;
    transition: background 0.2s;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
  
  .chapter-title {
    flex: 1;
    text-align: center;
    font-size: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 12px;
  }
}

.reader-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px 20px;
  transition: all 0.3s ease;
}

.chapter-content {
  max-width: 800px;
  margin: 0 auto;
  
  :deep(p) {
    margin-bottom: 1.2em;
    text-indent: 2em;
  }
}

.reader-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  color: #fff;
  flex-shrink: 0;
  transition: all 0.3s ease;
  
  .nav-btn {
    padding: 8px 20px;
    border: none;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.15);
    color: inherit;
    cursor: pointer;
    transition: all 0.2s;
    
    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.25);
    }
    
    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }
  
  .chapter-info {
    font-size: 14px;
    
    .separator {
      margin: 0 4px;
      opacity: 0.6;
    }
  }
}

.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.settings-panel {
  background: #fff;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
  
  h3 {
    margin: 0;
    font-size: 18px;
    color: #333;
  }
  
  .close-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: #f5f5f5;
    border-radius: 50%;
    font-size: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #666;
    
    &:hover {
      background: #eee;
    }
  }
}

.setting-group {
  padding: 20px;
  border-bottom: 1px solid #f5f5f5;
  
  &:last-child {
    border-bottom: none;
  }
  
  > label {
    display: block;
    font-size: 14px;
    color: #333;
    font-weight: 500;
    margin-bottom: 12px;
  }
  
  .slider-row {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .el-slider {
      flex: 1;
    }
    
    .slider-label {
      font-size: 12px;
      color: #999;
      min-width: 32px;
    }
  }
  
  .slider-value {
    display: block;
    text-align: center;
    font-size: 12px;
    color: #999;
    margin-top: 8px;
  }
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-option {
  aspect-ratio: 2/1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  border: 2px solid transparent;
  transition: all 0.2s;
  
  &:hover {
    transform: scale(1.02);
  }
  
  &.active {
    border-color: #409eff;
  }
  
  .check-icon {
    position: absolute;
    top: 4px;
    right: 4px;
    font-size: 12px;
    color: #409eff;
  }
}
</style>
