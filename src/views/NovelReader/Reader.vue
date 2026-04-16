<template>
  <div class="reader-wrapper">
    <WordStyle 
      v-if="currentMode === 'word'"
      :content="chapterContent"
      @chapter-change="handleChapterChange"
      @navigate="handleNavigate"
    />
    <ExcelStyle 
      v-else-if="currentMode === 'excel'"
      :content="chapterContent"
      @chapter-change="handleChapterChange"
      @navigate="handleNavigate"
    />
    <NormalStyle 
      v-else
      :content="chapterContent"
      @chapter-change="handleChapterChange"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBookStore } from '@/stores/modules/book'
import { useAppStore } from '@/stores/modules/app'
import WordStyle from './modules/WordStyle.vue'
import ExcelStyle from './modules/ExcelStyle.vue'
import NormalStyle from './modules/NormalStyle.vue'

const route = useRoute()
const bookStore = useBookStore()
const appStore = useAppStore()

const chapterContent = ref('')

const currentMode = computed(() => bookStore.getWindowStyle())

const loadChapter = async (index, restoreProgress = false) => {
  bookStore.setCurrentChapterIndex(index)
  chapterContent.value = await bookStore.getChapterContent(index)
}

const handleChapterChange = async (index) => {
  await loadChapter(index)
}

const handleNavigate = (direction) => {
  console.log('Navigate:', direction)
}

const initBook = async () => {
  const bookPath = route.query.book
  const format = route.query.format
  
  if (bookPath && format) {
    await bookStore.scanBooks(appStore.storagePath)
    const book = bookStore.books.find(b => b.filePath === decodeURIComponent(bookPath))
    
    if (book) {
      await bookStore.loadBook(book)
      
      const progress = bookStore.getChapterProgress(book.filePath)
      bookStore.updateReadTime(book.filePath, progress.chapterIndex, progress.scrollPosition)
      
      if (bookStore.chapterList.length > 0) {
        const targetIndex = Math.min(progress.chapterIndex, bookStore.chapterList.length - 1)
        await loadChapter(targetIndex, true)
      }
    }
  }
}

onMounted(() => {
  initBook()
})
</script>

<style lang="less" scoped>
.reader-wrapper {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}
</style>
