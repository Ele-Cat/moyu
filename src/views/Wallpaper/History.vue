<template>
  <div class="history-wallpaper">
    <div class="history-header">
      <el-button size="small" type="danger" @click="clearHistory" v-if="wallpaperStore.history.length">清空历史</el-button>
    </div>
    
    <MediaGrid
      type="history"
      :items="showHistory"
      :total="wallpaperStore.history.length"
      :page-size="pageSize"
      :current-page="pageNo"
      show-apply
      show-favorite
      show-delete
      empty-text="暂无历史记录"
      @apply="item => emit('apply', item)"
      @favorite="item => emit('favorite', item)"
      @preview="item => emit('preview', item)"
      @delete="handleDelete"
      @page-change="pageNo = $event"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useWallpaperStore } from '@/stores/modules/wallpaper'
import { ElMessageBox, ElMessage } from 'element-plus'
import MediaGrid from './components/MediaGrid.vue'

const emit = defineEmits(['apply', 'preview', 'favorite'])

const wallpaperStore = useWallpaperStore()
const pageNo = ref(1)
const pageSize = ref(16)

const showHistory = ref([])
watch(() => [pageNo.value, wallpaperStore.history], (newVal) => {
  showHistory.value = wallpaperStore.history.slice((newVal[0] - 1) * pageSize.value, newVal[0] * pageSize.value)
}, { immediate: true })

function clearHistory() {
  ElMessageBox.confirm('确定清空历史记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    wallpaperStore.clearHistory()
    ElMessage.success('历史记录已清空')
  })
}

function handleDelete(item) {
  wallpaperStore.removeFromHistory(item.url)
  ElMessage.success('删除成功')
}
</script>

<style scoped>
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 19px;
}
</style>
