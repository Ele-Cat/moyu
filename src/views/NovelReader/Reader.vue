<template>
  <div class="reader-wrapper">
    <WordStyle 
      v-if="currentMode === 'word'"
      :content="chapterContent"
      @chapter-change="handleChapterChange"
      @open-toc="showToc = true"
      @open-settings="showSettings = true"
    />
    <ExcelStyle 
      v-else-if="currentMode === 'excel'"
      :content="chapterContent"
      @chapter-change="handleChapterChange"
      @open-toc="showToc = true"
    />
    <NormalStyle 
      v-else
      :content="chapterContent"
      @chapter-change="handleChapterChange"
      @open-toc="showToc = true"
    />

    <TocModal v-model="showToc" @loadChapter="loadChapter" />
    <SettingsDrawer v-model="showSettings" :currentMode="currentMode" />
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
import TocModal from './components/TocModal.vue'
import SettingsDrawer from './components/SettingsDrawer.vue'

const route = useRoute()
const bookStore = useBookStore()
const appStore = useAppStore()

const chapterContent = ref('')
const showToc = ref(false)
const showSettings = ref(false)

const currentMode = computed(() => bookStore.getWindowStyle())

const loadChapter = async (index, restoreProgress = false) => {
  showToc.value = false
  bookStore.setCurrentChapterIndex(index)
  const progress = bookStore.getChapterProgress(bookStore.currentBook.bookName)
  chapterContent.value = await bookStore.getChapterContent(index)
  bookStore.updateReadProgress(bookStore.currentBook.bookName, index, restoreProgress ? progress.scrollPosition : 0)
}

const handleChapterChange = async (index) => {
  await loadChapter(index)
}

const initBook = async () => {
  const bookName = route.query.book
  const format = route.query.format
  
  if (bookName && format) {
    await bookStore.scanBooks(appStore.storagePath)
    const book = bookStore.books.find(b => b.bookName === decodeURIComponent(bookName))
    
    if (book) {
      await bookStore.loadBook(book)
      
      const progress = bookStore.getChapterProgress(book.bookName)
      bookStore.updateReadProgress(book.bookName, progress.chapterIndex, progress.scrollPosition)
      
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
