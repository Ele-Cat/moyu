<template>
  <div class="songlist-tab">
    <div v-if="songLists.length > 0" class="songlist-grid">
      <div
        v-for="(list, index) in songLists"
        :key="list.id || index"
        class="songlist-card"
        @click="loadSongListDetail(list)"
      >
        <div class="cover">
          <img :src="list.pic || list.img || list.pic_small" :alt="list.name" />
        </div>
        <div class="info">
          <div class="name">{{ list.name }}</div>
        </div>
      </div>
    </div>
    <div v-else class="empty">
      <el-button type="primary" @click="loadRecommendSongLists">加载推荐歌单</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import musicSdk from '@/utils/musicSdk'

defineEmits(['load-songs'])

const songLists = ref([])

const loadRecommendSongLists = async () => {
  try {
    ElMessage.info('正在加载推荐歌单...')
    const result = await musicSdk.getRecommendSongList()
    
    if (result && (result.list || result)) {
      songLists.value = result.list || result
      ElMessage.success(`加载到 ${songLists.value.length} 个歌单`)
    }
  } catch (error) {
    ElMessage.error('加载推荐歌单失败: ' + error.message)
  }
}

const loadSongListDetail = async (list) => {
  try {
    ElMessage.info('正在加载歌单详情...')
    const result = await musicSdk.getSongListDetail(list)
    
    if (result && (result.list || result)) {
      const songs = result.list || result
      ElMessage.success(`加载到 ${songs.length} 首歌曲`)
      emit('load-songs', songs)
    }
  } catch (error) {
    ElMessage.error('加载歌单详情失败: ' + error.message)
  }
}
</script>

<style lang="less" scoped>
.songlist-tab {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.songlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;

  .songlist-card {
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
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
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
