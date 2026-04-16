<template>
  <div class="reader-word">
    <div class="word-header">
      <div class="word-titlebar">
        <div class="titlebar-left">
          <span class="app-icon">W</span>
          <span class="doc-name">{{ bookStore.currentBook?.bookName || '文档' }}</span>
        </div>
        <div class="titlebar-center">
          <span class="page-num">第 {{ bookStore.currentChapterIndex + 1 }} 页</span>
        </div>
        <div class="titlebar-right">
          <span class="window-btn" @click="handleMinimize">─</span>
          <span class="window-btn" @click="handleMaximize">□</span>
          <span class="window-btn close" @click="handleClose">×</span>
        </div>
      </div>
      <div class="word-toolbar">
        <div class="toolbar-group">
          <span class="toolbar-btn" @click="handleBack">←</span>
          <span class="toolbar-btn" @click="handleForward">→</span>
        </div>
        <div class="toolbar-group">
          <span class="toolbar-btn" @click="prevChapter" :disabled="bookStore.currentChapterIndex <= 0">↑</span>
          <span class="toolbar-btn" @click="nextChapter" :disabled="bookStore.currentChapterIndex >= bookStore.chapterList.length - 1">↓</span>
        </div>
        <div class="toolbar-group">
          <span class="toolbar-btn" @click="showToc = true">目录</span>
        </div>
        <div class="toolbar-title">{{ bookStore.currentChapter?.title }}</div>
      </div>
    </div>
    
    <div class="word-content">
      <div class="word-ruler">
        <div class="ruler-mark" v-for="i in 20" :key="i" :style="{ left: (i * 40 + 20) + 'px' }">{{ i }}</div>
      </div>
      <div class="word-page" ref="pageRef">
        <div class="page-margin">
          <div class="page-header-space"></div>
          <div class="page-content" v-html="chapterContent"></div>
          <div class="page-footer-space"></div>
        </div>
      </div>
    </div>
    
    <div class="word-statusbar">
      <div class="statusbar-left">
        <span class="status-item">字数: {{ chapterContent.length }}</span>
      </div>
      <div class="statusbar-center">
        <span class="status-item">当前章节: {{ bookStore.currentChapterIndex + 1 }} / {{ bookStore.chapterList.length }}</span>
      </div>
      <div class="statusbar-right">
        <span class="status-item">100%</span>
      </div>
    </div>
    
    <transition name="fade">
      <div v-if="showToc" class="toc-overlay" @click="showToc = false">
        <div class="toc-panel" @click.stop>
          <div class="toc-header">
            <h3>目录</h3>
            <span class="close-btn" @click="showToc = false">×</span>
          </div>
          <div class="toc-list">
            <div
              v-for="(chapter, index) in bookStore.chapterList"
              :key="index"
              class="toc-item"
              :class="{ active: index === bookStore.currentChapterIndex }"
              @click="goToChapter(index)"
            >
              {{ chapter.title }}
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBookStore } from '@/stores/modules/book'
import { useReader } from '@/hooks/useReader'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const bookStore = useBookStore()
const { closeCurrentWindow } = useReader()

const chapterContent = computed(() => props.content)
const showToc = ref(false)
const pageRef = ref(null)

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

const goToChapter = (index) => {
  showToc.value = false
  emit('chapter-change', index)
}

const handleBack = () => emit('navigate', 'back')
const handleForward = () => emit('navigate', 'forward')
const handleMinimize = () => {}
const handleMaximize = () => {}
const handleClose = async () => {
  await closeCurrentWindow()
}
</script>

<style lang="less" scoped>
.reader-word {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f0f0;
  user-select: text;
}

.word-header {
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.word-titlebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 32px;
  background: #f5f5f5;
  padding: 0 8px;
  -webkit-app-region: drag;
  
  .titlebar-left {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .app-icon {
      width: 20px;
      height: 20px;
      background: #1a8cff;
      color: #fff;
      font-size: 12px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 2px;
    }
    
    .doc-name {
      font-size: 12px;
      color: #333;
    }
  }
  
  .titlebar-center {
    .page-num {
      font-size: 12px;
      color: #666;
    }
  }
  
  .titlebar-right {
    display: flex;
    gap: 4px;
    -webkit-app-region: no-drag;
    
    .window-btn {
      width: 28px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      color: #666;
      cursor: pointer;
      border-radius: 2px;
      
      &:hover {
        background: #e0e0e0;
      }
      
      &.close:hover {
        background: #e81123;
        color: #fff;
      }
    }
  }
}

.word-toolbar {
  display: flex;
  align-items: center;
  height: 36px;
  padding: 0 8px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  gap: 16px;
  
  .toolbar-group {
    display: flex;
    gap: 2px;
    
    .toolbar-btn {
      padding: 4px 8px;
      font-size: 12px;
      color: #333;
      cursor: pointer;
      border-radius: 2px;
      
      &:hover:not(:disabled) {
        background: #f0f0f0;
      }
      
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }
  
  .toolbar-title {
    flex: 1;
    text-align: center;
    font-size: 12px;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.word-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
}

.word-ruler {
  height: 20px;
  background: #f8f8f8;
  border: 1px solid #d4d4d4;
  border-bottom: none;
  position: relative;
  margin-left: 60px;
  
  .ruler-mark {
    position: absolute;
    font-size: 9px;
    color: #666;
    transform: translateX(-50%);
  }
}

.word-page {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  background: #f0f0f0;
  
  .page-margin {
    width: 100%;
    max-width: 700px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    
    .page-header-space {
      height: 40px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .page-content {
      padding: 40px 50px;
      font-size: 15px;
      line-height: 2;
      font-family: 'Microsoft YaHei', sans-serif;
      color: #000;
      min-height: 500px;
      
      :deep(p) {
        margin-bottom: 8px;
        text-indent: 2em;
      }
    }
    
    .page-footer-space {
      height: 40px;
      border-top: 1px solid #f0f0f0;
    }
  }
}

.word-statusbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 24px;
  background: #f5f5f5;
  padding: 0 12px;
  border-top: 1px solid #d4d4d4;
  flex-shrink: 0;
  
  .status-item {
    font-size: 11px;
    color: #666;
  }
}

.toc-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  
  .toc-panel {
    background: #fff;
    border-radius: 4px;
    width: 320px;
    max-height: 60vh;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    
    .toc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      
      h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
      }
      
      .close-btn {
        cursor: pointer;
        font-size: 18px;
        color: #999;
        
        &:hover {
          color: #333;
        }
      }
    }
    
    .toc-list {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .toc-item {
      padding: 10px 16px;
      font-size: 13px;
      color: #333;
      cursor: pointer;
      
      &:hover {
        background: #f5f5f5;
      }
      
      &.active {
        color: #1a8cff;
        background: #e6f4ff;
      }
    }
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
