import { ref } from 'vue'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { listen } from '@tauri-apps/api/event'
import { useReminderStore } from '@/stores/modules/reminder'

const reminderWindows = ref({})
let reminderStore = null
let worker = null

export function useReminder() {
  if (!reminderStore) {
    reminderStore = useReminderStore()
  }
  
  async function openReminderWindow(reminder) {
    console.log('reminder: ', reminder);
    const label = `reminder_${reminder.id}_${Date.now()}`
    reminder.label = label
    
    try {
      const url = `/sub/reminder?${encodeURIComponent(JSON.stringify(reminder))}`
      
      const windowWidth = 260
      const windowHeight = 320
      const gapX = 20
      const gapY = 16
      let x, y
      
      switch (reminder.position) {
        case 'top-left':
          x = gapX
          y = gapY
          break
        case 'top-right':
          x = window.screen.availWidth - windowWidth - gapX
          y = gapY
          break
        case 'bottom-left':
          x = gapX
          y = window.screen.availHeight - windowHeight - gapY
          break
        case 'bottom-right':
          x = window.screen.availWidth - windowWidth - gapX
          y = window.screen.availHeight - windowHeight - gapY
          break
        default:
          x = window.screen.availWidth - windowWidth - gapX
          y = window.screen.availHeight - windowHeight - gapY
      }
      
      const reminderWindow = new WebviewWindow(label, {
        url,
        title: '待办提醒',
        width: windowWidth,
        height: windowHeight,
        x,
        y,
        resizable: false,
        transparent: true,
        visible: false,
        decorations: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        focus: false,
      })
      
      reminderWindow.once('tauri://created', async () => {
        console.log('提醒窗口创建成功:', label)
        setTimeout(async () => {
          await reminderWindow.show()
        }, 100)
        
        if (worker) {
          worker.postMessage({ type: 'activeReminder', data: { id: reminder.id } })
        }
      })
      
      reminderWindow.once('tauri://error', (e) => {
        console.error('创建提醒窗口失败:', e)
      })
      
      const unlistenSnooze = await listen('reminder-action-snooze', (event) => {
        closeReminderWindow(event.payload.label)
        handleReminderSnooze(event.payload)
      })
      
      const unlistenDone = await listen('reminder-action-done', (event) => {
        closeReminderWindow(event.payload.label)
        handleReminderDone(event.payload)
      })
      
      const unlistenClose = await listen('reminder-action-close', (event) => {
        closeReminderWindow(event.payload.label)
      })
      
      reminderWindows.value[label] = {
        window: reminderWindow,
        unlistenSnooze,
        unlistenDone,
        unlistenClose,
      }
      
      return reminderWindow
    } catch (e) {
      console.error('打开提醒窗口失败:', e)
      throw e
    }
  }
  
  async function handleReminderSnooze(reminder) {
    const snoozeTime = reminder.snoozeTime || 10
    const timeType = reminder.timeType || 'minute'
    const delayMs = timeType === 'hour' 
      ? snoozeTime * 60 * 60 * 1000 
      : snoozeTime * 60 * 1000
    
    const runMode = reminder.runMode || 'time'
    
    if (runMode === 'time') {
      reminderStore.snoozeTodo(reminder.id, timeType === 'hour' ? snoozeTime * 60 : snoozeTime)
    } else {
      setTimeout(() => {
        openReminderWindow(reminder)
      }, delayMs)
    }
    
    if (worker) {
      worker.postMessage({ type: 'closedReminder', data: { id: reminder.id } })
    }
  }
  
  async function handleReminderDone(reminder) {
    const runMode = reminder.runMode || 'time'
    
    if (runMode === 'time') {
      reminderStore.completeTodo(reminder.id)
    }
  }
  
  async function closeReminderWindow(label) {
    if (!label) return
    
    const winInfo = reminderWindows.value[label]
    if (!winInfo) return
    
    if (winInfo.closing) return
    winInfo.closing = true
    
    const { window, unlistenSnooze, unlistenDone, unlistenClose } = winInfo
    if (unlistenSnooze) unlistenSnooze()
    if (unlistenDone) unlistenDone()
    if (unlistenClose) unlistenClose()
    
    if (window) {
      try {
        await window.close()
      } catch (e) {
        console.log('窗口已关闭或不存在')
      }
    }
    delete reminderWindows.value[label]
  }
  
  async function closeAllReminderWindows() {
    await initReminderWindows()
    for (const label of Object.keys(reminderWindows.value)) {
      await closeReminderWindow(label)
    }
  }

  async function initReminderWindows() {
    const { getAllWebviewWindows } = await import('@tauri-apps/api/webviewWindow')
    const allWindows = await getAllWebviewWindows()
    const reminderLabels = allWindows
      .filter(win => win.label.startsWith('reminder_'))
      .map(win => win.label)
    
    for (const label of reminderLabels) {
      if (!reminderWindows.value[label]) {
        const reminderWindow = await WebviewWindow.getByLabel(label)
        if (reminderWindow) {
          reminderWindows.value[label] = {
            window: reminderWindow,
          }
        }
      }
    }
  }
  
  return {
    reminderWindows,
    openReminderWindow,
    handleReminderSnooze,
    closeReminderWindow,
    closeAllReminderWindows,
    initReminderWindows,
    refreshWorker: (todos) => {
      if (worker) {
        worker.postMessage({ 
          type: 'update', 
          data: { 
            todos: JSON.parse(JSON.stringify(todos)) 
          } 
        })
      }
    },
    setWorkerRef: (w) => {
      worker = w
    }
  }
}
