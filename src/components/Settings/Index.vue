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
            <label>窗口透明度：{{ opacityPercent }}%</label>
            <el-slider
              v-model="opacityValue"
              :min="30"
              :max="100"
              :step="5"
              show-stops
            />
          </div>

          <div class="setting-item">
            <label>暗黑模式</label>
            <el-switch
              v-model="isDark"
              @change="handleThemeChange"
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
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useDark } from '@/hooks/useDark'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const appStore = useAppStore()
const { isDark, setDark } = useDark()

const activeTab = ref('appearance')
const opacityValue = ref(100)

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const opacityPercent = computed(() => opacityValue.value)

watch(() => appStore.showSettings, (val) => {
  if (val) {
    opacityValue.value = Math.round(appStore.windowOpacity * 100)
  }
})

function handleThemeChange(val) {
  setDark(val)
}

watch(opacityValue, (val) => {
  const opacity = val / 100
  document.body.style.opacity = opacity.toString()
  appStore.setOpacity(opacity)
})
</script>

<style scoped>
.settings-tabs {
  min-height: 300px;
}

.settings-tabs :deep(.el-tabs__content) {
  padding: 0 20px;
}

.settings-section h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.setting-item {
  margin-bottom: 24px;
}

.setting-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-color);
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
}

.shortcut-display kbd {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 12px;
  font-family: var(--font-family);
  font-size: 14px;
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
</style>
