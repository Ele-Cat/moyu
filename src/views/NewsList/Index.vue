<template>
  <div class="news-page">
    <div class="categories">
      <button
        v-for="cat in categories"
        :key="cat.value"
        :class="{ active: currentCategory === cat.value }"
        @click="filterCategory(cat.value)"
      >
        {{ cat.label }}
      </button>
    </div>

    <div class="news-content">
      <div v-if="loading" class="loading">
        加载中...
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
          <div class="source-list">
            <div
              v-for="item in source.items"
              :key="item.url"
              class="news-item"
              @click="openNews(item)"
            >
              <div class="news-title">{{ item.title }}</div>
              <div class="news-meta">
                <span class="hot-value">{{ item.hot_value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: 'NewsList' })
import { ref, computed, onMounted } from 'vue'
import { get } from '@/hooks/useApi'
import { openUrl } from '@tauri-apps/plugin-opener'

const categories = [
  { label: '全部', value: 'all' },
  { label: '社交', value: 'social' },
  { label: '资讯', value: 'news' },
  { label: '视频', value: 'video' },
  { label: '财经', value: 'finance' },
  { label: '科技', value: 'tech' },
  { label: '社区', value: 'community' },
  { label: '国际', value: 'international' },
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
  { id: 'sputniknewscn', name: '卫星通讯社', category: 'international', categoryLabel: '国际' },
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

function filterCategory(category) {
  currentCategory.value = category
}

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
  display: flex;
  flex-direction: column;
  background: var(--bg-color);
}

.categories {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  background: var(--bg-color-secondary);
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
  flex-shrink: 0;

  button {
    padding: 8px 16px;
    border: 1px solid var(--border-color);
    border-radius: 20px;
    background: var(--bg-color-secondary);
    color: var(--text-color-secondary);
    cursor: pointer;
    transition: all 0.2s;

    &.active {
      background: var(--primary-color);
      color: #fff;
      border-color: var(--primary-color);
    }
  }
}

.news-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: var(--text-color-muted);
}

.hot-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
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
  padding: 12px 15px;
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
  max-height: 400px;
  overflow-y: auto;
}

.news-item {
  padding: 12px 15px;
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
