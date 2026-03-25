<template>
  <el-dialog
    v-model="visible"
    title="⚙️ 设置"
    width="600px"
    :close-on-click-modal="false"
    class="settings-dialog"
  >
    <el-tabs v-model="activeTab" tab-position="left" class="settings-tabs">
      <el-tab-pane label="通用" name="general">
        <General />
      </el-tab-pane>

      <el-tab-pane label="外观" name="appearance">
        <Appearance />
      </el-tab-pane>

      <el-tab-pane label="快捷键" name="shortcut">
        <Shortcut />
      </el-tab-pane>

      <el-tab-pane label="关于" name="about">
        <About />
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import Appearance from './modules/Appearance.vue'
import General from './modules/General.vue'
import Shortcut from './modules/Shortcut.vue'
import About from './modules/About.vue'

const props = defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const activeTab = ref('general')

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<style lang="less" scoped>
.settings-tabs {
  min-height: 300px;

  :deep(.el-tabs__content) {
    padding: 0 20px;
  }
}
</style>
