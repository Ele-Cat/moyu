<template>
  <div class="home">
    <div class="modules">
      <div class="module-card" @click="goTo('/novel')">
        <div class="module-icon">📖</div>
        <div class="module-name">小说阅读</div>
        <div class="module-desc">本地txt小说阅读</div>
      </div>

      <div class="module-card" @click="goTo('/music')">
        <div class="module-icon">🎵</div>
        <div class="module-name">音乐播放</div>
        <div class="module-desc">本地音乐播放</div>
      </div>

      <div class="module-card" @click="goTo('/news')">
        <div class="module-icon">📰</div>
        <div class="module-name">热点新闻</div>
        <div class="module-desc">实时热点资讯</div>
      </div>

      <div class="module-card" @click="goTo('/tools')">
        <div class="module-icon">🛠️</div>
        <div class="module-name">实用工具</div>
        <div class="module-desc">倒计时/剪贴板</div>
      </div>

      <div class="module-card" @click="toggleClock">
        <div class="module-icon">🖥️</div>
        <div class="module-name">视频壁纸</div>
        <div class="module-desc">桌面底层视频</div>
      </div>
    </div>

    <footer class="footer">
      <span>老板键: Ctrl+~ (隐藏窗口)</span>
      <span>点击关闭按钮最小化到托盘</span>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { setDesktopUnderlay } from 'tauri-plugin-desktop-underlay-api'
import { invoke } from '@tauri-apps/api/core'

const router = useRouter()
let underlayWindow = null

function goTo(path) {
  router.push(path)
}

async function toggleClock() {
  try {
    if (underlayWindow) {
      await setDesktopUnderlay(false, 'underlay')
      await underlayWindow.close()
      underlayWindow = null
      await invoke('refresh_wallpaper')
    } else {
      underlayWindow = new WebviewWindow('underlay', {
        url: '/video-wallpaper',
        title: 'VideoWallpaper',
        width: 1920,
        height: 1080,
        resizable: false,
        transparent: true,
        visible: true,
        decorations: false,
        alwaysOnBottom: true,
        skipTaskbar: true,
        fullscreen: true,
      })
      
      underlayWindow.once('tauri://created', async () => {
        console.log('窗口创建成功')
        await setDesktopUnderlay(true, 'underlay')
      })
      
      underlayWindow.once('tauri://error', (e) => {
        console.error('窗口创建失败:', e)
      })
    }
  } catch (error) {
    console.error('操作窗口失败:', error)
  }
}
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 30px;
}

.modules {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 700px;
  margin: 0 auto;
  width: 100%;
  align-content: center;
}

.module-card {
  background: #fff;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.module-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.module-icon {
  font-size: 42px;
  margin-bottom: 12px;
}

.module-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.module-desc {
  font-size: 13px;
  color: #888;
}

.footer {
  display: flex;
  justify-content: space-between;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  margin-top: 20px;
  font-size: 12px;
  color: #666;
}
</style>
