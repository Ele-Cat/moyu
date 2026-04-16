<template>
  <el-form label-width="100px">
    <el-form-item>
      <template #label>
        <el-tooltip content="显示在窗口左上角的标题文字" placement="top-start">
          标题名称:
        </el-tooltip>
      </template>
      <el-input v-model="appTitle" placeholder="输入标题名称" />
    </el-form-item>

    <el-form-item>
      <template #label>
        <el-tooltip content="是否在标题左侧显示应用图标" placement="top-start">
          显示图标:
        </el-tooltip>
      </template>
      <el-switch v-model="showTitleIcon" />
    </el-form-item>
    
    <el-form-item>
      <template #label>
        <el-tooltip content="用于存储壁纸缓存、小说内容等数据" placement="top-start">
          存储位置:
        </el-tooltip>
      </template>
      <div class="storage-path">
        <el-input v-model="storagePath" placeholder="正在加载..." readonly />
        <el-button @click="handleOpenFolder">打开</el-button>
        <el-button type="primary" @click="handleChoosePath">更改</el-button>
      </div>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useAppStore } from '@/stores/modules/app'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { appTitle, showTitleIcon } = storeToRefs(appStore)
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
.storage-path {
  display: flex;
  
  .el-input {
    flex: 1;
    margin-right: 12px;
  }
}
</style>
