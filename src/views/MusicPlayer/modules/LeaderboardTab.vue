<template>
  <div class="leaderboard-tab">
    <div v-if="leaderboards.length > 0" class="leaderboard-grid">
      <div
        v-for="(board, index) in leaderboards"
        :key="board.id || index"
        class="leaderboard-card"
        @click="loadLeaderboard(board)"
      >
        <div class="cover">
          <img :src="board.pic || board.img" :alt="board.name" />
        </div>
        <div class="info">
          <div class="name">{{ board.name }}</div>
          <div class="update-time">{{ board.update_time || '' }}</div>
        </div>
      </div>
    </div>
    <div v-else class="empty">
      <el-button type="primary" @click="loadLeaderboardList">加载排行榜</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import musicSdk from '@/utils/musicSdk'

defineEmits(['load-songs'])

const leaderboards = ref([])

const loadLeaderboardList = async () => {
  try {
    ElMessage.info('正在加载排行榜...')
    const result = await musicSdk.getLeaderboardList()
    
    if (result && (result.list || result)) {
      leaderboards.value = result.list || result
      ElMessage.success(`加载到 ${leaderboards.value.length} 个排行榜`)
    }
  } catch (error) {
    ElMessage.error('加载排行榜失败: ' + error.message)
  }
}

const loadLeaderboard = async (board) => {
  try {
    ElMessage.info('正在加载排行榜...')
    const result = await musicSdk.getLeaderboard(board)
    
    if (result && (result.list || result)) {
      const songs = result.list || result
      ElMessage.success(`加载到 ${songs.length} 首歌曲`)
      emit('load-songs', songs)
    }
  } catch (error) {
    ElMessage.error('加载排行榜失败: ' + error.message)
  }
}
</script>

<style lang="less" scoped>
.leaderboard-tab {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.leaderboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;

  .leaderboard-card {
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: translateY(-5px);
    }

    .cover {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 8px;
      overflow: hidden;
      background: #f0f0f0;
      margin-bottom: 10px;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .info {
      .name {
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        line-clamp: 2;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }

      .update-time {
        font-size: 12px;
        color: #888;
        margin-top: 4px;
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
