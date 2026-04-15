import { ref } from 'vue'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useBookStore } from '@/stores/modules/book'

const readerWindow = ref(null)
const readerLabel = 'novelReader'
let bookStore = null

export function useReader() {
  if (!bookStore) {
    bookStore = useBookStore()
  }
  
  async function openReaderWindow(book) {
    try {
      await closeCurrentWindow()
      
      const bounds = bookStore.getWindowBounds()
      console.log('[useReader] 当前窗口配置:', bounds)
      const windowWidth = bounds.width || 800
      const windowHeight = bounds.height || 600
      
      let x, y
      if (bounds.x !== null && bounds.y !== null) {
        x = bounds.x
        y = bounds.y
      } else {
        x = Math.floor((window.screen.availWidth - windowWidth) / 2)
        y = Math.floor((window.screen.availHeight - windowHeight) / 2)
      }
      
      const url = `/sub/novel-reader?book=${encodeURIComponent(book.filePath)}&format=${book.format}`
      
      readerWindow.value = new WebviewWindow(readerLabel, {
        url,
        title: book.bookName || '小说阅读',
        width: windowWidth,
        height: windowHeight,
        x,
        y,
        center: !bounds.x && !bounds.y,
        decorations: false,
        resizable: true,
        skipTaskbar: true,
        focus: true,
      })
      
      readerWindow.value.once('tauri://created', () => {
        console.log('阅读窗口创建成功:', readerLabel)
      })
      
      readerWindow.value.once('tauri://error', (e) => {
        console.error('创建阅读窗口失败:', e)
        readerWindow.value = null
      })
      
      readerWindow.value.once('tauri://destroyed', () => {
        console.log('阅读窗口已关闭')
        saveWindowBounds()
        readerWindow.value = null
      })
      
      return readerWindow.value
    } catch (e) {
      console.error('打开阅读窗口失败:', e)
      throw e
    }
  }
  
  async function saveWindowBounds() {
    try {
      let existingWindow = await WebviewWindow.getByLabel(readerLabel)
      if (existingWindow) {
        const position = await existingWindow.outerPosition()
        const size = await existingWindow.outerSize()
        bookStore.updateWindowBounds({
          x: position.x,
          y: position.y,
          width: size.width,
          height: size.height
        })
        console.log('窗口位置已保存:', { x: position.x, y: position.y, width: size.width, height: size.height })
      }
    } catch (e) {
      console.error('保存窗口位置失败:', e)
    }
  }
  
  async function initReaderWindow() {
    try {
      const existingWindow = await WebviewWindow.getByLabel(readerLabel)
      if (existingWindow) {
        readerWindow.value = existingWindow
      }
    } catch (e) {
      console.log('初始化阅读窗口状态失败:', e)
    }
  }

  async function closeCurrentWindow() {
    try {
      await saveWindowBounds()
      await initReaderWindow()
      await readerWindow.value.close()
      readerWindow.value = null
    } catch (e) {
      console.error('关闭当前窗口失败:', e)
    }
  }
  
  return {
    readerWindow,
    openReaderWindow,
    closeCurrentWindow,
    initReaderWindow,
  }
}
