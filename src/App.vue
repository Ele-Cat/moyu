<template>
  <div class="app-container" :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed }">
    <FHeader v-if="!isVideoWallpaper" :isDark="isDark" />

    <div class="main-layout">
      <FSidebar v-if="!isVideoWallpaper" :collapsed="appStore.sidebarCollapsed" @open-settings="openSettings" @toggle="appStore.toggleSidebar" />

      <el-scrollbar class="content" :class="{ 'fullscreen': isVideoWallpaper }">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-scrollbar>
    </div>

    <Settings v-model="appStore.showSettings" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useDark } from '@/hooks/useDark'
import FHeader from '@/layouts/FHeader/Index.vue'
import FSidebar from '@/layouts/FSidebar/Index.vue'
import Settings from '@/components/Settings/Index.vue'

const appStore = useAppStore()
const route = useRoute()
const { isDark, init: initDark, toggle: toggleDark, setDark } = useDark()

const isVideoWallpaper = computed(() => route.path === '/video-wallpaper')

function openSettings() {
  appStore.showSettings = true
}

function toggleTheme() {
  toggleDark()
}

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
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-color);
  transition: background-color 0.3s;
}

.content.fullscreen {
  height: 100vh;
  overflow: hidden;
}

/* 路由切换动画 */
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
