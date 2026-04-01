<template>
  <div class="novel-reader">
    <div class="reader-header">
      <div class="tabs">
        <div
          class="tab"
          :class="{ active: activeTab === 'bookshelf' }"
          @click="activeTab = 'bookshelf'"
        >
          书架
        </div>
        <div
          class="tab"
          :class="{ active: activeTab === 'search' }"
          @click="activeTab = 'search'"
        >
          搜索
        </div>
        <div
          class="tab"
          :class="{ active: activeTab === 'sourceManage' }"
          @click="activeTab = 'sourceManage'"
        >
          书源
        </div>
      </div>
    </div>

    <div class="reader-content">
      <Bookshelf
        v-if="activeTab === 'bookshelf'"
        @select-book="handleSelectBook"
      />
      <Search
        v-if="activeTab === 'search'"
        @select-book="handleSelectBook"
        @change-tab="activeTab = $event"
      />
      <SourceManage
        v-if="activeTab === 'sourceManage'"
      />
    </div>

    <el-dialog
      v-model="showBookDetail"
      :title="currentBook?.bookName"
      width="80%"
      destroy-on-close
    >
      <div v-if="currentBook" class="book-detail">
        <div class="detail-header">
          <img
            v-if="currentBook.coverUrl"
            :src="currentBook.coverUrl"
            class="detail-cover"
            @error="currentBook.coverUrl = ''"
          />
          <div v-else class="detail-cover placeholder">📖</div>
          <div class="detail-info">
            <p><strong>作者:</strong> {{ currentBook.author }}</p>
            <p><strong>字数:</strong> {{ currentBook.wordCount }}</p>
            <p><strong>最新:</strong> {{ currentBook.latestChapter }}</p>
          </div>
        </div>
        <div class="detail-desc">{{ currentBook.intro }}</div>
        <div class="detail-actions">
          <button @click="handleSwitchSource">换源</button>
          <button class="read-btn" @click="startReading">开始阅读</button>
        </div>

        <div v-if="loadingChapters" class="loading">加载章节中...</div>
        <div v-else-if="chapterList.length > 0" class="chapter-list">
          <div
            v-for="(chapter, index) in chapterList"
            :key="index"
            class="chapter-item"
            @click="readChapter(chapter)"
          >
            {{ chapter.title }}
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="showSwitchSource"
      title="换源"
      width="80%"
      destroy-on-close
    >
      <div v-if="showSwitchSource && currentBook" class="source-list">
        <div
          v-for="source in bookSourceList"
          :key="source.sourceUrl"
          class="source-item"
          @click="changeSource(source)"
        >
          <span class="source-name">{{ source.sourceName }}</span>
          <span class="chapter-count">{{ source.chapterCount }}章</span>
        </div>
      </div>
    </el-dialog>

    <div v-if="reading" class="reading-view">
      <div class="reading-header">
        <span class="back-btn" @click="closeReading">← 返回</span>
        <span class="chapter-title">{{ currentChapter?.title }}</span>
        <span class="settings-btn" @click="showSettings = true">⚙️</span>
      </div>
      <div class="reading-content" :style="readerStyle">
        <div class="chapter-content" v-html="chapterContent"></div>
      </div>
      <div class="reading-footer">
        <button @click="prevChapter">上一章</button>
        <span class="page-info">{{ currentChapterIndex + 1 }} / {{ chapterList.length }}</span>
        <button @click="nextChapter">下一章</button>
      </div>
    </div>

    <div v-if="showSettings" class="settings-overlay" @click="showSettings = false">
      <div class="settings-panel" @click.stop>
        <h3>阅读设置</h3>
        <div class="setting-row">
          <label>字体大小：{{ fontSize }}px</label>
          <input type="range" min="12" max="28" v-model="fontSize" />
        </div>
        <div class="setting-row">
          <label>背景：</label>
          <div class="bg-options">
            <span
              v-for="bg in bgOptions"
              :key="bg.value"
              class="bg-option"
              :class="{ active: bgColor === bg.value }"
              :style="{ background: bg.value }"
              @click="bgColor = bg.value"
            ></span>
          </div>
        </div>
        <div class="setting-row">
          <label>间距：</label>
          <select v-model="lineHeight">
            <option value="1.5">紧凑</option>
            <option value="1.8">正常</option>
            <option value="2.2">宽松</option>
          </select>
        </div>
        <button class="close-settings" @click="showSettings = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useBookSourceStore } from '@/stores/modules/bookSource'
import { buildSearchUrl, parseSearchResult, parseHeader, buildCatalogUrl, parseCatalog, buildContentUrl, parseContent } from '@/views/NovelReader/utils'
import Bookshelf from './modules/Bookshelf.vue'
import Search from './modules/Search.vue'
import SourceManage from './modules/SourceManage.vue'

