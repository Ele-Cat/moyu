<template>
  <el-drawer
    v-model="dialogVisible"
    direction="btt"
    :with-header="false"
    :lock-scroll="false"
    modal-class="settings-drawer"
    @close="handleClose"
  >
    <div class="settings-content">
      <el-form label-width="100px">
        <el-form-item label="字体:">
          <el-select v-model="currentStyle.fontFamily" size="small" class="form-select">
            <el-option label="Microsoft YaHei" value="Microsoft YaHei" />
            <el-option label="SimSun" value="SimSun" />
            <el-option label="SimHei" value="SimHei" />
            <el-option label="Arial" value="Arial" />
            <el-option label="Times New Roman" value="Times New Roman" />
          </el-select>
          <el-button size="small" class="form-btn" @click="currentStyle.fontFamily = 'Microsoft YaHei'">默认</el-button>
        </el-form-item>

        <el-form-item label="字体大小:">
          <el-slider size="small" v-model="currentStyle.fontSize" :min="12" :max="64" :step="2" show-input :format-tooltip="(val) => val + 'px'" class="form-slider" />
          <el-button size="small" class="form-btn" @click="currentStyle.fontSize = 14">默认</el-button>
        </el-form-item>

        <el-form-item label="行高:">
          <el-slider size="small" v-model="currentStyle.lineHeight" :min="1" :max="4" :step="0.2" show-input class="form-slider" />
          <el-button size="small" class="form-btn" @click="currentStyle.lineHeight = 1.2">默认</el-button>
        </el-form-item>

        <el-form-item label="段落间距:">
          <el-slider size="small" v-model="currentStyle.paragraphSpacing" :min="0" :max="32" :step="2" show-input class="form-slider" />
          <el-button size="small" class="form-btn" @click="currentStyle.paragraphSpacing = 8">默认</el-button>
        </el-form-item>

        <el-form-item label="背景颜色:" v-if="isNormal">
          <el-color-picker size="small" v-model="currentStyle.bgTheme" class="form-color" />
        </el-form-item>

        <el-form-item label="背景透明度:" v-if="isNormal">
          <el-slider size="small" v-model="currentStyle.bgOpacity" :min="1" :max="100" show-input :format-tooltip="(val) => val + '%' " class="form-slider" />
        </el-form-item>

        <el-form-item label="文字颜色:">
          <el-color-picker size="small" v-model="currentStyle.textColor" class="form-color" />
        </el-form-item>

        <el-form-item label="文字透明度:" v-if="isNormal">
          <el-slider size="small" v-model="currentStyle.textOpacity" :min="1" :max="100" show-input :format-tooltip="(val) => val + '%' " class="form-slider" />
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
const { currentStyle } = storeToRefs(bookStore)
const isNormal = computed(() => props.currentMode === 'normal')

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style lang="less">
.settings-drawer {
  background-color: transparent !important;
}
</style>

<style lang="less" scoped>
.settings-content {
  .el-form-item {
    margin-bottom: 2px;
  }
}

.form-select {
  max-width: 240px;
}
  
.form-slider {
  max-width: 240px;

  :deep(.el-slider__runway.show-input) {
    margin-right: 20px;
  }

  :deep(.el-slider__input) {
    width: 88px;
  }
}

.form-btn {
  margin: 0 8px;
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
