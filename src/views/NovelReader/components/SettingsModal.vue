<template>
  <el-dialog
    v-model="dialogVisible"
    title="阅读配置"
    width="480px"
    @close="handleClose"
  >
    <div class="settings-content">
      <el-form label-width="100px">
        <el-form-item label="窗口样式:">
          <div class="mode-grid">
            <div
              class="mode-card"
              :class="{ active: readerSettings.window?.style === 'word' }"
              @click="readerSettings.window = { ...readerSettings.window, style: 'word' }"
            >
              <div class="mode-preview word-preview">
                <div class="preview-toolbar">
                  <span class="preview-btn">W</span>
                  <span class="preview-title">文档.doc</span>
                </div>
                <div class="preview-content word-content">
                  <p>这是一段示例文字...</p>
                  <p>第二行内容展示</p>
                </div>
              </div>
              <div class="mode-info">
                <span class="mode-name">Word 样式</span>
              </div>
              <div v-if="readerSettings.window?.style === 'word'" class="check-icon">✓</div>
            </div>
            
            <div
              class="mode-card"
              :class="{ active: readerSettings.window?.style === 'excel' }"
              @click="readerSettings.window = { ...readerSettings.window, style: 'excel' }"
            >
              <div class="mode-preview excel-preview">
                <div class="preview-toolbar">
                  <span class="preview-btn green">E</span>
                  <span class="preview-title">工作簿.xls</span>
                </div>
                <div class="preview-content excel-content">
                  <div class="excel-grid">
                    <div class="grid-row">
                      <div class="cell header">A</div>
                      <div class="cell">内容</div>
                    </div>
                    <div class="grid-row">
                      <div class="cell header">B</div>
                      <div class="cell"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mode-info">
                <span class="mode-name">Excel 样式</span>
              </div>
              <div v-if="readerSettings.window?.style === 'excel'" class="check-icon">✓</div>
            </div>
            
            <div
              class="mode-card"
              :class="{ active: readerSettings.window?.style === 'normal' }"
              @click="readerSettings.window = { ...readerSettings.window, style: 'normal' }"
            >
              <div class="mode-preview normal-preview">
                <div class="preview-content normal-content">
                  <p>示例文字</p>
                  <p>简洁阅读</p>
                </div>
              </div>
              <div class="mode-info">
                <span class="mode-name">普通样式</span>
              </div>
              <div v-if="readerSettings.window?.style === 'normal'" class="check-icon">✓</div>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="窗口设置:">
          <el-checkbox v-model="readerSettings.window.useLastPosition">阅读窗口使用上次关闭时位置、大小</el-checkbox>
          <el-checkbox v-model="readerSettings.window.minimizeMainWindow">打开阅读时主程序最小化至托盘</el-checkbox>
        </el-form-item>
      </el-form>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useBookStore } from '@/stores/modules/book'
import { storeToRefs } from 'pinia'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const bookStore = useBookStore()
const { readerSettings } = storeToRefs(bookStore)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const handleClose = () => {
  dialogVisible.value = false
}
</script>

<style lang="less" scoped>
.settings-content {
  .settings-tabs {
    width: 100%;
  }
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.mode-card {
  border: 2px solid #e4e7ed;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover, &.active {
    border-color: var(--primary-color);
    box-shadow: var(--shadow);
  }
}

.mode-preview {
  height: 88px;
  border-radius: 4px;
  margin-bottom: 4px;
  overflow: hidden;
  
  .preview-toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0px 8px;
    background: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
    
    .preview-btn {
      width: 16px;
      height: 16px;
      background: #1a8cff;
      color: #fff;
      font-size: 10px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 2px;
      
      &.green {
        background: #4caf50;
      }
    }
    
    .preview-title {
      font-size: 10px;
      color: #666;
    }
  }
  
  .preview-content {
    padding: 8px;
    height: calc(100% - 24px);
  }
}

.word-preview {
  background: #fff;
  
  .word-content {
    font-family: 'Microsoft YaHei', sans-serif;
    font-size: 10px;
    line-height: 1.6;
    color: #000;
    
    p {
      margin: 0 0 4px;
      text-indent: 1em;
    }
  }
}

.excel-preview {
  background: #fff;
  
  .excel-content {
    padding: 0;
    
    .excel-grid {
      .grid-row {
        display: flex;
        
        .cell {
          width: 40px;
          height: 16px;
          font-size: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-right: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
          
          &.header {
            background: #f5f5f5;
            color: #666;
          }
        }
      }
    }
  }
}

.normal-preview {
  background: #f5f5f5;
  
  .normal-content {
    font-size: 11px;
    line-height: 1.6;
    color: #333;
    
    p {
      margin: 0 0 4px;
    }
  }
}

.mode-info {
  display: flex;
  flex-direction: column;
  height: 20px;
  line-height: 20px;
  gap: 2px;

  .mode-name {
    font-size: 12px;
    color: #303133;
    font-weight: 500;
  }
}

.check-icon {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: var(--primary-color);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
</style>
