<template>
  <div class="static-wallpaper">
    <CategoryTabs
      v-model="currentCategory"
      :categories="categories"
      @change="switchCategory"
    />
    
    <MediaGrid
      type="static"
      :items="wallpapers"
      height="calc(100vh - 250px)"
      item-key="id"
      show-title
      show-apply
      show-favorite
      :total="total"
      :current-page="pageNo"
      @apply="item => emit('apply', item)"
      @favorite="item => emit('favorite', item)"
      @page-change="handlePageChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElLoading } from 'element-plus'
import MediaGrid from './components/MediaGrid.vue'

const loading = ref(false)
const wallpapers = ref([])
const categories = ref([])
const currentCategory = ref('biying')
const pageNo = ref(1)
const total = ref(0)

onMounted(async () => {
  await fetchCategories()
  await fetchWallpapers('biying')
})

const emit = defineEmits(['apply', 'favorite'])

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

async function fetchWallpapers(categoryId, pageNo = 1) {
  loading.value = true
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '加载中...',
    background: 'rgba(0, 0, 0, 0.7)'
  })
  try {
    let url = ''
    if (categoryId === 'biying') {
      url = `https://go.ytab.top/api/biying_wallpaper_list?page=${pageNo}&limit=40`
    } else {
      url = `https://go.ytab.top/api/wallpaper_list?cid=${categoryId}&page=${pageNo}&limit=16`
    }
    const res = await fetch(url)
    const {data} = await res.json()
    
    if (categoryId === 'biying') {
      wallpapers.value = data.data.map((item, index) => ({
        id: item.id,
        name: item.title,
        type: 'image',
        cover: `https://www4.bing.com/${item.url}`,
        url: `https://www4.bing.com/${item.url}`,
      }))
      total.value = data.total || 0
    } else {
      wallpapers.value = data.list.map((item, index) => ({
        id: item.id || index,
        name: item.tag,
        type: 'image',
        cover: item.url,
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
  await fetchWallpapers(cat.id, pageNo.value)
}

function handlePageChange(pageNo) {
  fetchWallpapers(currentCategory.value, pageNo)
}
</script>

<style scoped>
</style>
