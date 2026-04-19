<template>
  <div class="reader-word" @keydown="handleKeyDown" tabindex="0" ref="containerRef">
    <div class="word-titlebar">
      <div class="doc-name">{{ bookStore.currentBook?.bookName || '文档' }}</div>
      <div class="window-btn">
        <img src="@/assets/svg/close.svg" alt="close" @click="handleClose" />
      </div>
    </div>
    <div class="word-toolbar"></div>
    
    <el-scrollbar class="word-content" ref="scrollbarRef" @scroll="handleScroll">
      <div class="page-content" v-html="content" :style="contentStyle"></div>
    </el-scrollbar>
    
    <div class="word-statusbar">
      <div class="status-container">
        <span class="status-item">{{ bookStore.currentChapter?.title }}</span>
        <span class="status-item">{{ content.length }} 个字</span>
        <span class="status-item status-btn" @click="emit('open-toc')">目录</span>
        <span class="status-item status-btn" :class="{'disabled': bookStore.currentChapterIndex <= 0}" @click="prevChapter" title="上一章">←</span>
        <span class="status-item status-btn" :class="{'disabled': bookStore.currentChapterIndex >= bookStore.chapterList.length - 1}" @click="nextChapter" title="下一章">→</span>
        <img src="@/assets/svg/settings.svg" class="status-item status-btn" alt="refresh" @click="emit('open-settings')" title="设置" />
      </div>
      <div class="status-right">
        <span class="auto-scroll-status" v-if="isAutoScrolling">
          {{ isAutoScrolling ? '滚动中' : '已暂停' }}
        </span>
        <span class="status-item status-btn" @click="toggleAutoScroll" :class="{'active': isAutoScrolling}" title="自动滚动">
          {{ isAutoScrolling ? '⏸' : '▶' }}
        </span>
        <span v-if="isAutoScrolling" class="status-item speed-indicator">{{ scrollSpeed }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useBookStore } from '@/stores/modules/book'
import { useReader } from '@/hooks/useReader'
import { useThrottleFn } from '@/hooks/useThrottle'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['open-toc', 'open-settings', 'chapter-change'])

const bookStore = useBookStore()
const { closeCurrentWindow } = useReader()

const scrollbarRef = ref(null)
const containerRef = ref(null)
const isProgramScrolling = ref(false)
const isAutoScrolling = ref(false)
let autoScrollTimer = null

const scrollSpeed = computed(() => {
  return bookStore.currentStyle?.scrollSpeed || 30
})

watch(() => props.content, () => {
  const progress = bookStore.getChapterProgress(bookStore.currentBook?.bookName)
  isProgramScrolling.value = true
  nextTick(() => {
    scrollbarRef.value?.scrollTo({ top: progress.scrollPosition || 0 })
    setTimeout(() => {
      isProgramScrolling.value = false
    }, 100)
  })
}, { immediate: true })

watch(() => scrollSpeed.value, () => {
  if (isAutoScrolling.value) {
    stopAutoScroll()
    startAutoScroll()
  }
})

const contentStyle = computed(() => ({
  fontFamily: bookStore.currentStyle?.fontFamily || 'Microsoft YaHei',
  fontSize: (bookStore.currentStyle?.fontSize || 14) + 'px',
  lineHeight: bookStore.currentStyle?.lineHeight || 1.2,
  color: bookStore.currentStyle?.textColor || '#000000',
}))

const paragraphSpacing = computed(() => (bookStore.currentStyle?.paragraphSpacing || 0) + 'px')

const prevChapter = () => {
  if (bookStore.currentChapterIndex > 0) {
    emit('chapter-change', bookStore.currentChapterIndex - 1)
    scrollbarRef.value?.scrollTo({ top: 0 })
  }
}

const nextChapter = () => {
  if (bookStore.currentChapterIndex < bookStore.chapterList.length - 1) {
    emit('chapter-change', bookStore.currentChapterIndex + 1)
    scrollbarRef.value?.scrollTo({ top: 0 })
  }
}

const { throttledFn: updateScrollThrottled } = useThrottleFn((scrollTop) => {
  bookStore.updateReadProgress(bookStore.currentBook?.bookName, bookStore.currentChapterIndex, scrollTop)
}, 100)

