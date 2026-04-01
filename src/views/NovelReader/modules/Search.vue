<template>
  <div class="search">
    <div class="search-box">
      <input
        v-model="searchKeyword"
        placeholder="输入书名或作者搜索..."
        @keyup.enter="searchBooks"
      />
      <button @click="searchBooks">搜索</button>
    </div>

    <div v-if="currentSource" class="current-source">
      当前书源: {{ currentSource.bookSourceName }}
      <span class="change-btn" @click="$emit('change-tab', 'sourceManage')">切换</span>
    </div>
    <div v-else class="no-source">
      请先选择书源 <span @click="$emit('change-tab', 'sourceManage')">去选择</span>
    </div>

    <div v-if="searching" class="loading">搜索中...</div>

    <div v-else-if="searchResults.length > 0" class="book-list">
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
          <div class="book-author">{{ book.author }}</div>
        {{ book.coverUrl }}

        </div>
      </div>
    </div>

    <div v-else-if="searched && searchResults.length === 0" class="no-result">
      未找到相关书籍
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { fetchUrl } from '@/utils/http'
import { useBookSourceStore } from '@/stores/modules/bookSource'
import { buildSearchUrl, parseSearchResult, parseHeader } from '@/views/NovelReader/utils'

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
    
    // const res = await fetchUrl(searchConfig.url, requestOptions)
    
    // 使用后端 API 备选（如果前端 fetch 失败）
    const {body: res} = await invoke('fetch_api', {
      options: {
        url: searchConfig.url,
        method: searchConfig.method || 'GET',
        headers: headers,
        body: searchConfig.body,
        return_type: 'text'
      }
    })
    console.log('res:', res)

    if (res) {
      const ruleSearch = source.ruleSearch || {}
      console.log('source: ', source);
      console.log('搜索规则:', ruleSearch)
      
      const results = parseSearchResult(res, ruleSearch, source.bookSourceUrl)
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
  padding: 15px;
  height: 100%;
  overflow-y: auto;
}

.search-box {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;

  input {
    flex: 1;
    padding: 10px 15px;
    border: 1px solid #ddd;
    border-radius: 25px;
    outline: none;
    font-size: 14px;

    &:focus {
      border-color: #667eea;
    }
  }

  button {
    padding: 10px 25px;
    background: #667eea;
    color: #fff;
    border: none;
    border-radius: 25px;
    cursor: pointer;
    font-size: 14px;
  }
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

.book-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.book-item {
  display: flex;
  gap: 12px;
  padding: 12px;
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
  width: 70px;
  height: 95px;
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
  justify-content: center;
  min-width: 0;

  .book-name {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .book-author {
    font-size: 13px;
    color: #888;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
