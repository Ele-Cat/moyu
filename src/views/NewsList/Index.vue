<template>
  <div class="news-page">
    <CategoryTabs v-model="currentCategory" :categories="categories" />
    
    <div class="news-layout">
      <div class="category-sidebar">
        <el-scrollbar>
          <draggable 
            v-if="currentCategory === 'subscribe'"
            :list="newsStore.subscriptions"
            :animation="100"
            item-key="id"
            class="list-group source-list"
            :forceFallback="true"
            ghost-class="ghost"
            :fallback-tolerance="8"
            :delay="10"
            handle=".drag-handle"
            @end="onDragEnd"
          >
            <template #item="{ element }">
              <div 
                class="source-item"
                :class="{ active: selectedSource?.id === element.id }"
              >
                <el-icon class="drag-handle" title="拖动排序"><Rank /></el-icon>
                <span class="source-name" :title="element.name" @click="selectSource(element)">{{ element.name }}</span>
                <el-button 
                  type="danger" 
                  size="small" 
                  link
                  @click.stop="toggleSubscribe(element)"
                  title="取消订阅"
                >
                  <el-icon><StarFilled /></el-icon>
                </el-button>
              </div>
            </template>
          </draggable>
          
          <template v-else>
            <div 
              v-for="source in filteredSources" 
              :key="source.id"
              class="source-item"
              :class="{ active: selectedSource?.id === source.id }"
              @click="selectSource(source)"
            >
              <span class="source-name" :title="source.name">{{ source.name }}</span>
              <el-button 
                type="danger" 
                size="small" 
                link
                @click.stop="toggleSubscribe(source)"
                :title="isSubscribed(source.id) ? '取消订阅' : '订阅'"
              >
                <el-icon><component :is="isSubscribed(source.id) ? StarFilled : Star" /></el-icon>
              </el-button>
            </div>
          </template>
        </el-scrollbar>
      </div>
      
      <div class="news-main">
        <div v-if="loading" class="skeleton-container">
          <el-skeleton animated v-for="i in 10" :key="i" :rows="3" />
        </div>
        
        <el-scrollbar v-else-if="currentItems.length > 0" class="news-list">
          <div
            v-for="(item, index) in currentItems"
            :key="index"
            class="news-item"
            @click="openNews(item)"
          >
            <div class="news-title" :title="item.title">{{ item.title }}</div>
            <div v-if="item.hot" class="news-hot">{{ formatHot(item.hot) }}</div>
          </div>
        </el-scrollbar>
        
        <div v-else class="no-data">
          <div v-if="selectedSource">暂无数据</div>
          <div v-else-if="currentCategory === 'subscribe'">暂无订阅，快去收藏一些热榜吧</div>
          <div v-else>请选择一个热榜源</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'NewsList' })
import { ref, computed, watch, onMounted } from 'vue'
import { openUrl } from '@tauri-apps/plugin-opener'
import { ElMessage } from 'element-plus'
import { Star, StarFilled, Rank } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import { get } from '@/utils/http'
import CategoryTabs from '@/components/CategoryTabs/Index.vue'
import { useNewsStore } from '@/stores/modules/news'

const newsStore = useNewsStore()

const categories = [
  { category: '我的订阅', id: 'subscribe' },
  { category: '全部', id: 'all' },
  { category: '科技', id: 'tech' },
  { category: '社交', id: 'social' },
  { category: '视频', id: 'video' },
  { category: '游戏', id: 'game' },
  { category: '资讯', id: 'news' },
]

