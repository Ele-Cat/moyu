<template>
  <div class="news-page">
    <CategoryTabs v-model="currentCategory" :categories="categories" />

    <div class="news-content">
      <el-scrollbar>
        <div v-if="loading" class="skeleton-container">
          <el-skeleton animated v-for="i in 16" :key="i" class="skeleton-grid">
            <template #template>
              <div class="skeleton-item">
                <el-skeleton-item v-for="j in 8" :key="j" class="skeleton-row" />
              </div>
            </template>
          </el-skeleton>
        </div>
        

        <div v-else class="hot-list">
          <div
            v-for="source in filteredSources"
            :key="source.id"
            class="source-card"
          >
            <div class="source-header">
              <span class="source-name">{{ source.name }}</span>
              <span class="source-category">{{ source.categoryLabel }}</span>
            </div>
            <el-scrollbar class="source-list">
              <div
                v-for="item in source.items"
                :key="item.url"
                class="news-item"
                @click="openNews(item)"
              >
                <div class="news-title" :title="item.title">{{ item.title }}</div>
              </div>
            </el-scrollbar>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'NewsList' })
import { ref, computed, onMounted } from 'vue'
import { get } from '@/hooks/useApi'
import { openUrl } from '@tauri-apps/plugin-opener'
import CategoryTabs from '@/components/CategoryTabs/Index.vue'

const categories = [
  { category: '全部', id: 'all' },
  { category: '社交', id: 'social' },
  { category: '资讯', id: 'news' },
  { category: '视频', id: 'video' },
  { category: '财经', id: 'finance' },
  { category: '科技', id: 'tech' },
  { category: '社区', id: 'community' },
  { category: '国际', id: 'international' },
]

const hotSources = [
  { id: 'weibo', name: '微博', category: 'social', categoryLabel: '社交' },
  { id: 'zhihu', name: '知乎热榜', category: 'social', categoryLabel: '社交' },
  { id: 'hupu', name: '虎扑步行街', category: 'social', categoryLabel: '社交' },
  { id: 'tieba', name: '贴吧热议', category: 'social', categoryLabel: '社交' },
  { id: 'douban', name: '豆瓣电影', category: 'social', categoryLabel: '社交' },
  { id: 'baidu', name: '百度热搜', category: 'news', categoryLabel: '资讯' },
  { id: 'douyin', name: '抖音热搜', category: 'news', categoryLabel: '资讯' },
  { id: 'toutiao', name: '今日头条', category: 'news', categoryLabel: '资讯' },
  { id: 'thepaper', name: '澎湃新闻', category: 'news', categoryLabel: '资讯' },
  { id: 'ifeng', name: '凤凰网', category: 'news', categoryLabel: '资讯' },
  { id: 'tencent-hot', name: '腾讯新闻', category: 'news', categoryLabel: '资讯' },
  { id: 'bilibili-hot-search', name: 'B站热搜', category: 'video', categoryLabel: '视频' },
  { id: 'iqiyi-hot-ranklist', name: '爱奇艺热播', category: 'video', categoryLabel: '视频' },
  { id: 'qqvideo-tv-hotsearch', name: '腾讯视频', category: 'video', categoryLabel: '视频' },
  { id: 'cls-telegraph', name: '财联社电报', category: 'finance', categoryLabel: '财经' },
  { id: 'cls-hot', name: '财联社热门', category: 'finance', categoryLabel: '财经' },
  { id: 'wallstreetcn-news', name: '华尔街见闻', category: 'finance', categoryLabel: '财经' },
  { id: 'jin10', name: '金十数据', category: 'finance', categoryLabel: '财经' },
  { id: 'gelonghui', name: '格隆汇', category: 'finance', categoryLabel: '财经' },
  { id: 'fastbull-express', name: 'FastBull', category: 'finance', categoryLabel: '财经' },
  { id: 'mktnews-flash', name: 'MKTNews', category: 'finance', categoryLabel: '财经' },
  { id: '36kr-quick', name: '36氪', category: 'finance', categoryLabel: '财经' },
  { id: 'xueqiu-hotstock', name: '雪球热股', category: 'finance', categoryLabel: '财经' },
  { id: 'ithome', name: 'IT之家', category: 'tech', categoryLabel: '科技' },
  { id: 'juejin', name: '掘金热榜', category: 'tech', categoryLabel: '科技' },
  { id: 'sspai', name: '少数派', category: 'tech', categoryLabel: '科技' },
  { id: 'coolapk', name: '酷安热榜', category: 'tech', categoryLabel: '科技' },
  { id: 'v2ex-share', name: 'V2EX', category: 'tech', categoryLabel: '科技' },
  { id: 'chongbuluo-latest', name: '虫部落最新', category: 'tech', categoryLabel: '科技' },
  { id: 'chongbuluo-hot', name: '虫部落热门', category: 'tech', categoryLabel: '科技' },
  { id: 'nowcoder', name: '牛客', category: 'community', categoryLabel: '社区' },
  { id: 'freebuf', name: 'FreeBuf', category: 'community', categoryLabel: '社区' },
  { id: 'solidot', name: 'Solidot', category: 'community', categoryLabel: '社区' },
  { id: 'pcbeta-windows11', name: '远景论坛', category: 'community', categoryLabel: '社区' },
  { id: 'github-trending-today', name: 'GitHub', category: 'international', categoryLabel: '国际' },
  { id: 'hackernews', name: 'Hacker News', category: 'international', categoryLabel: '国际' },
  { id: 'producthunt', name: 'Product Hunt', category: 'international', categoryLabel: '国际' },
  { id: 'steam', name: 'Steam', category: 'international', categoryLabel: '国际' },
  { id: 'zaobao', name: '联合早报', category: 'international', categoryLabel: '国际' },
  { id: 'cankaoxiaoxi', name: '参考消息', category: 'international', categoryLabel: '国际' },
  { id: 'kaopu', name: '靠谱新闻', category: 'international', categoryLabel: '国际' },
]

