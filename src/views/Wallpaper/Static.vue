<template>
  <div class="static-wallpaper">
    <div class="category-tabs">
      <div 
        v-for="cat in categories" 
        :key="cat.id"
        :class="['cat-item', { active: currentCategory === cat.id }]"
        @click="switchCategory(cat)"
      >
        {{ cat.category }}
      </div>
    </div>
    
    <el-scrollbar>
    <div class="wallpaper-grid">
      <div 
        v-for="wallpaper in wallpapers" 
        :key="wallpaper.id" 
        class="wallpaper-item"
      >
        <el-image class="wallpaper-image" :src="wallpaper.url" :alt="wallpaper.name" fit="cover" lazy @click="previewWallpaper(wallpaper)" />
        <div class="hover-title" :title="wallpaper.name">
          {{ wallpaper.name }}
        </div>
        <div class="hover-actions">
          <el-icon @click.stop="applyStaticWallpaper(wallpaper)" title="设为壁纸"><PictureFilled /></el-icon>
          <el-icon @click.stop="previewWallpaper(wallpaper)" title="预览"><View /></el-icon>
          <el-icon @click.stop="addToFavorites(wallpaper)" title="收藏"><StarFilled /></el-icon>
        </div>
      </div>
    </div>
    </el-scrollbar>
    
    <div class="pagination-wrapper" v-if="wallpapers.length > 0">
      <el-pagination
        v-model:current-page="pageNo"
        :page-size="20"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
    
    <div v-if="previewing" class="preview-modal">
      <div class="preview-content" @click.stop>
        <img :src="previewing.url" alt="" />
        <div class="preview-actions">
          <el-button type="primary" @click="applyStaticWallpaper(previewing)">设为壁纸</el-button>
          <el-button @click="addToFavorites(previewing)">收藏</el-button>
          <el-button @click="previewing = null">关闭</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { PictureFilled, View, StarFilled } from '@element-plus/icons-vue'
import { invoke } from '@tauri-apps/api/core'
import { ElLoading } from 'element-plus'
import { useWallpaperStore } from '@/stores/modules/wallpaper'

const store = useWallpaperStore()
const previewing = ref(null)
const loading = ref(false)
const wallpapers = ref([])
const categories = ref([])
const currentCategory = ref('biying')
const pageNo = ref(1)
const total = ref(0)

const biyingCategory = { id: 'biying', category: '必应壁纸' }

async function fetchCategories() {
  try {
    const res = await fetch('https://go.ytab.top/api/wallpaper_category')
    const { data } = await res.json()
    categories.value = [biyingCategory, ...data.filter(item => !!item.old_id).map(item => ({ ...item, id: item.old_id || item.id }))]
  } catch (e) {
    console.error('获取分类失败:', e)
    categories.value = [biyingCategory]
  }
}

async function fetchWallpapers(categoryId, page = 1) {
  loading.value = true
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '加载中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    let url = ''
    if (categoryId === 'biying') {
      url = `https://go.ytab.top/api/biying_wallpaper_list?page=${page}&limit=40`
    } else {
      url = `https://go.ytab.top/api/wallpaper_list?cid=${categoryId}&page=${page}&limit=16`
    }
    const res = await fetch(url)
    const {data} = await res.json()
    
    if (categoryId === 'biying') {
      wallpapers.value = data.data.map((item, index) => ({
        id: item.id,
        name: item.title,
        url: `https://www4.bing.com/${item.url}`,
      }))
      total.value = data.total || 0
    } else {
      wallpapers.value = data.list.map((item, index) => ({
        id: item.id || index,
        name: item.tag,
        url: item.url,
      }))
      total.value = data.total_count || 0
    }
  } catch (e) {
    console.error('获取壁纸失败:', e)
    wallpapers.value = []
  } finally {
    loading.value = false
    loadingInstance.close()
  }
}

async function switchCategory(cat) {
  currentCategory.value = cat.id
  pageNo.value = 1
  await fetchWallpapers(cat.id, 1)
}

function handlePageChange(page) {
  fetchWallpapers(currentCategory.value, page)
}

function previewWallpaper(wallpaper) {
  previewing.value = wallpaper
}

async function applyStaticWallpaper(wallpaper) {
  try {
    await invoke('set_wallpaper', { url: wallpaper.url })
    store.addToHistory({ url: wallpaper.url, type: 'image', name: wallpaper.name })
    previewing.value = null
  } catch (e) {
    console.error('设置壁纸失败:', e)
  }
}

function addToFavorites(wallpaper) {
  store.addToFavorites({ url: wallpaper.url, type: 'image', name: wallpaper.name })
}

onMounted(async () => {
  await fetchCategories()
  await fetchWallpapers('biying')
})
</script>

<style scoped>
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.cat-item {
  padding: 5px 12px;
  border-radius: 15px;
  cursor: pointer;
  background: var(--bg-color-secondary);
  font-size: 12px;
  transition: all 0.2s;
}

.cat-item:hover {
  background: var(--hover-bg);
}

.cat-item.active {
  background: var(--primary-color);
  color: #fff;
}

.wallpaper-grid {
  height: calc(100vh - 250px);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20%, 1fr));
  gap: 10px;
}

.wallpaper-item {
  position: relative;
  height: 18vh;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.wallpaper-item .wallpaper-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.wallpaper-item:hover .wallpaper-image {
  transform: scale(1.12);
}

.hover-title {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  padding: 8px;
  color: #fff;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: linear-gradient(rgba(0, 0, 0, 0.6), transparent);
  opacity: 0;
  transition: opacity 0.2s;
}

.wallpaper-item:hover .hover-title {
  opacity: 1;
}

.hover-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px;
  display: flex;
  justify-content: center;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.3));
  gap: 18px;
  opacity: 0;
  transition: opacity 0.2s;
}

.wallpaper-item:hover .hover-actions {
  opacity: 1;
}

.hover-actions .el-icon {
  cursor: pointer;
  font-size: 18px;
  color: #fff;
  transition: background 0.2s;
}

.hover-actions .el-icon:hover {
  color: var(--primary-color);
}

.loading-tip {
  text-align: center;
  padding: 20px;
  color: var(--text-color-muted);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 15px 0 0;
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.preview-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.preview-content img {
  max-width: 98%;
  max-height: 88vh;
}

.preview-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 15px;
}

.preview-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>