const hotSources = [
  { id: '知乎', name: '知乎', category: 'social', categoryLabel: '社交' },
  { id: '36氪', name: '36氪', category: 'tech', categoryLabel: '科技' },
  { id: '51CTO', name: '51CTO', category: 'tech', categoryLabel: '科技' },
  { id: '吾爱破解', name: '吾爱破解', category: 'tech', categoryLabel: '科技' },
  { id: 'AcFun', name: 'AcFun', category: 'video', categoryLabel: '视频' },
  { id: '百度', name: '百度', category: 'news', categoryLabel: '资讯' },
  { id: '哔哩哔哩', name: '哔哩哔哩', category: 'video', categoryLabel: '视频' },
  { id: 'CSDN', name: 'CSDN', category: 'tech', categoryLabel: '科技' },
  { id: '数字尾巴', name: '数字尾巴', category: 'social', categoryLabel: '社交' },
  { id: '豆瓣讨论', name: '豆瓣讨论', category: 'social', categoryLabel: '社交' },
  { id: '豆瓣电影', name: '豆瓣电影', category: 'social', categoryLabel: '社交' },
  { id: '抖音', name: '抖音', category: 'video', categoryLabel: '视频' },
  { id: '极客公园', name: '极客公园', category: 'tech', categoryLabel: '科技' },
  { id: '原神', name: '原神', category: 'game', categoryLabel: '游戏' },
  { id: '果壳', name: '果壳', category: 'social', categoryLabel: '社交' },
  { id: 'HelloGitHub', name: 'HelloGitHub', category: 'tech', categoryLabel: '科技' },
  { id: '历史上的今天', name: '历史上的今天', category: 'news', categoryLabel: '资讯' },
  { id: '崩坏3', name: '崩坏3', category: 'game', categoryLabel: '游戏' },
  { id: '虎扑', name: '虎扑', category: 'social', categoryLabel: '社交' },
  { id: '虎嗅', name: '虎嗅', category: 'news', categoryLabel: '资讯' },
  { id: '爱范儿', name: '爱范儿', category: 'tech', categoryLabel: '科技' },
  { id: 'IT之家「喜加一」', name: 'IT之家「喜加一」', category: 'tech', categoryLabel: '科技' },
  { id: 'IT之家', name: 'IT之家', category: 'tech', categoryLabel: '科技' },
  { id: '简书', name: '简书', category: 'social', categoryLabel: '社交' },
  { id: '稀土掘金', name: '稀土掘金', category: 'tech', categoryLabel: '科技' },  
  { id: '英雄联盟', name: '英雄联盟', category: 'game', categoryLabel: '游戏' },
  { id: '米游社 · 崩坏3', name: '米游社 · 崩坏3', category: 'game', categoryLabel: '游戏' },
  { id: '网易新闻', name: '网易新闻', category: 'news', categoryLabel: '资讯' },
  { id: '水木社区', name: '水木社区', category: 'social', categoryLabel: '社交' },
  { id: 'NGA', name: 'NGA', category: 'game', categoryLabel: '游戏' },
  { id: '腾讯新闻', name: '腾讯新闻', category: 'news', categoryLabel: '资讯' },
  { id: '新浪新闻', name: '新浪新闻', category: 'news', categoryLabel: '资讯' },
  { id: '新浪网', name: '新浪网', category: 'news', categoryLabel: '资讯' },
  { id: '什么值得买', name: '什么值得买', category: 'social', categoryLabel: '社交' },
  { id: '少数派', name: '少数派', category: 'tech', categoryLabel: '科技' },
  { id: '崩坏：星穹铁道', name: '崩坏：星穹铁道', category: 'game', categoryLabel: '游戏' },
  { id: '澎湃新闻', name: '澎湃新闻', category: 'news', categoryLabel: '资讯' },
  { id: '百度贴吧', name: '百度贴吧', category: 'news', categoryLabel: '资讯' },
  { id: '今日头条', name: '今日头条', category: 'news', categoryLabel: '资讯' },
  { id: '中央气象台', name: '中央气象台', category: 'news', categoryLabel: '资讯' },
  { id: '微博', name: '微博', category: 'social', categoryLabel: '社交' },
  { id: '微信读书', name: '微信读书', category: 'social', categoryLabel: '社交' },
  { id: '游研社', name: '游研社', category: 'game', categoryLabel: '游戏' },
  { id: '知乎日报', name: '知乎日报', category: 'social', categoryLabel: '社交' },
]

const sourceCache = ref({})
const loading = ref(false)
const currentCategory = ref('all')
const selectedSource = ref(null)