const bookSourceStore = useBookSourceStore()

const activeTab = ref('search')
const showBookDetail = ref(false)
const showSwitchSource = ref(false)
const currentBook = ref(null)
const chapterList = ref([])
const loadingChapters = ref(false)
const bookSourceList = ref([])
const reading = ref(false)
const currentChapterIndex = ref(0)
const chapterContent = ref('')
const currentChapter = ref(null)
const showSettings = ref(false)

const fontSize = ref(16)
const bgColor = ref('#f5f5f5')
const lineHeight = ref('1.8')

const bgOptions = [
  { value: '#f5f5f5', name: '浅灰' },
  { value: '#ffffff', name: '白色' },
  { value: '#1a1a1a', name: '黑色' },
  { value: '#e6f7ff', name: '浅蓝' },
  { value: '#f6ffed', name: '浅绿' },
]

const readerStyle = computed(() => ({
  fontSize: fontSize.value + 'px',
  backgroundColor: bgColor.value,
  lineHeight: lineHeight.value,
  color: bgColor.value === '#1a1a1a' ? '#ccc' : '#333',
}))

function handleSelectBook(book) {
  getBookDetail(book)
}

async function getBookDetail(book) {
  currentBook.value = { ...book }
  showBookDetail.value = true
  loadingChapters.value = true
  chapterList.value = []

  try {
    const source = bookSourceStore.sources.find(s =>
      s.bookSourceUrl === book.sourceUrl ||
      s.bookSourceUrl === bookSourceStore.currentSource?.bookSourceUrl
    ) || bookSourceStore.currentSource

    if (!source) {
      alert('请先选择书源')
      return
    }

    const headers = parseHeader(source.header)
    headers['User-Agent'] = headers['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

    const catalogUrl = buildCatalogUrl(source, book.bookUrl)
    
    const res = await invoke('fetch_api', {
      options: {
        url: catalogUrl,
        method: 'GET',
        headers: headers,
        return_type: 'text'
      }
    })

    if (res.body && typeof res.body === 'string') {
      const ruleToc = source.ruleToc || {}
      const chapters = parseCatalog(res.body, ruleToc)
      
      chapterList.value = chapters.map((ch, i) => ({
        title: ch.title,
        url: ch.url,
        index: i
      }))

      if (book.bookName) {
        currentBook.value.intro = book.intro || ''
        currentBook.value.wordCount = book.wordCount || ''
        currentBook.value.latestChapter = book.latestChapter || (chapters.length > 0 ? chapters[chapters.length - 1].title : '')
        currentBook.value.coverUrl = book.coverUrl || ''
      }
    }
  } catch (e) {
    console.error('获取详情失败:', e)
  } finally {
    loadingChapters.value = false
  }
}

async function handleSwitchSource() {
  bookSourceList.value = []
  showSwitchSource.value = true

  const enabledSources = bookSourceStore.getEnabledSources
  for (const source of enabledSources) {
    try {
      const headers = parseHeader(source.header)
      headers['User-Agent'] = headers['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

      const catalogUrl = buildCatalogUrl(source, currentBook.value.bookUrl)
      
      const res = await invoke('fetch_api', {
        options: {
          url: catalogUrl,
          method: 'GET',
          headers: headers,
          return_type: 'text'
        }
      })

      if (res.body && typeof res.body === 'string') {
        const ruleToc = source.ruleToc || {}
        const chapters = parseCatalog(res.body, ruleToc)

        bookSourceList.value.push({
          sourceName: source.bookSourceName,
          sourceUrl: source.bookSourceUrl,
          chapterCount: chapters.length
        })
      }
    } catch (e) {
      console.error(`获取 ${source.bookSourceName} 失败:`, e)
    }
  }
}

function changeSource(source) {
  const newSource = bookSourceStore.sources.find(s => s.bookSourceUrl === source.sourceUrl)
  if (newSource) {
    bookSourceStore.setCurrentSource(newSource)
    showSwitchSource.value = false
    getBookDetail({
      ...currentBook.value,
      sourceUrl: source.sourceUrl
    })
  }
}

function startReading() {
  if (chapterList.value.length > 0) {
    reading.value = true
    currentChapterIndex.value = 0
    readChapter(chapterList.value[0])
    addToBookshelf()
  }
}

function addToBookshelf() {
  bookSourceStore.addToBookshelf({
    ...currentBook.value,
    readProgress: '未阅读'
  })
}

async function readChapter(chapter) {
  currentChapter.value = chapter
  currentChapterIndex.value = chapter.index
  chapterContent.value = '<p>加载中...</p>'

  try {
    const source = bookSourceStore.sources.find(s =>
      s.bookSourceUrl === currentBook.value.sourceUrl
    ) || bookSourceStore.currentSource

    const headers = parseHeader(source.header)
    headers['User-Agent'] = headers['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

    const contentUrl = buildContentUrl(source, chapter.url)

    const res = await invoke('fetch_api', {
      options: {
        url: contentUrl,
        method: 'GET',
        headers: headers,
        return_type: 'text'
      }
    })

    if (res.body && typeof res.body === 'string') {
      const ruleContent = source.ruleContent || {}
      const content = parseContent(res.body, ruleContent, source)
      chapterContent.value = content || '<p>加载失败</p>'

      bookSourceStore.updateBookProgress(currentBook.value.bookUrl, chapter.title)
    }
  } catch (e) {
    console.error('加载章节失败:', e)
    chapterContent.value = '<p>加载失败</p>'
  }
}

function prevChapter() {
  if (currentChapterIndex.value > 0) {
    currentChapterIndex.value--
    readChapter(chapterList.value[currentChapterIndex.value])
  }
}

function nextChapter() {
  if (currentChapterIndex.value < chapterList.value.length - 1) {
    currentChapterIndex.value++
    readChapter(chapterList.value[currentChapterIndex.value])
  }
}

function closeReading() {
  reading.value = false
}

onMounted(async () => {
  await bookSourceStore.init()
  if (bookSourceStore.sources.length > 0 && !bookSourceStore.currentSource) {
    const enabled = bookSourceStore.getEnabledSources
    if (enabled.length > 0) {
      bookSourceStore.setCurrentSource(enabled[0])
    }
  }
})
</script>

<style lang="less" scoped>
.novel-reader {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-color, #f5f5f5);
}

.reader-header {
  padding: 10px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.tabs {
  display: flex;
  gap: 10px;
}

.tab {
  padding: 8px 20px;
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.3s;
  font-size: 14px;

  &.active {
    background: #667eea;
    color: #fff;
  }

  &:hover:not(.active) {
    background: #f0f0f0;
  }
}

.reader-content {
  flex: 1;
  overflow: hidden;
  background: #f5f5f5;
}

.book-detail {
  .detail-header {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
  }

  .detail-cover {
    width: 100px;
    height: 140px;
    object-fit: cover;
    border-radius: 6px;

    &.placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e0e0e0;
      font-size: 40px;
    }
  }

  .detail-info {
    flex: 1;
    font-size: 14px;

    p {
      margin: 5px 0;
    }
  }

  .detail-desc {
    font-size: 14px;
    line-height: 1.8;
    color: #666;
    max-height: 100px;
    overflow-y: auto;
    margin-bottom: 15px;
  }

  .detail-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;

    button {
      padding: 10px 20px;
      border: 1px solid #667eea;
      border-radius: 20px;
      cursor: pointer;
      background: #fff;
      color: #667eea;
      font-size: 14px;

      &.read-btn {
        background: #667eea;
        color: #fff;
      }
    }
  }
}

.chapter-list {
  max-height: 300px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chapter-item {
  padding: 10px;
  background: #f5f5f5;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #e0e0e0;
  }
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.source-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: #e0e0e0;
  }

  .source-name {
    font-weight: bold;
  }

  .chapter-count {
    color: #888;
    font-size: 13px;
  }
}

.reading-view {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.reading-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: #fff;
  border-bottom: 1px solid #eee;

  .back-btn {
    color: #667eea;
    cursor: pointer;
  }

  .chapter-title {
    flex: 1;
    text-align: center;
    font-weight: bold;
    font-size: 14px;
    padding: 0 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .settings-btn {
    font-size: 20px;
    cursor: pointer;
  }
}

.reading-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 25px;
}

.chapter-content {
  max-width: 800px;
  margin: 0 auto;

  :deep(p) {
    margin-bottom: 15px;
    text-indent: 2em;
  }
}

.reading-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-top: 1px solid #eee;

  button {
    padding: 8px 20px;
    background: #667eea;
    color: #fff;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
  }

  .page-info {
    color: #888;
    font-size: 13px;
  }
}

.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
}

.settings-panel {
  width: 80%;
  max-width: 350px;
  background: #fff;
  border-radius: 12px;
  padding: 20px;

  h3 {
    margin-bottom: 20px;
    text-align: center;
  }

  .setting-row {
    margin-bottom: 20px;

    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
    }

    input[type="range"] {
      width: 100%;
    }

    select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 6px;
    }
  }

  .bg-options {
    display: flex;
    gap: 10px;

    .bg-option {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      cursor: pointer;
      border: 2px solid transparent;

      &.active {
        border-color: #667eea;
      }
    }
  }

  .close-settings {
    width: 100%;
    padding: 10px;
    background: #667eea;
    color: #fff;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 10px;
    font-size: 14px;
  }
}

.loading {
  text-align: center;
  padding: 20px;
  color: #888;
}
</style>
