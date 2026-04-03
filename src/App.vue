<template>
  <div class="app-container">
    <el-config-provider :locale="locale" :message="messageConfig">
      <router-view />
    </el-config-provider>
  </div>
</template>

<script setup>
import { computed, reactive, onMounted } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { useAppStore } from '@/stores/modules/app'
import { useDark } from '@/hooks/useDark'
import { useVideoWallpaper } from '@/hooks/useVideoWallpaper'
import { useWallpaperStore } from '@/stores/modules/wallpaper'

const appStore = useAppStore()
const { isDark, init: initDark } = useDark()

const wallpaperStore = useWallpaperStore()
const { openVideoWallpaper } = useVideoWallpaper()

const locale = computed(() => zhCn)
const messageConfig = reactive({
  max: 3,
  offset: 60,
})

const isFirstMount = true || !import.meta.hot

onMounted(() => {
  initDark()
  appStore.initTheme()
  if (isFirstMount) {
    initWallpaper()
  }
})

function initWallpaper() {
  if (wallpaperStore.isVideoActive) {
    openVideoWallpaper({ url: wallpaperStore.videoPath })
  }
}
</script>

<style lang="less">
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
</style>
