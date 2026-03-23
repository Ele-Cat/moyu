<template>
  <div class="app-container">
    <el-config-provider :locale="locale" :message="messageConfig">
      <FHeader v-if="!isVideoWallpaper" :isDark="isDark" />

      <div class="main-layout">
        <FSidebar v-if="!isVideoWallpaper" />

        <el-scrollbar class="content" :class="{ 'fullscreen': isVideoWallpaper }">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <keep-alive :include="cachedViews">
                <component style="overflow-x: hidden;" :is="Component" :key="route.path" />
              </keep-alive>
            </transition>
          </router-view>
        </el-scrollbar>
      </div>

      <Settings v-model="appStore.showSettings" />
    </el-config-provider>
  </div>
</template>

<script setup>
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { computed, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import { useDark } from '@/hooks/useDark'
import FHeader from '@/layouts/FHeader/Index.vue'
import FSidebar from '@/layouts/FSidebar/Index.vue'
import Settings from '@/components/Settings/Index.vue'

const locale = computed(() => zhCn)
const messageConfig = reactive({
  max: 3,
  offset: 60,
})

const appStore = useAppStore()
const route = useRoute()
const { isDark, init: initDark } = useDark()

const isVideoWallpaper = computed(() => route.path === '/video-wallpaper')

const cachedViews = computed(() => {
  return ['Home', 'NovelReader', 'MusicPlayer', 'NewsList', 'Wallpaper', 'Tools', 'Game']
})

onMounted(() => {
  initDark()
})
</script>

<style>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-color);
}

.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.content {
  flex: 1;
  height: calc(100vh - var(--header-height));
  overflow-x: hidden;
  background: var(--bg-color);
  transition: background-color 0.3s;
}

.content.fullscreen {
  height: 100vh;
  overflow: hidden;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}
</style>
