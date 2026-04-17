<template>
  <div class="reader-normal" :style="containerStyle">
    <transition name="slide-down">
      <div v-show="showHeader" class="reader-header" :style="headerStyle">
        <div class="header-left">
          <span class="close-btn" @click.stop="handleClose">✕</span>
          <span class="menu-btn" @click.stop="emit('open-toc')">☰</span>
        </div>
        <span class="chapter-title">{{ bookStore.currentChapter?.title }}</span>
        <div class="header-right">
          <span class="settings-btn" @click.stop="showSettings = true">⚙️</span>
        </div>
      </div>
    </transition>
    
    <div 
      class="reader-content" 
      :style="contentStyle"
      ref="contentRef"
      @scroll="handleScroll"
      @click="handleTap"
    >
      <div class="chapter-content" v-html="chapterContent"></div>
    </div>
    
    <transition name="slide-up">
      <div v-show="showHeader" class="reader-footer" :style="footerStyle">
        <button class="nav-btn" @click.stop="prevChapter" :disabled="bookStore.currentChapterIndex <= 0">上一章</button>
        <div class="chapter-info">
          <span class="current">{{ bookStore.currentChapterIndex + 1 }}</span>
          <span class="separator">/</span>
          <span class="total">{{ bookStore.chapterList.length }}</span>
        </div>
        <button class="nav-btn" @click.stop="nextChapter" :disabled="bookStore.currentChapterIndex >= bookStore.chapterList.length - 1">下一章</button>
      </div>
    </transition>

    <transition name="fade">
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
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useBookStore } from '@/stores/modules/book'
import { useReader } from '@/hooks/useReader'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'open-toc'])

const bookStore = useBookStore()
const { closeCurrentWindow } = useReader()

const chapterContent = computed(() => props.content)
const showSettings = ref(false)
const showHeader = ref(true)
const contentRef = ref(null)
let scrollTimer = null

const themes = [
  { id: 'light', bg: '#f5f5f5', text: '#333333' },
  { id: 'sepia', bg: '#e8d4b8', text: '#5c4033' },
  { id: 'green', bg: '#c9e4ca', text: '#2d4a2d' },
  { id: 'dark', bg: '#1a1a1a', text: '#cccccc' },
  { id: 'blue', bg: '#e3f2fd', text: '#1565c0' },
  { id: 'pink', bg: '#fce4ec', text: '#c2185b' },
]

const localSettings = ref({
  fontSize: bookStore.readerSettings.fontSize || 18,
  lineHeight: bookStore.readerSettings.lineHeight || 28,
  bgTheme: bookStore.readerSettings.bgTheme || '#f5f5f5',
  bgOpacity: bookStore.readerSettings.bgOpacity || 100,
  textColor: bookStore.readerSettings.textColor || '#333333'
})

watch(() => bookStore.readerSettings, (newSettings) => {
  localSettings.value = {
    fontSize: newSettings.fontSize || 18,
    lineHeight: newSettings.lineHeight || 28,
    bgTheme: newSettings.bgTheme || '#f5f5f5',
    bgOpacity: newSettings.bgOpacity || 100,
    textColor: newSettings.textColor || '#333333'
  }
}, { deep: true })

const containerStyle = computed(() => ({
  background: localSettings.value.bgTheme
}))

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

const handleTap = () => {
  showHeader.value = !showHeader.value
}

const handleScroll = () => {
  if (scrollTimer) clearTimeout(scrollTimer)
  scrollTimer = setTimeout(() => {
    if (contentRef.value) {
      const scrollTop = contentRef.value.scrollTop
      const scrollHeight = contentRef.value.scrollHeight
      const clientHeight = contentRef.value.clientHeight
      const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
      bookStore.saveChapterProgress(progress)
    }
  }, 500)
}

const updateSettings = () => {
  bookStore.updateReaderSettings(localSettings.value)
}

const selectTheme = (theme) => {
  localSettings.value.bgTheme = theme.bg
  localSettings.value.textColor = theme.text
  updateSettings()
}

const prevChapter = () => {
  if (bookStore.currentChapterIndex > 0) {
    emit('chapter-change', bookStore.currentChapterIndex - 1)
  }
}

const nextChapter = () => {
  if (bookStore.currentChapterIndex < bookStore.chapterList.length - 1) {
    emit('chapter-change', bookStore.currentChapterIndex + 1)
  }
}

const handleClose = async () => {
  await closeCurrentWindow()
}
</script>

<style lang="less" scoped>
.reader-normal {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  color: #fff;
  flex-shrink: 0;
  transition: all 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  -webkit-app-region: drag;
  
  .header-left, .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .close-btn, .menu-btn, .settings-btn {
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 4px;
    transition: background 0.2s;
    font-size: 14px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }
  
  .chapter-title {
    flex: 1;
    text-align: center;
    font-size: 15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 8px;
  }
}

.reader-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  padding-top: 60px;
  padding-bottom: 60px;
  transition: all 0.3s ease;
  -webkit-overflow-scrolling: touch;
  user-select: text;
  -webkit-user-select: text;
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
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  
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
}

.settings-panel {
  background: #fff;
  border-radius: 20px 20px 0 0;
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  overflow-y: auto;
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

.slide-down-enter-active, .slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from, .slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
