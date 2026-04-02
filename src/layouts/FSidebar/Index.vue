<template>
  <aside class="sidebar" :class="{ collapsed: appStore.sidebarCollapsed }">
    <nav class="nav-menu">
      <div
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: isActive(item.path) }"
        @click="goTo(item.path)"
      >
        <span class="nav-icon" :title="item.label">{{ item.icon }}</span>
        <span class="nav-text" v-if="!appStore.sidebarCollapsed">{{ item.label }}</span>
      </div>
    </nav>
    <button class="toggle-btn" @click="appStore.toggleSidebar">
      <img v-if="appStore.sidebarCollapsed" src="@/assets/svg/right-arrow.svg" alt="expand" class="icon" />
      <img v-else src="@/assets/svg/left-arrow.svg" alt="collapse" class="icon" />
    </button>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'

const appStore = useAppStore()

const emit = defineEmits(['open-settings', 'toggle'])

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => route.path)

const navItems = [
  { path: '/dashboard', label: '首页', icon: '🏠' },
  { path: '/music', label: '听音乐', icon: '🎵' },
  { path: '/news', label: '刷热点', icon: '📰' },
  // { path: '/novel', label: '看小说', icon: '📖' },
  { path: '/wallpaper', label: '换壁纸', icon: '🖼️' },
  { path: '/game', label: '玩游戏', icon: '🎮' },
  { path: '/tools', label: '小工具', icon: '🛠️' }
]

function isActive(path) {
  return currentRoute.value === path || currentRoute.value.startsWith(path + '/')
}

function goTo(path) {
  router.push(path)
}
</script>

<style lang="less" scoped>
.sidebar {
  width: 160px;
  background: var(--bg-color-secondary);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
  transition: width 0.3s ease, background-color 0.3s;
  position: relative;

  &.collapsed {
    width: 60px;
  }
}

.nav-menu {
  flex: 1;
  padding: 1px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.3s ease;
  gap: 12px;

  &:hover {
    background: var(--hover-bg);
  }

  &.active {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-end) 100%);
    color: #fff;
  }
}

.sidebar.collapsed .nav-item {
  padding: 8px 16px;
  justify-content: center;
}

.nav-icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-text {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
}

.toggle-btn {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 48px;
  border: none;
  background: var(--bg-color-secondary);
  color: #000;
  border-radius: 0 6px 6px 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  box-shadow: 4px 0 4px rgba(0, 0, 0, 0.08);

  .icon {
    filter: invert(0);
  }
}

.dark .toggle-btn {
  .icon {
    filter: invert(1);
  }
}

.icon {
  width: 14px;
  height: 14px;
  filter: invert(1);
}
</style>
