<template>
  <el-dialog
    v-model="visible"
    title="⚙️ 设置"
    width="600px"
    :close-on-click-modal="false"
    class="settings-dialog"
  >
    <el-tabs v-model="activeTab" tab-position="left" class="settings-tabs">
      <el-tab-pane label="外观" name="appearance">
        <div class="settings-section">
          <h3>外观设置</h3>
          
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
      </el-tab-pane>

      <el-tab-pane label="快捷键" name="shortcut">
        <div class="settings-section">
          <h3>快捷键设置</h3>
          
          <div class="setting-item">
            <label>老板键</label>
            <div class="shortcut-display">
              <kbd>Ctrl</kbd> + <kbd>~</kbd>
            </div>
            <p class="setting-tip">按下可隐藏/显示窗口</p>
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="关于" name="about">
        <div class="settings-section">
          <h3>关于</h3>
          
          <div class="about-info">
            <div class="app-icon">
              <img src="/icon.ico" alt="icon" />
            </div>
            <h4>摸鱼日常</h4>
            <p>版本 0.1.0</p>
            <p class="desc">一款实用的桌面摸鱼小工具</p>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDark } from '@/hooks/useDark'
import { useAppStore } from '@/stores/modules/app'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const { isDark, setDark } = useDark()
const appStore = useAppStore()

const activeTab = ref('appearance')

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

function handleThemeChange(themeId) {
  appStore.setTheme(themeId)
}

function handleDarkModeChange(val) {
  setDark(val)
}
</script>

<style lang="less" scoped>
.settings-tabs {
  min-height: 300px;

  :deep(.el-tabs__content) {
    padding: 0 20px;
  }
}

.settings-section h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.setting-item {
  margin-bottom: 24px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--text-color);
  }
}

.setting-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-color-muted);
}

.shortcut-display {
  display: flex;
  align-items: center;
  gap: 8px;

  kbd {
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 4px 12px;
    font-family: var(--font-family);
    font-size: 14px;
  }
}

.about-info {
  text-align: center;
  padding: 20px;
}

.app-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
}

.app-icon img {
  width: 100%;
  height: 100%;
}

.about-info h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--text-color);
}

.about-info p {
  margin: 4px 0;
  color: var(--text-color-secondary);
}

.about-info .desc {
  margin-top: 16px;
  font-size: 14px;
  color: var(--text-color-muted);
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
