<template>
  <div class="novel-reader">
    <div class="content">
      <div v-if="!currentBook" class="select-area">
        <button @click="selectFolder">📂 选择小说文件夹</button>
        <p class="tip">请选择包含 txt 文件的文件夹</p>

        <div v-if="bookList.length > 0" class="book-list">
          <div
            v-for="book in bookList"
            :key="book.path"
            class="book-item"
            @click="openBook(book)"
          >
            {{ book.name }}
          </div>
        </div>
      </div>

      <div v-else class="reader-area">
        <div class="reader-toolbar">
          <span>{{ currentBook.name }}</span>
          <button @click="closeBook">关闭</button>
        </div>
        <div class="reader-content" :style="readerStyle">
          <div v-for="(chapter, index) in chapters" :key="index" :id="'chapter-' + index">
            <h3 v-if="chapter.title">{{ chapter.title }}</h3>
            <p v-for="(line, lineIndex) in chapter.content" :key="lineIndex">
              {{ line }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showSettings" class="settings-panel">
      <h3>阅读设置</h3>

      <div class="setting-row">
        <label>字体大小：{{ fontSize }}px</label>
        <input type="range" min="12" max="24" v-model="fontSize" @change="saveSettings" />
      </div>

      <div class="setting-row">
        <label>背景颜色：</label>
        <select v-model="bgColor" @change="saveSettings">
          <option value="#f5f5f5">浅灰</option>
          <option value="#ffffff">白色</option>
          <option value="#1a1a1a">黑色</option>
        </select>
      </div>

      <div class="setting-row">
        <label>行间距：</label>
        <select v-model="lineHeight" @change="saveSettings">
          <option value="1.5">紧凑</option>
          <option value="1.8">正常</option>
          <option value="2.2">宽松</option>
        </select>
      </div>

      <button @click="showSettings = false">关闭</button>
    </div>

    <button v-if="currentBook" class="settings-btn" @click="showSettings = true">
      ⚙️
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { load } from '@tauri-apps/plugin-store'

const bookList = ref([])
const currentBook = ref(null)
const bookContent = ref('')
const chapters = ref([])
const showSettings = ref(false)

const fontSize = ref(16)
const bgColor = ref('#f5f5f5')
const lineHeight = ref('1.8')

const readerStyle = computed(() => ({
  fontSize: fontSize.value + 'px',
  backgroundColor: bgColor.value,
  lineHeight: lineHeight.value,
  color: bgColor.value === '#1a1a1a' ? '#ccc' : '#333',
}))

async function selectFolder() {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: '选择小说文件夹',
    })

    if (selected) {
      const files = await invoke('scan_folder', {
        path: selected,
        extensions: ['txt'],
      })
      bookList.value = files
    }
  } catch (e) {
    console.error('选择文件夹失败:', e)
    alert('选择文件夹失败: ' + e)
  }
}

async function openBook(book) {
  try {
    const content = await invoke('read_novel_content', { path: book.path })
    bookContent.value = content
    currentBook.value = book
    parseChapters()
    await loadReadingProgress()
  } catch (e) {
    console.error('打开书籍失败:', e)
    alert('打开书籍失败: ' + e)
  }
}

function parseChapters() {
  const lines = bookContent.value.split('\n')
  const parsed = []
  let currentChapter = { title: '', content: [] }

  const chapterPattern = /^(第[一二三四五六七八九十\d]+章|Chapter \d+)/

  for (const line of lines) {
    const trimmed = line.trim()
    if (chapterPattern.test(trimmed)) {
      if (currentChapter.content.length > 0) {
        parsed.push(currentChapter)
      }
      currentChapter = { title: trimmed, content: [] }
    } else if (trimmed) {
      currentChapter.content.push(trimmed)
    }
  }

  if (currentChapter.content.length > 0) {
    parsed.push(currentChapter)
  }

  if (parsed.length === 0) {
    parsed.push({ title: currentBook.value?.name || '内容', content: lines.filter(l => l.trim()) })
  }

  chapters.value = parsed
}

function closeBook() {
  currentBook.value = null
  bookContent.value = ''
  chapters.value = []
}

async function saveSettings() {
  try {
    const store = await load('settings.json', { autoSave: true, defaults: {} })
    await store.set('novelSettings', {
      fontSize: fontSize.value,
      bgColor: bgColor.value,
      lineHeight: lineHeight.value,
    })
  } catch (e) {
    console.error('保存设置失败:', e)
  }
}

async function loadReadingProgress() {
  try {
    const store = await load('settings.json', { autoSave: false, defaults: {} })
    const settings = await store.get({
      fontSize: 'number',
      bgColor: '',
      lineHeight: '',
    }, 'novelSettings')

    if (settings) {
      fontSize.value = settings.fontSize || 16
      bgColor.value = settings.bgColor || '#f5f5f5'
      lineHeight.value = settings.lineHeight || '1.8'
    }
  } catch (e) {
    console.error('加载设置失败:', e)
  }
}

onMounted(() => {
  loadReadingProgress()
})
</script>

<style scoped>
.novel-reader {
  display: flex;
  flex-direction: column;
  background: #fff;
}

.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.select-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.select-area button {
  padding: 15px 30px;
  font-size: 18px;
  border: none;
  border-radius: 10px;
  background: #667eea;
  color: #fff;
  cursor: pointer;
}

.tip {
  margin-top: 15px;
  color: #888;
}

.book-list {
  margin-top: 30px;
  width: 100%;
  max-width: 500px;
  max-height: 300px;
  overflow-y: auto;
}

.book-item {
  padding: 12px 20px;
  margin-bottom: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.book-item:hover {
  background: #e0e0e0;
}

.reader-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reader-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.reader-toolbar button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background: #667eea;
  color: #fff;
  cursor: pointer;
}

.reader-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
  max-width: 800px;
  margin: 0 auto;
}

.reader-content h3 {
  margin: 20px 0 15px;
  color: #667eea;
}

.reader-content p {
  margin-bottom: 10px;
  text-indent: 2em;
}

.settings-panel {
  position: fixed;
  right: 20px;
  top: 80px;
  width: 300px;
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.settings-panel h3 {
  margin-bottom: 20px;
}

.setting-row {
  margin-bottom: 15px;
}

.setting-row label {
  display: block;
  margin-bottom: 8px;
}

.setting-row input,
.setting-row select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
}

.settings-btn {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 50px;
  height: 50px;
  border: none;
  border-radius: 50%;
  background: #667eea;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}
</style>
