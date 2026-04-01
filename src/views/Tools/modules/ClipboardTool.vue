<template>
  <div class="clipboard-tool">
    <div class="clipboard-header">
      <span>历史记录 ({{ clipboardList.length }})</span>
      <button @click="clearClipboard">清空</button>
    </div>

    <div class="clipboard-list">
      <div
        v-for="(item, index) in clipboardList"
        :key="index"
        class="clipboard-item"
        @click="copyToClipboard(item)"
      >
        {{ item }}
      </div>

      <div v-if="clipboardList.length === 0" class="empty">
        暂无剪贴板历史
      </div>
    </div>

    <div class="tip">
      按 Ctrl+Alt+V 快速打开剪贴板
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { readText, writeText } from '@tauri-apps/plugin-clipboard-manager'

const clipboardList = ref([])

async function loadClipboardHistory() {
  try {
    const history = localStorage.getItem('clipboard_history')
    if (history) {
      clipboardList.value = JSON.parse(history)
    }
  } catch (e) {
    console.error('加载剪贴板历史失败:', e)
  }
}

function saveClipboardHistory() {
  try {
    localStorage.setItem('clipboard_history', JSON.stringify(clipboardList.value))
  } catch (e) {
    console.error('保存剪贴板历史失败:', e)
  }
}

async function copyToClipboard(text) {
  try {
    await writeText(text)
    ElMessage.success('复制成功')
  } catch (e) {
    console.error('复制失败:', e)
  }
}

function clearClipboard() {
  clipboardList.value = []
  saveClipboardHistory()
  ElMessage.success('已清空')
}

let lastClipboardText = ''

async function checkClipboard() {
  try {
    const text = await readText()
    if (text && text !== lastClipboardText && text.trim()) {
      lastClipboardText = text
      if (!clipboardList.value.includes(text)) {
        clipboardList.value.unshift(text)
        if (clipboardList.value.length > 50) {
          clipboardList.value.pop()
        }
        saveClipboardHistory()
      }
    }
  } catch (e) {
  }
}

let clipboardInterval = null

onMounted(() => {
  loadClipboardHistory()
  checkClipboard()
  clipboardInterval = window.setInterval(checkClipboard, 1000)
})

onUnmounted(() => {
  if (clipboardInterval) {
    clearInterval(clipboardInterval)
  }
})
</script>

<style lang="less" scoped>
.clipboard-tool {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.clipboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  span {
    font-size: 16px;
    font-weight: bold;
    color: var(--text-color);
  }

  button {
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-color-secondary);
    color: var(--text-color);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--danger-color);
      color: var(--danger-color);
    }
  }
}

.clipboard-list {
  background: var(--bg-color-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  max-height: 500px;
  overflow-y: auto;
  padding: 12px;
}

.clipboard-item {
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  word-break: break-all;
  font-size: 14px;
  color: var(--text-color);
  border: 1px solid transparent;

  &:hover {
    background: var(--bg-color);
    border-color: var(--primary-color);
  }

  & + .clipboard-item {
    margin-top: 8px;
  }
}

.empty {
  text-align: center;
  padding: 40px;
  color: var(--text-color-secondary);
}

.tip {
  text-align: center;
  margin-top: 16px;
  font-size: 12px;
  color: var(--text-color-secondary);
}
</style>
