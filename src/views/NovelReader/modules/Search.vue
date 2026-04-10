<template>
  <div class="search">
    <div class="search-box">
      <el-input
        v-model="searchKeyword"
        placeholder="输入书名或作者搜索..."
        @keyup.enter="searchBooks"
      />
      <el-button type="primary" @click="searchBooks">搜索</el-button>
    </div>

    <div v-if="currentSource" class="current-source">
      当前书源: {{ currentSource.bookSourceName }}
      <span class="change-btn" @click="$emit('change-tab', 'sourceManage')">切换</span>
    </div>
    <div v-else class="no-source">
      请先选择书源 <span @click="$emit('change-tab', 'sourceManage')">去选择</span>
    </div>

    <div v-if="searching" class="loading">搜索中...</div>

    <el-scrollbar v-else-if="searchResults.length > 0" class="book-list-scrollbar">
      <div class="book-list">
        <div
          v-for="book in searchResults"
          :key="book.bookUrl + book.sourceUrl"
          class="book-item"
          @click="$emit('select-book', book)"
        >
          <img
            v-if="book.coverUrl"
            :src="book.coverUrl"
            class="book-cover"
            @error="book.coverUrl = ''"
          />
          <div v-else class="book-cover placeholder">📖</div>
          <div class="book-info">
            <div class="book-name">{{ book.bookName }}</div>
            <div class="book-author">作者：{{ book.author }} · {{ book.wordCount }}</div>
            <div class="book-intro" :title="book.intro">简介：{{ book.intro }}</div>
          </div>
        </div>
      </div>
    </el-scrollbar>

    <div v-else-if="searched && searchResults.length === 0" class="no-result">
      未找到相关书籍
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { fetchUrl } from '@/utils/http'
import { request } from '@/hooks/useApi'
import { useBookSourceStore } from '@/stores/modules/bookSource'
import { buildSearchUrl, parseSearchResultAsync, parseHeader } from '@/views/NovelReader/utils'

const emit = defineEmits(['select-book', 'change-tab'])

const bookSourceStore = useBookSourceStore()

const searchKeyword = ref('明朝')
const searching = ref(false)
const searched = ref(false)
const searchResults = ref([])

const currentSource = computed(() => bookSourceStore.currentSource)

async function searchBooks() {
  if (!currentSource.value) {
    emit('change-tab', 'sourceManage')
    return
  }
  if (!searchKeyword.value.trim()) return

  searching.value = true
  searched.value = false
  searchResults.value = []

  try {
    const source = currentSource.value
    console.log('source: ', source);
    
    // 构建搜索配置（支持 POST 和 JS 脚本）
    const searchConfig = buildSearchUrl(source, searchKeyword.value)
    console.log('搜索配置:', searchConfig)
    
    const headers = parseHeader(source.header)
    headers['User-Agent'] = headers['User-Agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

    // 根据配置构建请求
    const requestOptions = {
      method: searchConfig.method || 'GET',
      headers: headers
    }
    
    // 如果有 body，添加到请求中
    if (searchConfig.body) {
      requestOptions.body = searchConfig.body
      headers['Content-Type'] = headers['Content-Type'] || 'application/x-www-form-urlencoded'
    }
    
    // 使用后端 API 备选（如果前端 fetch 失败）
    try {
      const requestOptions = {
        url: searchConfig.url,
        method: searchConfig.method || 'GET',
        // headers: headers,
        return_type: 'text'
      }
      if (searchConfig.body) {
        requestOptions.body = searchConfig.body
      }
      
      const res = await request(requestOptions)
      // const res = await fetchUrl(searchConfig.url, requestOptions)
      console.log('res:', res)

      if (res) {
        const ruleSearch = source.ruleSearch || {}
        console.log('source: ', source);
        console.log('搜索规则:', ruleSearch)
        
        const results = await parseSearchResultAsync(res, ruleSearch, source.bookSourceUrl)
        console.log('解析结果数量:', results.length)
        console.log('解析结果:', results)
        
        searchResults.value = results.map(item => ({
          bookName: item.bookName,
          author: item.author,
          bookUrl: item.bookUrl,
          coverUrl: item.coverUrl,
          intro: item.intro,
          kind: item.kind,
          wordCount: item.wordCount,
          latestChapter: item.latestChapter,
          sourceName: source.bookSourceName,
          sourceUrl: source.bookSourceUrl
        }))
      }
    } catch (invokeError) {
      console.error('invoke调用失败:', invokeError)
    }
  } catch (e) {
    console.error('搜索失败:', e)
  } finally {
    searching.value = false
    searched.value = true
  }
}
</script>

<style lang="less" scoped>
.search {
  height: 100%;
  overflow-y: auto;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.current-source {
  text-align: center;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 14px;

  .change-btn {
    color: #667eea;
    cursor: pointer;
    margin-left: 10px;
  }
}

.no-source {
  text-align: center;
  padding: 20px;
  color: #888;
  font-size: 14px;

  span {
    color: #667eea;
    cursor: pointer;
  }
}

.loading, .no-result {
  text-align: center;
  padding: 40px;
  color: #888;
  font-size: 14px;
}

.book-list-scrollbar {
  height: calc(100% - 110px);
}

.book-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.book-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.book-cover {
  width: 64px;
  height: 90px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;

  &.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e0e0e0;
    font-size: 30px;
  }
}

.book-info {
  flex: 1;
  display: flex;
  flex-direction: column;

  .book-name {
    font-size: 16px;
    font-weight: bold;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 5px;
  }

  .book-author {
    font-size: 14px;
    color: #888;
    margin-bottom: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .book-intro {
    font-size: 12px;
    color: #888;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
}
</style>