const handleScroll = (e) => {
  if (!isProgramScrolling.value) {
    updateScrollThrottled(e.scrollTop)
  }
  if (isAutoScrolling.value) {
    const maxScroll = scrollbarRef.value?.wrapRef?.scrollHeight - scrollbarRef.value?.wrapRef?.clientHeight || 0
    if (e.scrollTop >= maxScroll - 10) {
      stopAutoScroll()
    }
  }
}

const startAutoScroll = () => {
  if (autoScrollTimer) return
  isAutoScrolling.value = true
  const speed = scrollSpeed.value
  const interval = 50
  const step = speed / 10
  
  autoScrollTimer = setInterval(() => {
    if (scrollbarRef.value?.wrapRef) {
      const scrollTop = scrollbarRef.value.wrapRef.scrollTop
      const maxScroll = scrollbarRef.value.wrapRef.scrollHeight - scrollbarRef.value.wrapRef.clientHeight
      
      if (scrollTop >= maxScroll) {
        stopAutoScroll()
        return
      }
      
      isProgramScrolling.value = true
      scrollbarRef.value.wrapRef.scrollTop += step
      updateScrollThrottled(scrollbarRef.value.wrapRef.scrollTop)
      setTimeout(() => {
        isProgramScrolling.value = false
      }, 10)
    }
  }, interval)
}

const stopAutoScroll = () => {
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer)
    autoScrollTimer = null
  }
  isAutoScrolling.value = false
}

const toggleAutoScroll = () => {
  if (isAutoScrolling.value) {
    stopAutoScroll()
  } else {
    startAutoScroll()
  }
}

const handleKeyDown = (e) => {
  if (e.code === 'Space') {
    e.preventDefault()
    toggleAutoScroll()
  }
}

onMounted(() => {
  containerRef.value?.focus()
})

onUnmounted(() => {
  stopAutoScroll()
})

const handleClose = async () => {
  stopAutoScroll()
  await closeCurrentWindow()
}
</script>

<style lang="less" scoped>
.reader-word {
  font-family: 'Microsoft YaHei', sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f0f0;
}

.word-titlebar {
  position: relative;
  background: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  -webkit-app-region: drag;
  z-index: 9999;
  
  .doc-name {
    font-size: 12px;
    color: #333;
    max-width: 80%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .window-btn {
    -webkit-app-region: no-drag;
    position: absolute;
    right: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #666;
    cursor: pointer;
    border-radius: 2px;

    img {
      width: 20px;
      height: 20px;
      padding: 1px 2px;
    }
    
    &:hover {
      background: #e81123;

      img {
        filter: var(--icon-filter);
      }
    }
  }
}

.word-toolbar {
  height: 124px;
  background: #fff url('@/assets/images/word-header.png') no-repeat left center;
  background-size: 1920px 124px;
  
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
  overflow: hidden;
  padding: 0 16px;
  user-select: text;
  
  .page-content {
    width: 100%;
    max-width: 790px;
    min-width: 400px;
    background: #fff;
    margin: 16px auto;
    padding: 40px 50px;
    font-size: 15px;
    line-height: 2;
    color: #000;
    min-height: 500px;
    word-break: break-word;
    text-align: justify;
    
    :deep(p) {
      margin-bottom: v-bind('paragraphSpacing');
      text-indent: 2em;
    }
  }
}

.word-statusbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 22px;
  line-height: 22px;
  background: #2b579a;
  padding: 0 8px;
  color: #fff;
  font-size: 11px;

  .status-container {
    display: flex;
    align-items: center;

    .status-item {
      margin-right: 12px;

      &.status-btn {
        cursor: pointer;
        padding: 0 4px;
        border-radius: 2px;
        transition: background 0.2s;
          
        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        &.disabled {
          opacity: 0.8;
          cursor: not-allowed;
          
          &:hover {
            background: none;
          }
        }
        
        &.active {
          color: #ffd04b;
        }
      }
    }
    
    img.status-item {
      width: 18px;
      height: 18px;
      filter: var(--icon-filter);
    }
  }
  
  .status-right {
    display: flex;
    align-items: center;
    
    .auto-scroll-status {
      margin-right: 12px;
      color: #ffd04b;
      font-weight: 500;
    }
    
    .speed-indicator {
      min-width: 24px;
      text-align: center;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 0 6px;
      margin-left: 4px;
    }
  }
}
</style>
