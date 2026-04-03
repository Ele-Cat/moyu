<template>
  <FHeader />

  <div class="main-layout">
    <FSidebar />

    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <keep-alive :include="cachedViews">
            <component style="overflow-x: hidden;" :is="Component" :key="route.path" />
          </keep-alive>
        </transition>
      </router-view>
    </div>
  </div>

  <Settings v-model="appStore.showSettings" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import FHeader from '@/layouts/FHeader/Index.vue'
import FSidebar from '@/layouts/FSidebar/Index.vue'
import Settings from '@/components/Settings/Index.vue'

const route = useRoute()

const cachedViews = computed(() => {
  return ['Home', 'NovelReader', 'MusicPlayer', 'NewsList', 'Wallpaper', 'Tools', 'Game']
})
const appStore = useAppStore()
</script>

<style lang="less">
.main-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.main-content {
  flex: 1;
  height: calc(100vh - var(--header-height));
  overflow: hidden;
  background: var(--bg-color);
  transition: background-color 0.3s;

  :deep(.el-scrollbar__wrap) {
    overflow-x: hidden;
  }
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
