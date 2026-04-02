<template>
  <div class="search-tab">
    <div class="search-box">
      <el-input
        v-model="searchKeyword"
        placeholder="输入歌曲名、歌手名搜索"
        @keyup.enter="handleSearch"
        clearable
      >
        <template #append>
          <el-button @click="handleSearch">搜索</el-button>
        </template>
      </el-input>
    </div>

    <div v-if="searchHistory.length > 0" class="search-history">
      <div class="history-header">
        <span>搜索历史</span>
        <el-button type="text" size="small" @click="clearSearchHistory">清空</el-button>
      </div>
      <div class="history-tags">
        <el-tag
          v-for="keyword in searchHistory"
          :key="keyword"
          @click="searchKeyword = keyword; handleSearch()"
          closable
          @close="removeSearchHistory(keyword)"
        >
          {{ keyword }}
        </el-tag>
      </div>
    </div>

    <div v-if="searchResults.length > 0" class="search-results">
      <div class="results-header">
        <span>搜索结果 ({{ searchResults.length }})</span>
      </div>
      <div class="music-list">
        <div
          v-for="(music, index) in searchResults"
          :key="music.songmid || index"
          class="music-item"
          @click="$emit('play-music', music)"
        >
          <span class="music-icon">
            {{ isPlaying && currentMusic?.songmid === music.songmid ? '🔊' : '🎵' }}
          </span>
          <div class="music-info">
            <div class="music-name">{{ music.name || music.songname }}</div>
            <div class="music-artist">
              {{ music.singer?.map(s => s.name).join(' / ') || music.artist || '未知歌手' }}
            </div>
          </div>
          <div class="music-actions">
            <el-button type="text" size="small" @click.stop="$emit('add-to-playlist', music)">
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="hasSearched" class="empty">
      未找到相关歌曲
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import musicSdk from '@/utils/musicSdk'

defineProps({
  currentMusic: {
    type: Object,
    default: null,
  },
  isPlaying: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['play-music', 'add-to-playlist'])

const searchKeyword = ref('')
const searchResults = ref([])
const searchHistory = ref([])
const hasSearched = ref(false)

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) return

  try {
    ElMessage.info('正在搜索...')
    hasSearched.value = true
    const results = await musicSdk.search(searchKeyword.value)
    
    if (results && (results.list || results)) {
      searchResults.value = results.list || results
    } else {
      searchResults.value = []
    }

    addSearchHistory(searchKeyword.value)
    ElMessage.success(`找到 ${searchResults.value.length} 首歌曲`)
  } catch (error) {
    ElMessage.error('搜索失败: ' + error.message)
    searchResults.value = []
  }
}

const addSearchHistory = (keyword) => {
  const index = searchHistory.value.indexOf(keyword)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
  }
  searchHistory.value.unshift(keyword)
  if (searchHistory.value.length > 20) {
    searchHistory.value.pop()
  }
}

const removeSearchHistory = (keyword) => {
  const index = searchHistory.value.indexOf(keyword)
  if (index > -1) {
    searchHistory.value.splice(index, 1)
  }
}

const clearSearchHistory = () => {
  searchHistory.value = []
}
</script>

<style lang="less" scoped>
.search-tab {
  height: 100%;
  overflow-y: auto;
}

.search-box {
  margin-bottom: 20px;
}

.search-history {
  margin-bottom: 20px;

  .history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    color: #666;
  }

  .history-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.search-results {
  .results-header {
    margin-bottom: 15px;
    font-weight: 600;
    color: #333;
  }
}

.music-list {
  .music-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: #f5f5f5;
    }

    .music-icon {
      font-size: 20px;
    }

    .music-info {
      flex: 1;
      overflow: hidden;

      .music-name {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .music-artist {
        font-size: 12px;
        color: #888;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #888;
}
</style>