const sourceData = ref([])
const loading = ref(false)
const currentCategory = ref('all')

const filteredSources = computed(() => {
  if (currentCategory.value === 'all') {
    return sourceData.value
  }
  return sourceData.value.filter(s => s.category === currentCategory.value)
})

async function fetchSource(source) {
  try {
    const res = await get(`https://api.lolimi.cn/API/hot/entire?id=${source.id}`)
    if (res && res.code === 200 && res.items) {
      return {
        ...source,
        items: res.items.slice(0, 10)
      }
    }
  } catch (e) {
    console.error(`获取 ${source.name} 失败:`, e)
  }
  return {
    ...source,
    items: []
  }
}

async function refreshNews() {
  loading.value = true
  try {
    const promises = hotSources.map(source => fetchSource(source))
    sourceData.value = await Promise.all(promises)
  } catch (e) {
    console.error('获取热榜失败:', e)
  } finally {
    loading.value = false
  }
}

function openNews(item) {
  openUrl(item.url)
}

onMounted(() => {
  refreshNews()
})
</script>

<style lang="less" scoped>
.news-page {
  padding: 10px 20px;
}

.news-content {
  height: calc(100vh - 110px);
  overflow: hidden;
}

.skeleton-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.skeleton-grid {
  display: flex;
  flex-direction: column;
  height: 240px;
}

.skeleton-item {
  display: grid;
  gap: 16px;
}

.hot-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.source-card {
  background: var(--bg-color-secondary);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-end) 100%);
  color: #fff;
}

.source-name {
  font-weight: 500;
}

.source-category {
  font-size: 12px;
  opacity: 0.8;
}

.source-list {
  max-height: 360px;
  overflow-y: auto;
}

.news-item {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--hover-bg);
  }

  &:last-child {
    border-bottom: none;
  }
}

.news-title {
  font-size: 14px;
  color: var(--text-color);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.hot-value {
  color: #ff6b6b;
}
</style>
