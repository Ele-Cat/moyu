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
        <img :src="item.icon" class="nav-icon" :title="item.label" />
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
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/modules/app'
import homeIcon from '@/assets/svg/nav/home.svg'
import newsIcon from '@/assets/svg/nav/news.svg'
import novelIcon from '@/assets/svg/nav/novel.svg'
import wallpaperIcon from '@/assets/svg/nav/wallpaper.svg'
import gameIcon from '@/assets/svg/nav/game.svg'
import toolsIcon from '@/assets/svg/nav/tools.svg'

const appStore = useAppStore()

const emit = defineEmits(['open-settings', 'toggle'])

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => route.path)

const navItems = [
  { path: '/dashboard', label: '首页', icon: homeIcon },
  { path: '/news', label: '刷热点', icon: newsIcon },
  { path: '/novel', label: '看小说', icon: novelIcon },
  { path: '/wallpaper', label: '换壁纸', icon: wallpaperIcon },
  { path: '/game', label: '玩游戏', icon: gameIcon },
  { path: '/tools', label: '小工具', icon: toolsIcon },
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
  width: 140px;
  background: var(--bg-color-secondary);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
  transition: width 0.3s ease, background-color 0.3s;
  position: relative;

  &.collapsed {
    width: 48px;
  }
}

.nav-menu {
  flex: 1;
  padding: 1px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  height: 38px;
  padding: 8px 16px;
  cursor: pointer;
  color: var(--text-color);
  transition: all 0.3s ease;
  gap: 12px;

  .nav-icon {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    filter: invert(0);
  }

  .nav-text {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
  }

  &:hover {
    background: var(--hover-bg);
  }

  &.active {
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-end) 100%);
    color: #fff;
    .nav-icon {
      filter: invert(1);
    }
  }
}

.sidebar.collapsed .nav-item {
  padding: 8px 16px;
  justify-content: center;
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

.icon {
  width: 14px;
  height: 14px;
  filter: invert(1);
}

.dark {
  .toggle-btn {
    .icon {
      filter: invert(1);
    }
  }
  .nav-icon {
    filter: invert(1);
  }
}
</style>
