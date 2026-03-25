<template>
  <div class="settings-section">
    <div class="setting-item">
      <label>选择主题</label>
      <div class="theme-grid">
        <div
          v-for="theme in appStore.themes"
          :key="theme.id"
          :class="['theme-card', { active: theme.id === appStore.currentThemeId }]"
          @click="handleThemeChange(theme.id)"
        >
          <div class="theme-preview" :style="{ background: `linear-gradient(135deg, ${theme.primaryColor} 0%, ${theme.primaryColorEnd} 100%)` }">
            <span v-if="theme.isDark" class="dark-icon">🌙</span>
            <span v-else class="sun-icon">☀️</span>
          </div>
          <span class="theme-name">{{ theme.name }}</span>
        </div>
      </div>
    </div>

    <div class="setting-item">
      <label>暗黑模式</label>
      <el-switch
        :model-value="appStore.isDark"
        @change="handleDarkModeChange"
      />
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/modules/app'
import { useDark } from '@/hooks/useDark'

const appStore = useAppStore()
const { setDark } = useDark()

function handleThemeChange(themeId) {
  appStore.setTheme(themeId)
}

function handleDarkModeChange(val) {
  setDark(val)
}
</script>

<style lang="less" scoped>
.setting-item {
  margin-bottom: 24px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--text-color);
  }
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-card {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.2s;
  background: var(--bg-color-secondary);

  &:hover {
    transform: scale(1.02);
  }

  &.active {
    border-color: var(--primary-color);
  }
}

.theme-preview {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.theme-name {
  display: block;
  padding: 8px;
  text-align: center;
  font-size: 12px;
  color: var(--text-color);
}
</style>
