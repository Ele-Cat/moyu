<template>
  <div class="settings-section">
    <div class="setting-item">
      <label>存储位置</label>
      <div class="storage-path">
        <el-input v-model="storagePath" placeholder="正在加载..." readonly />
        <el-button @click="handleOpenFolder">打开</el-button>
        <el-button type="primary" @click="handleChoosePath">更改</el-button>
      </div>
      <p class="setting-tip">用于存储壁纸缓存、小说内容等数据</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '@/stores/modules/app'

const appStore = useAppStore()
const storagePath = ref('')

onMounted(async () => {
  try {
    const path = await invoke('get_storage_path')
    storagePath.value = path
    appStore.setStoragePath(path)
  } catch (error) {
    console.error('获取存储路径失败:', error)
  }
})

async function handleOpenFolder() {
  if (storagePath.value) {
    try {
      await invoke('open_folder', { path: storagePath.value })
    } catch (error) {
      console.error('打开文件夹失败:', error)
    }
  }
}

async function handleChoosePath() {
  try {
    const result = await invoke('choose_folder')
    if (result) {
      await invoke('set_storage_path', { path: result })
      storagePath.value = result
      appStore.setStoragePath(result)
    }
  } catch (error) {
    console.error('选择文件夹失败:', error)
  }
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

.setting-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-color-muted);
}

.storage-path {
  display: flex;
  
  .el-input {
    flex: 1;
    margin-right: 12px;
  }
}
</style>
