<template>
  <div class="reader-excel">
    <div class="excel-header">
      <div class="excel-titlebar">
        <div class="titlebar-left">
          <span class="app-icon">E</span>
          <span class="doc-name">{{ bookStore.currentBook?.bookName || '工作簿' }}</span>
          <span class="sheet-name">- Sheet1</span>
        </div>
        <div class="titlebar-right">
          <span class="window-btn" @click="handleMinimize">─</span>
          <span class="window-btn" @click="handleMaximize">□</span>
          <span class="window-btn close" @click="handleClose">×</span>
        </div>
      </div>
      <div class="excel-toolbar">
        <div class="toolbar-row">
          <div class="toolbar-group">
            <span class="toolbar-btn" @click="handleBack">←</span>
            <span class="toolbar-btn" @click="handleForward">→</span>
          </div>
          <div class="toolbar-group">
            <span class="toolbar-btn" @click="prevChapter" :disabled="bookStore.currentChapterIndex <= 0">↑章</span>
            <span class="toolbar-btn" @click="nextChapter" :disabled="bookStore.currentChapterIndex >= bookStore.chapterList.length - 1">↓章</span>
          </div>
          <div class="toolbar-group">
            <span class="toolbar-btn" @click="emit('open-toc')">目录</span>
          </div>
        </div>
        <div class="formula-bar">
          <span class="fx-label">fx</span>
          <span class="formula-content">{{ bookStore.currentChapter?.title }}</span>
        </div>
      </div>
      <div class="excel-tabs">
        <div class="tab active">
          <span>Sheet1</span>
          <span class="tab-close">×</span>
        </div>
        <div class="tab add">+</div>
      </div>
    </div>
    
    <div class="excel-body">
      <div class="row-headers">
        <div class="header-corner"></div>
        <div class="row-header" v-for="i in 50" :key="i">{{ i }}</div>
      </div>
      
      <div class="excel-content">
        <div class="col-headers">
          <div class="col-header" v-for="i in 10" :key="i">{{ String.fromCharCode(64 + i) }}</div>
        </div>
        <div class="excel-grid">
          <div class="grid-row" v-for="row in 50" :key="row">
            <div 
              class="grid-cell header" 
              v-for="col in 10" 
              :key="col"
            >
              <span v-if="row === 1 && col === 1" class="cell-content" v-html="chapterContent"></span>
              <span v-else-if="row === 1" class="cell-content"></span>
              <span v-else-if="col === 1" class="cell-content"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="excel-footer">
      <div class="footer-left">
        <span class="status-text">就绪</span>
      </div>
      <div class="footer-center">
        <span class="page-info">当前: {{ bookStore.currentChapterIndex + 1 }} / {{ bookStore.chapterList.length }}</span>
      </div>
      <div class="footer-right">
        <span class="zoom-info">100%</span>
      </div>
    </div>
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

const emit = defineEmits(['close', 'open-toc'])

const bookStore = useBookStore()
const { closeCurrentWindow } = useReader()

const chapterContent = computed(() => props.content)

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

const handleBack = () => emit('navigate', 'back')
const handleForward = () => emit('navigate', 'forward')
const handleMinimize = () => {}
const handleMaximize = () => {}
const handleClose = async () => {
  await closeCurrentWindow()
}
</script>

<style lang="less" scoped>
.reader-excel {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  user-select: text;
}

.excel-header {
  background: #fff;
  border-bottom: 1px solid #d4d4d4;
  flex-shrink: 0;
}

.excel-titlebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 28px;
  background: #f5f5f5;
  padding: 0 8px;
  -webkit-app-region: drag;
  
  .titlebar-left {
    display: flex;
    align-items: center;
    gap: 6px;
    
    .app-icon {
      width: 18px;
      height: 18px;
      background: #4caf50;
      color: #fff;
      font-size: 11px;
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
    
    .sheet-name {
      font-size: 12px;
      color: #888;
    }
  }
  
  .titlebar-right {
    display: flex;
    gap: 2px;
    -webkit-app-region: no-drag;
    
    .window-btn {
      width: 26px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
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

.excel-toolbar {
  padding: 4px 8px;
  border-bottom: 1px solid #d4d4d4;
  
  .toolbar-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 4px;
  }
  
  .toolbar-group {
    display: flex;
    gap: 2px;
    
    .toolbar-btn {
      padding: 3px 8px;
      font-size: 11px;
      color: #333;
      cursor: pointer;
      border-radius: 2px;
      border: 1px solid transparent;
      
      &:hover:not(:disabled) {
        background: #f0f0f0;
        border-color: #d4d4d4;
      }
      
      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }
  
  .formula-bar {
    display: flex;
    align-items: center;
    height: 22px;
    background: #fff;
    border: 1px solid #d4d4d4;
    
    .fx-label {
      width: 24px;
      text-align: center;
      font-size: 11px;
      font-style: italic;
      color: #888;
      border-right: 1px solid #d4d4d4;
    }
    
    .formula-content {
      flex: 1;
      padding: 0 6px;
      font-size: 11px;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.excel-tabs {
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 24px;
  background: #f5f5f5;
  border-bottom: 1px solid #d4d4d4;
  
  .tab {
    padding: 2px 12px;
    font-size: 11px;
    color: #333;
    background: #fff;
    border: 1px solid #d4d4d4;
    border-bottom: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    margin-right: 2px;
    
    &.active {
      background: #fff;
      border-bottom: 1px solid #fff;
      margin-bottom: -1px;
    }
    
    &:hover:not(.active) {
      background: #e8e8e8;
    }
    
    .tab-close {
      font-size: 10px;
      color: #888;
      
      &:hover {
        color: #333;
      }
    }
    
    &.add {
      padding: 2px 6px;
      border: none;
      background: transparent;
      
      &:hover {
        background: #e0e0e0;
      }
    }
  }
}

.excel-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.row-headers {
  width: 30px;
  flex-shrink: 0;
  background: #f5f5f5;
  border-right: 1px solid #d4d4d4;
  
  .header-corner {
    height: 23px;
    border-bottom: 1px solid #d4d4d4;
    background: #f5f5f5;
  }
  
  .row-header {
    height: 18px;
    font-size: 10px;
    color: #666;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #e0e0e0;
  }
}

.excel-content {
  flex: 1;
  overflow: auto;
  
  .col-headers {
    display: flex;
    height: 23px;
    background: #f5f5f5;
    border-bottom: 1px solid #d4d4d4;
    
    .col-header {
      width: 80px;
      flex-shrink: 0;
      font-size: 10px;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      border-right: 1px solid #e0e0e0;
    }
  }
  
  .excel-grid {
    .grid-row {
      display: flex;
      
      .grid-cell {
        width: 80px;
        height: 18px;
        flex-shrink: 0;
        border-right: 1px solid #e0e0e0;
        border-bottom: 1px solid #e0e0e0;
        display: flex;
        align-items: center;
        padding: 0 4px;
        
        &.header {
          background: #f5f5f5;
          font-size: 10px;
          color: #666;
        }
        
        .cell-content {
          font-size: 10px;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          width: 100%;
        }
      }
    }
  }
}

.excel-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 22px;
  background: #f5f5f5;
  padding: 0 8px;
  border-top: 1px solid #d4d4d4;
  flex-shrink: 0;
  
  .status-text {
    font-size: 11px;
    color: #666;
  }
  
  .page-info {
    font-size: 11px;
    color: #666;
  }
  
  .zoom-info {
    font-size: 11px;
    color: #666;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
