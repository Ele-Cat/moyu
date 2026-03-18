<template>
  <aside class="sidebar" :class="{ collapsed: collapsed }">
    <nav class="nav-menu">
      <div
        v-for="item in navItems"
        :key="item.path"
        class="nav-item"
        :class="{ active: currentRoute === item.path }"
        @click="goTo(item.path)"
      >
        <span class="nav-icon" :title="item.label">{{ item.icon }}</span>
        <span class="nav-text" v-if="!collapsed">{{ item.label }}</span>
      </div>
    </nav>
    <div class="sidebar-footer">
      <button class="settings-btn" @click="emit('open-settings')">
        ⚙️ <span v-if="!collapsed">设置</span>
      </button>
    </div>
    <button class="toggle-btn" @click="emit('toggle')">
      <img v-if="collapsed" src="@/assets/svg/right-arrow.svg" alt="expand" class="icon" />
      <img v-else src="@/assets/svg/left-arrow.svg" alt="collapse" class="icon" />
    </button>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

defineProps<{
  collapsed: boolean
}>()

const emit = defineEmits<{
  (e: 'open-settings'): void
  (e: 'toggle'): void
}>()

const router = useRouter()
const route = useRoute()

const currentRoute = computed(() => route.path)

const navItems = [
  { path: '/dashboard', label: '首页', icon: '🏠' },
  { path: '/novel', label: '看小说', icon: '📖' },
  { path: '/music', label: '听音乐', icon: '🎵' },
  { path: '/news', label: '刷热点', icon: '📰' },
  { path: '/wallpaper', label: '换壁纸', icon: '🖼️' },
  { path: '/game', label: '小游戏', icon: '🎮' },
  { path: '/tools', label: '工具', icon: '🛠️' }
]

function goTo(path: string) {
  router.push(path)
}
</script>

<style scoped>
.sidebar {
  width: 160px;
  background: var(--bg-color-secondary);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow);
  transition: width 0.3s ease, background-color 0.3s;
  position: relative;
}

.sidebar.collapsed {
  width: 60px;
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
}

.sidebar.collapsed .nav-item {
  padding: 8px 16px;
  justify-content: center;
}

.nav-item:hover {
  background: var(--hover-bg);
}

.nav-item.active {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-end) 100%);
  color: #fff;
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

.sidebar-footer {
  padding: 15px;
  border-top: 1px solid var(--border-color);
}

.settings-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-end) 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.sidebar.collapsed .settings-btn {
  padding: 10px;
}

.settings-btn:hover {
  opacity: 0.9;
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
  box-shadow: 4px  -4px 8px rgba(0, 0, 0, 0.08);

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
