import { ref } from 'vue'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'

const readerWindow = ref(null)
const readerLabel = 'novelReader'

export function useReader() {
  async function openReaderWindow(book) {
    try {
      await closeReaderWindow()
      
      const windowWidth = 800
      const windowHeight = 600
      const x = Math.floor((window.screen.availWidth - windowWidth) / 2)
      const y = Math.floor((window.screen.availHeight - windowHeight) / 2)
      
      const url = `/sub/novel-reader?book=${encodeURIComponent(book.filePath)}&format=${book.format}`
      
      readerWindow.value = new WebviewWindow(readerLabel, {
        url,
        title: book.bookName || '小说阅读',
        width: windowWidth,
        height: windowHeight,
        x,
        y,
        center: true,
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
        readerWindow.value = null
      })
      
      return readerWindow.value
    } catch (e) {
      console.error('打开阅读窗口失败:', e)
      throw e
    }
  }
  
  async function closeReaderWindow() {
    if (!readerWindow.value) {
      try {
        const existingWindow = await WebviewWindow.getByLabel(readerLabel)
        if (existingWindow) {
          await existingWindow.close()
        }
      } catch (e) {
        console.log('窗口不存在或已关闭')
      }
      return
    }
    
    try {
      await readerWindow.value.close()
    } catch (e) {
      console.log('关闭窗口失败:', e)
    } finally {
      readerWindow.value = null
    }
  }
  
  async function isReaderWindowOpen() {
    if (readerWindow.value) {
      return true
    }
    try {
      const existingWindow = await WebviewWindow.getByLabel(readerLabel)
      return !!existingWindow
    } catch (e) {
      return false
    }
  }
  
  async function focusReaderWindow() {
    try {
      const existingWindow = await WebviewWindow.getByLabel(readerLabel)
      if (existingWindow) {
        await existingWindow.setFocus()
        return true
      }
    } catch (e) {
      console.log('聚焦窗口失败:', e)
    }
    return false
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
      await readerWindow.value.close()
      readerWindow.value = null
      // const { getCurrentWebviewWindow } = await import('@tauri-apps/api/webviewWindow')
      // const currentWindow = getCurrentWebviewWindow()
      // console.log('currentWindow: ', currentWindow);
      // if (currentWindow) {
      //   await currentWindow.close()
      // }
    } catch (e) {
      console.error('关闭当前窗口失败:', e)
    }
  }
  
  return {
    readerWindow,
    openReaderWindow,
    closeReaderWindow,
    closeCurrentWindow,
    isReaderWindowOpen,
    focusReaderWindow,
    initReaderWindow,
  }
}
