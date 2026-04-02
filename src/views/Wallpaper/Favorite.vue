<template>
  <div class="favorite-wallpaper">
    <div class="favorite-header">
      <el-button size="small" type="danger" @click="clearFavorite" v-if="wallpaperStore.favorites.length">清空收藏</el-button>
    </div>
    
    <MediaGrid
      type="favorite"
      :items="showFavorites"
      :total="wallpaperStore.favorites.length"
      :current-page="pageNo"
      item-key="url"
      show-apply
      show-favorite
      show-title
      empty-text="暂无订阅内容"
      @apply="item => emit('apply', item)"
      @favorite="item => emit('favorite', item)"
      @page-change="pageNo = $event"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useWallpaperStore } from '@/stores/modules/wallpaper'
import { ElMessageBox, ElMessage } from 'element-plus'
import MediaGrid from './components/MediaGrid.vue'

const emit = defineEmits(['apply', 'favorite'])

const wallpaperStore = useWallpaperStore()
const pageNo = ref(1)
const pageSize = ref(16)

const showFavorites = ref([])
watch(() => [pageNo.value, wallpaperStore.favorites], (newVal) => {
  showFavorites.value = wallpaperStore.favorites.slice((newVal[0] - 1) * pageSize.value, newVal[0] * pageSize.value)
}, { immediate: true })

function clearFavorite() {
  ElMessageBox.confirm('确定清空收藏吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    wallpaperStore.clearFavorite()
    ElMessage.success('收藏已清空')
  })
}
</script>

<style lang="less" scoped>
.favorite-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 19px;
}
</style>