const filteredSources = computed(() => {
  if (currentCategory.value === 'all') return hotSources
  return hotSources.filter(s => s.category === currentCategory.value)
})

const currentItems = computed(() => {
  if (!selectedSource.value) return []
  return sourceCache.value[selectedSource.value.id] || []
})

function isSubscribed(sourceId) {
  return newsStore.isSubscribed(sourceId)
}

function toggleSubscribe(source) {
  if (isSubscribed(source.id)) {
    newsStore.removeSubscription(source.id)
    ElMessage.info(`已取消收藏 ${source.name}`)
    if (currentCategory.value === 'subscribe' && selectedSource.value?.id === source.id) {
      selectFirstSource()
    }
  } else {
    newsStore.addSubscription(source)
    ElMessage.success(`已收藏 ${source.name}`)
  }
}

function selectSource(source) {
  selectedSource.value = source
  
  if (!sourceCache.value[source.id]) {
    loadSourceData(source)
  }
}

async function loadSourceData(source) {
  loading.value = true
  try {
    const res = await get(`https://api.pearktrue.cn/api/dailyhot?title=${source.id}`)
    if (res && res.code === 200 && res.data) {
      const items = Array.isArray(res.data) ? res.data : [res.data]
      sourceCache.value[source.id] = items.slice(0, 20)
    }
  } catch (e) {
    console.error(`获取 ${source.name} 失败:`, e)
    sourceCache.value[source.id] = []
  } finally {
    loading.value = false
  }
}

function selectFirstSource() {
  let list = currentCategory.value === 'subscribe' 
    ? newsStore.subscriptions
    : filteredSources.value
  
  if (list.length > 0) {
    const firstSource = list[0]
    if (firstSource) {
      selectSource(firstSource)
    }
  } else {
    selectedSource.value = null
  }
}

function onDragEnd() {
  ElMessage.success('收藏顺序已更新')
}

watch(currentCategory, (newCategory) => {
  selectedSource.value = null
  
  selectFirstSource()
}, {
  immediate: true
})

function formatHot(value) {
  if (!value) return ''
  const num = Number(value)
  if (isNaN(num)) return value
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿'
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toString()
}

function openNews(item) {
  if (item.url) {
    openUrl(item.url)
  } else if (item.hotUrl) {
    openUrl(item.hotUrl)
  }
}
</script>

<style lang="less" scoped>
.news-page {
  padding: 10px 0 10px 20px;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
}

.news-layout {
  flex: 1;
  display: flex;
  gap: 16px;
  padding-right: 20px;
  min-height: 0;
}

.category-sidebar {
  width: 180px;
  flex-shrink: 0;
  background: var(--bg-color-secondary);
  overflow: hidden;
}

.source-list {
  width: 100%;
}

.source-item {
  padding: 12px 15px;
  cursor: pointer;
  border-right: 3px solid transparent;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  user-select: none;
  
  &:hover {
    background: var(--hover-bg);
  }
  
  &.active {
    background: var(--hover-bg);
    border-right-color: var(--primary-color);
    
    .source-name {
      color: var(--primary-color);
    }
  }
  
  &.ghost {
    opacity: 0.8;
  }
  
  .drag-handle {
    cursor: move;
    color: var(--text-color-secondary);
    font-size: 14px;
    
    &:hover {
      color: var(--text-color);
    }
  }
  
  .source-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-color);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
  }
}

.news-main {
  flex: 1;
  min-width: 0;
  background: var(--bg-color-secondary);
  overflow: hidden;
}

.skeleton-container {
  padding: 20px;
}

.news-list {
  height: 100%;
  padding: 0;
}

.news-item {
  padding: 12px 15px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  &:hover {
    background: var(--hover-bg);
  }

  &:last-child {
    border-bottom: none;
  }
}

.news-title {
  flex: 1;
  font-size: 14px;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.news-hot {
  flex-shrink: 0;
  font-size: 12px;
  color: #ff6b6b;
  font-weight: 500;
}

.no-data {
  padding: 40px;
  text-align: center;
  color: var(--text-color-secondary);
}
</style>
