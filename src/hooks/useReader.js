import { ref } from 'vue'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { useBookStore } from '@/stores/modules/book'
import { useThrottleFn } from './useThrottle'

const readerWindow = ref(null)
const readerLabel = 'novelReader'
let bookStore = null

export function useReader() {
  if (!bookStore) {
    bookStore = useBookStore()
  }
  
  const { throttledFn: updateBoundsThrottled } = useThrottleFn((bounds) => {
    console.log('bounds: ', bounds);
    bookStore.updateWindowBounds(bounds)
  }, 200)
  
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
      
      readerWindow.value.onMoved(async (e) => {
        const { x, y } = e.payload
        updateBoundsThrottled({ x, y })
      })
      
      readerWindow.value.onResized(async (e) => {
        const { width, height } = e.payload
        updateBoundsThrottled({ width, height })
      })

      readerWindow.value.once('tauri://destroyed', async () => {
        console.log('阅读窗口已关闭')
        readerWindow.value = null
      })
      
      return readerWindow.value
    } catch (e) {
      console.error('打开阅读窗口失败:', e)
      throw e
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
      await initReaderWindow()
      if (readerWindow.value) {
        await readerWindow.value.close()
        readerWindow.value = null
      }
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
