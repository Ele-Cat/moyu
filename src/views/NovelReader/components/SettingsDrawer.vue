<template>
  <el-drawer
    v-model="dialogVisible"
    direction="btt"
    :with-header="false"
    @close="handleClose"
  >
    <div class="settings-content">
      <el-form label-width="100px">
        <el-form-item label="字体:">
          <el-select v-model="readerSettings.style.fontFamily" size="small" class="form-select">
            <el-option label="Microsoft YaHei" value="Microsoft YaHei" />
            <el-option label="SimSun" value="SimSun" />
            <el-option label="SimHei" value="SimHei" />
            <el-option label="Arial" value="Arial" />
            <el-option label="Times New Roman" value="Times New Roman" />
          </el-select>
          <el-button size="small" class="form-btn" @click="readerSettings.style.fontFamily = 'Microsoft YaHei'">默认</el-button>
        </el-form-item>

        <el-form-item label="字体大小:">
          <el-select v-model="readerSettings.style.fontSize" size="small" class="form-select">
            <el-option v-for="size in fontSizes" :key="size" :label="size + 'px'" :value="size" />
          </el-select>
          <el-button size="small" class="form-btn" @click="readerSettings.style.fontSize = 14">默认</el-button>
        </el-form-item>

        <el-form-item label="行高:">
          <el-select v-model="readerSettings.style.lineHeight" size="small" class="form-select">
            <el-option v-for="height in lineHeights" :key="height" :label="height + 'px'" :value="height" />
          </el-select>
          <el-button size="small" class="form-btn" @click="readerSettings.style.lineHeight = 20">默认</el-button>
        </el-form-item>

        <el-form-item label="段落间距:">
          <el-select v-model="readerSettings.style.paragraphSpacing" size="small" class="form-select">
            <el-option v-for="space in paragraphSpacings" :key="space" :label="space + 'px'" :value="space" />
          </el-select>
          <el-button size="small" class="form-btn" @click="readerSettings.style.paragraphSpacing = 10">默认</el-button>
        </el-form-item>

        <el-form-item label="背景颜色:" v-if="isNormal">
          <el-color-picker size="small" v-model="readerSettings.style.bgTheme" class="form-color" />
        </el-form-item>

        <el-form-item label="背景透明度:" v-if="isNormal">
          <el-slider size="small" v-model="readerSettings.style.bgOpacity" :min="1" :max="100" :format-tooltip="(val) => val + '%' " class="form-slider" />
          <span class="slider-value">{{ readerSettings.style.bgOpacity }}%</span>
        </el-form-item>

        <el-form-item label="文字颜色:">
          <el-color-picker size="small" v-model="readerSettings.style.textColor" class="form-color" />
        </el-form-item>

        <el-form-item label="文字透明度:" v-if="isNormal">
          <el-slider size="small" v-model="readerSettings.style.textOpacity" :min="1" :max="100" :format-tooltip="(val) => val + '%' " class="form-slider" />
          <span class="slider-value">{{ readerSettings.style.textOpacity }}%</span>
        </el-form-item>
      </el-form>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useBookStore } from '@/stores/modules/book'
import { storeToRefs } from 'pinia'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  currentMode: {
    type: String,
    default: 'normal'
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const bookStore = useBookStore()
const { readerSettings } = storeToRefs(bookStore)
const isNormal = computed(() => props.currentMode === 'normal')

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const fontSizes = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32]
const lineHeights = [12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40]
const paragraphSpacings = [8, 12, 16, 20, 24, 28, 32]

const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style lang="less" scoped>
.settings-content {
  .el-form-item {
    margin-bottom: 2px;
  }
}

.form-select {
  max-width: 200px;
}

.form-btn {
  margin: 0 8px;
}
  
.form-slider {
  max-width: 200px;
}

.slider-value {
  font-size: 12px;
  color: #606266;
  min-width: 40px;
  text-align: right;
}

.dialog-footer {
  display: flex;
  justify-content: center;
}
</style>
