<template>
  <div class="reader-word">
    <div class="word-titlebar">
      <div class="doc-name">{{ bookStore.currentBook?.bookName || '文档' }} - {{ bookStore.currentChapter?.title }}</div>
      <div class="window-btn">
        <img src="@/assets/svg/close.svg" alt="close" @click="handleClose" />
      </div>
    </div>
    <div class="word-toolbar"></div>
    
    <el-scrollbar class="word-content" ref="scrollbarRef">
      <div class="page-content" v-html="content" :style="contentStyle"></div>
    </el-scrollbar>
    
    <div class="word-statusbar">
      <div class="status-container">
        <span class="status-item">第 {{ bookStore.currentChapterIndex + 1 }} 章，共 {{ bookStore.chapterList.length }} 章</span>
        <span class="status-item">{{ content.length }} 个字</span>
        <span class="status-item status-btn" @click="emit('open-toc')">目录</span>
        <span class="status-item status-btn" :class="{'disabled': bookStore.currentChapterIndex <= 0}" @click="prevChapter" title="上一章">↑</span>
        <span class="status-item status-btn" :class="{'disabled': bookStore.currentChapterIndex >= bookStore.chapterList.length - 1}" @click="nextChapter" title="下一章">↓</span>
        <img src="@/assets/svg/settings.svg" class="status-item status-btn" alt="refresh" @click="emit('open-settings')" title="设置" />
      </div>
      <div>100%</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useBookStore } from '@/stores/modules/book'
import { storeToRefs } from 'pinia'
import { useReader } from '@/hooks/useReader'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['open-toc', 'open-settings', 'chapter-change'])

const bookStore = useBookStore()
const { readerSettings } = storeToRefs(bookStore)
const { closeCurrentWindow } = useReader()

const scrollbarRef = ref(null)
watch(() => props.content, (newVal) => {
  scrollbarRef.value?.scrollTo({ top: 0 })
})

bookStore.$subscribe((mutate, state) => {
  console.log("bookStore", mutate, state);
  // localStorage.setItem("talk", JSON.stringify(talkList.value));
});

watch(() => readerSettings.value.style, (newVal) => {
  console.log("style", newVal);
}, {
  immediate: true,
  deep: true
})

const contentStyle = computed(() => ({
  fontFamily: readerSettings.value.style?.fontFamily || 'Microsoft YaHei',
  fontSize: (readerSettings.value.style?.fontSize || 14) + 'px',
  lineHeight: readerSettings.value.style?.lineHeight || 1.2,
  color: readerSettings.value.style?.textColor || '#000000',
}))

const paragraphSpacing = computed(() => (readerSettings.value.style?.paragraphSpacing || 0) + 'px')

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
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
  padding: 0 16px;
  user-select: text;
  
  .page-content {
    width: 100%;
    max-width: 790px;
    min-width: 400px;
    background: #fff;
    margin: 16px 0;
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
      margin-right: 20px;

      &.status-btn {
        cursor: pointer;
          
        &.disabled {
          opacity: 0.8;
          cursor: not-allowed;
        }
      }
    }
    
    img.status-item {
      width: 11px;
      height: 11px;
      filter: var(--icon-filter);
    }
  }
}
</style>
