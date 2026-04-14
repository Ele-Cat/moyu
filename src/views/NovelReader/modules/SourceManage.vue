<template>
  <div class="source-manage">
    <div class="source-actions">
      <el-button type="primary" size="small" round :icon="Download" @click="importSource">导入书源</el-button>
      <el-button type="primary" size="small" round :icon="Upload" @click="exportSource">导出书源</el-button>
    </div>

    <div class="source-search">
      <el-input
        v-model="searchText"
        placeholder="搜索书源..."
        class="search-input"
      />
    </div>

    <el-scrollbar class="source-list-scrollbar" @end-reached="loadMore">
      <div class="source-list">
        <div
          v-for="source in filteredSources"
          :key="source.bookSourceUrl"
          class="source-item"
          :class="{ disabled: !source.enabled, active: currentSource?.bookSourceUrl === source.bookSourceUrl }"
        >
          <div class="source-info">
            <div class="source-name">
              {{ source.bookSourceName }}
              <div class="source-actions-btns">
                <el-button
                  type="primary"
                  size="small"
                  :class="{ active: source.enabled }"
                  @click="toggleSource(source.bookSourceUrl)"
                >
                  {{ source.enabled ? '✓ 启用' : '○ 禁用' }}
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  class="use-btn"
                  @click="selectSource(source)"
                >
                  {{ currentSource?.bookSourceUrl === source.bookSourceUrl ? '✓ 正在使用' : '使用' }}
                </el-button>
                <el-button
                  size="small"
                  type="info"
                  plain
                  class="test-btn" @click="testSource(source)">
                  测试
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  plain
                  @click="deleteSource(source.bookSourceUrl)">
                  删除
                </el-button>
              </div>
            </div>
            <div class="source-url">{{ source.bookSourceUrl }}</div>
          </div>
        </div>
      </div>
      <div v-if="loadingMore" class="loading-more">
        <span>加载中...</span>
      </div>
      <div v-else-if="!hasMore && displayedSources.length > 0" class="no-more">
        <span>没有更多了</span>
      </div>
    </el-scrollbar>

    <div v-if="filteredSources.length === 0" class="empty-source">
      <div class="empty-icon">📡</div>
      <p>{{ searchText ? '未找到匹配书源' : '暂无书源' }}</p>
      <p class="tip">点击上方导入按钮导入书源</p>
      <p class="tip">书源为 JSON 格式，可从 Legado 导出</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { useBookSourceStore } from '@/stores/modules/bookSource'
import { ElMessage } from 'element-plus'
import { Upload, Download } from '@element-plus/icons-vue'

const PAGE_SIZE = 30

const bookSourceStore = useBookSourceStore()

const sources = computed(() => bookSourceStore.sources)
const currentSource = computed(() => bookSourceStore.currentSource)
const searchText = ref('')
const displayedSources = ref([])
const page = ref(0)
const allFilteredSources = ref([])
const loadingMore = ref(false)
const hasMore = ref(true)

function loadMore() {
  if (loadingMore.value || !hasMore.value) return
  
  loadingMore.value = true
  const start = page.value * PAGE_SIZE
  const end = start + PAGE_SIZE
  const newItems = allFilteredSources.value.slice(start, end)
  
  if (newItems.length > 0) {
    displayedSources.value = [...displayedSources.value, ...newItems]
    page.value++
  }
  
  if (end >= allFilteredSources.value.length) {
    hasMore.value = false
  }
  
  loadingMore.value = false
}

function resetPagination() {
  const keyword = searchText.value.toLowerCase()
  allFilteredSources.value = keyword 
    ? sources.value.filter(s => s.bookSourceName?.toLowerCase().includes(keyword) || s.bookSourceUrl?.toLowerCase().includes(keyword))
    : sources.value
  
  displayedSources.value = allFilteredSources.value.slice(0, PAGE_SIZE)
  page.value = 1
  hasMore.value = allFilteredSources.value.length > PAGE_SIZE
  loadingMore.value = false
}

const filteredSources = computed(() => displayedSources.value)

watch(sources, resetPagination, { immediate: true })
watch(searchText, resetPagination)

function toggleSource(url) {
  bookSourceStore.toggleSource(url)
}

function selectSource(source) {
  bookSourceStore.setCurrentSource(source)
  ElMessage.success(`已切换到 ${source.bookSourceName}`)
}

function deleteSource(url) {
  if (confirm('确定删除此书源？')) {
    bookSourceStore.removeSource(url)
    ElMessage.success('删除成功')
  }
}

async function importSource() {
  try {
    const selected = await openDialog({
      multiple: false,
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })

    if (selected) {
      ElMessage.info('正在导入...')
      const content = await readTextFile(selected)
      const result = await bookSourceStore.importSources(content)
      if (result.success) {
        ElMessage.success('导入成功')
        if (!currentSource.value && sources.value.length > 0) {
          bookSourceStore.setCurrentSource(sources.value[0])
        }
      } else {
        ElMessage.error('导入失败: ' + result.error)
      }
    }
  } catch (e) {
    console.error('导入失败:', e)
    ElMessage.error('导入失败: ' + e)
  }
}

function exportSource() {
  const data = bookSourceStore.exportSources()
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'bookSources.json'
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('导出成功')
}

async function testSource(source) {
  ElMessage.info(`正在测试 ${source.bookSourceName}...`)
  try {
    const res = await invoke('fetch_api', {
      options: {
        url: `${source.bookSourceUrl}/search`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { key: '测试' }
      }
    })

    if (res.status === 200) {
      ElMessage.success(`${source.bookSourceName} 连接成功`)
    } else {
      ElMessage.warning(`${source.bookSourceName} 返回异常状态`)
    }
  } catch (e) {
    ElMessage.error(`${source.bookSourceName} 连接失败`)
  }
}
</script>

<style lang="less" scoped>
.source-manage {
  height: 100%;
  overflow-y: auto;
}

.source-actions {
  display: flex;
  margin-bottom: 15px;
}

.source-search {
  margin-bottom: 15px;
}

.source-list-scrollbar {
  height: calc(100% - 110px);
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.source-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  border: 2px solid transparent;

  &.disabled {
    opacity: 0.5;
  }

  &.active {
    border-color: #667eea;
  }
}

.source-info {
  .source-name {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-weight: bold;
    font-size: 15px;
    margin-bottom: 3px;
  }

  .source-url {
    font-size: 12px;
    color: #888;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.source-actions-btns {
  display: flex;
}

.empty-source {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #888;

  .empty-icon {
    font-size: 50px;
    margin-bottom: 15px;
  }

  p {
    margin: 5px 0;
  }

  .tip {
    font-size: 12px;
    color: #aaa;
  }
}

.loading-more,
.no-more {
  text-align: center;
  padding: 15px;
  color: #888;
  font-size: 13px;
}
</style>
