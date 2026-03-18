<template>
  <div class="file-page">
    <h1>文件管理</h1>
    <div class="actions">
      <button @click="refreshFiles">刷新</button>
      <button @click="goHome">返回首页</button>
    </div>
    <div class="path-info">
      <span>当前目录：{{ currentPath }}</span>
    </div>
    <div class="file-list">
      <div
        v-for="item in files"
        :key="item.path"
        class="file-item"
        @dblclick="openItem(item)"
      >
        <span class="file-icon">{{ item.is_dir ? '📁' : '📄' }}</span>
        <span class="file-name">{{ item.name }}</span>
        <span class="file-size">{{ item.is_dir ? '' : formatSize(item.size) }}</span>
      </div>
    </div>
    <div v-if="files.length === 0 && !loading" class="empty">
      该目录为空
    </div>
    <div v-if="loading" class="loading">
      加载中...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'

const router = useRouter()
const currentPath = ref('')
const files = ref<Array<{
  name: string
  path: string
  is_dir: boolean
  size: number
}>>([])
const loading = ref(false)

// 格式化文件大小
function formatSize(size: number): string {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(1) + ' MB'
  return (size / 1024 / 1024 / 1024).toFixed(1) + ' GB'
}

// 刷新文件列表
async function refreshFiles() {
  loading.value = true
  try {
    const result = await invoke('read_directory', { path: currentPath.value })
    files.value = result as typeof files.value
  } catch (e) {
    console.error('读取目录失败:', e)
    alert('读取目录失败: ' + e)
  } finally {
    loading.value = false
  }
}

// 双击打开文件或目录
async function openItem(item: { name: string; path: string; is_dir: boolean }) {
  if (item.is_dir) {
    currentPath.value = item.path
    await refreshFiles()
  } else {
    alert('打开文件: ' + item.name)
  }
}

// 返回首页
function goHome() {
  router.push('/')
}

// 获取桌面路径并加载文件
onMounted(async () => {
  try {
    const desktopPath = await invoke('get_desktop_path')
    currentPath.value = desktopPath as string
    await refreshFiles()
  } catch (e) {
    console.error('获取桌面路径失败:', e)
    alert('获取桌面路径失败: ' + e)
  }
})
</script>

<style scoped>
.file-page {
  padding: 20px;
}

.actions {
  margin-bottom: 20px;
}

.actions button {
  margin-right: 10px;
  padding: 8px 16px;
  cursor: pointer;
}

.path-info {
  margin-bottom: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.file-list {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.file-item:hover {
  background: #f9f9f9;
}

.file-item:last-child {
  border-bottom: none;
}

.file-icon {
  margin-right: 10px;
  font-size: 20px;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  color: #888;
  font-size: 14px;
  min-width: 80px;
  text-align: right;
}

.empty,
.loading {
  padding: 40px;
  text-align: center;
  color: #888;
}
</style>
