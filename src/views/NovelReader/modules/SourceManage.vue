<template>
  <div class="source-manage">
    <div class="source-actions">
      <button @click="importSource">📥 导入书源</button>
      <button @click="exportSource">📤 导出书源</button>
    </div>

    <div class="source-list">
      <div
        v-for="source in sources"
        :key="source.bookSourceUrl"
        class="source-item"
        :class="{ disabled: !source.enabled, active: currentSource?.bookSourceUrl === source.bookSourceUrl }"
      >
        <div class="source-info">
          <div class="source-name">{{ source.bookSourceName }}</div>
          <div class="source-url">{{ source.bookSourceUrl }}</div>
        </div>
        <div class="source-actions-btns">
          <button
            :class="{ active: source.enabled }"
            @click="toggleSource(source.bookSourceUrl)"
          >
            {{ source.enabled ? '✓ 启用' : '○ 禁用' }}
          </button>
          <button
            class="use-btn"
            @click="selectSource(source)"
          >
            {{ currentSource?.bookSourceUrl === source.bookSourceUrl ? '✓ 正在使用' : '使用' }}
          </button>
          <button class="test-btn" @click="testSource(source)">
            测试
          </button>
          <button class="delete-btn" @click="deleteSource(source.bookSourceUrl)">
            删除
          </button>
        </div>
      </div>
    </div>

    <div v-if="sources.length === 0" class="empty-source">
      <div class="empty-icon">📡</div>
      <p>暂无书源</p>
      <p class="tip">点击上方导入按钮导入书源</p>
      <p class="tip">书源为 JSON 格式，可从 Legado 导出</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { useBookSourceStore } from '@/stores/modules/bookSource'
import { ElMessage } from 'element-plus'

const bookSourceStore = useBookSourceStore()

const sources = computed(() => bookSourceStore.sources)
const currentSource = computed(() => bookSourceStore.currentSource)

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
  padding: 15px;
  height: 100%;
  overflow-y: auto;
}

.source-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;

  button {
    padding: 10px 20px;
    background: #667eea;
    color: #fff;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;

    &:hover {
      background: #5a6fd6;
    }
  }
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
  gap: 8px;
  flex-wrap: wrap;

  button {
    padding: 6px 12px;
    font-size: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    background: #fff;
    transition: all 0.2s;

    &.active {
      background: #667eea;
      color: #fff;
      border-color: #667eea;
    }

    &.use-btn {
      background: #667eea;
      color: #fff;
      border-color: #667eea;

      &:hover {
        background: #5a6fd6;
      }
    }

    &.test-btn {
      background: #e6a23c;
      color: #fff;
      border-color: #e6a23c;

      &:hover {
        background: #cf9236;
      }
    }

    &.delete-btn {
      color: #f56c6c;
      border-color: #f56c6c;

      &:hover {
        background: #f56c6c;
        color: #fff;
      }
    }
  }
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
</style>
