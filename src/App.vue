<template>
  <div class="app-container" :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed }">
    <FHeader v-if="!isVideoWallpaper" :isDark="appStore.isDark" @toggle-theme="appStore.toggleTheme" />

    <div class="main-layout">
      <FSidebar v-if="!isVideoWallpaper" :collapsed="appStore.sidebarCollapsed" @open-settings="openSettings" @toggle="appStore.toggleSidebar" />

      <main class="content" :class="{ 'fullscreen': isVideoWallpaper }">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>

    <div v-if="appStore.showSettings" class="modal-overlay" @click.self="closeSettings">
      <div class="modal">
        <h2>⚙️ 设置</h2>
        <div class="setting-item">
          <label>窗口透明度：{{ opacityPercent }}%</label>
          <input
            type="range"
            min="0"
            max="100"
            :value="opacityPercent"
            @input="updateOpacity"
          />
        </div>
        <div class="setting-item">
          <label>暗黑模式：</label>
          <button class="theme-toggle" @click="appStore.toggleTheme">
            {{ appStore.isDark ? '🌙 已开启' : '☀️ 已关闭' }}
          </button>
        </div>
        <div class="setting-item">
          <label>快捷键：</label>
          <span>老板键 Ctrl+~ 隐藏窗口</span>
        </div>
        <button class="close-btn" @click="closeSettings">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import FHeader from '@/layouts/FHeader.vue'
import FSidebar from '@/layouts/FSidebar.vue'

const appStore = useAppStore()
const route = useRoute()

const isVideoWallpaper = computed(() => route.path === '/video-wallpaper')

const opacityValue = ref(100)

const opacityPercent = computed(() => opacityValue.value)

function updateOpacity(event: Event) {
  const value = parseInt((event.target as HTMLInputElement).value)
  opacityValue.value = value
  const opacity = value / 100
  document.body.style.opacity = opacity.toString()
  appStore.setOpacity(opacity)
}

function openSettings() {
  appStore.showSettings = true
}

function closeSettings() {
  appStore.showSettings = false
}

onMounted(() => {
  appStore.loadState()
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-color-secondary);
  padding: 24px;
  border-radius: var(--border-radius);
  min-width: 320px;
  box-shadow: var(--shadow);
}

.modal h2 {
  margin-bottom: 20px;
  color: var(--text-color);
}

.setting-item {
  margin-bottom: 16px;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-color);
}

.setting-item input[type="range"] {
  width: 100%;
}

.theme-toggle {
  padding: 8px 16px;
  background: var(--hover-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-color);
  cursor: pointer;
}

.close-btn {
  width: 100%;
  padding: 12px;
  margin-top: 16px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
}

.close-btn:hover {
  opacity: 0.9;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
