import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { setDesktopUnderlay } from 'tauri-plugin-desktop-underlay-api'
import { useWallpaperStore } from '@/stores/modules/wallpaper'

const underlayWindow = ref(null)

export function useVideoWallpaper() {
  const wallpaperStore = useWallpaperStore()

  async function openVideoWallpaper(item) {
    try {
      if (underlayWindow.value) {
        await setDesktopUnderlay(false, 'underlay')
        await underlayWindow.value.close()
      }
      
      underlayWindow.value = new WebviewWindow('underlay', {
        url: `/video-wallpaper?path=${encodeURIComponent(item.url)}`,
        title: 'VideoWallpaper',
        width: 1920,
        height: 1080,
        x: 0,
        y: 0,
        resizable: false,
        transparent: true,
        visible: true,
        decorations: false,
        alwaysOnBottom: true,
        skipTaskbar: true,
        fullscreen: true,
      })
      
      underlayWindow.value.once('tauri://created', async () => {
        await setDesktopUnderlay(true, 'underlay')
      })
      
      wallpaperStore.setVideoActive(true)
      wallpaperStore.setVideoPath(item.url)
      await invoke('refresh_wallpaper')
    } catch (e) {
      console.error('启动失败:', e)
      throw e
    }
  }

  async function closeVideoWallpaper() {
    try {
      if (underlayWindow.value) {
        await setDesktopUnderlay(false, 'underlay')
        await underlayWindow.value.close()
        underlayWindow.value = null
      }
      wallpaperStore.setVideoActive(false)
      await invoke('refresh_wallpaper')
    } catch (e) {
      console.error('停止失败:', e)
      throw e
    }
  }

  async function initVideoWallpaper() {
    if (wallpaperStore.videoActive) {
      const existingWindow = await WebviewWindow.getByLabel('underlay')
      if (existingWindow) {
        underlayWindow.value = existingWindow
      }
    }
  }

  return {
    underlayWindow,
    openVideoWallpaper,
    closeVideoWallpaper,
    initVideoWallpaper,
  }
}
