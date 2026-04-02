<template>
  <div class="local-music-tab">
    <div class="list-header">
      <el-button @click="selectFolder">📂 选择音乐文件夹</el-button>
    </div>

    <div v-if="localMusicList.length > 0" class="music-list">
      <div
        v-for="(music, index) in localMusicList"
        :key="music.path"
        class="music-item"
        :class="{ active: currentIndex === index }"
        @click="$emit('play-music', index)"
      >
        <span class="music-icon">
          {{ isPlaying && currentIndex === index ? '🔊' : '🎵' }}
        </span>
        <span class="music-name">{{ music.name }}</span>
      </div>
    </div>

    <div v-else class="empty">
      请选择音乐文件夹
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { open } from '@tauri-apps/plugin-dialog'
import { invoke } from '@tauri-apps/api/core'
import { ElMessage } from 'element-plus'

defineProps({
  localMusicList: {
    type: Array,
    default: () => [],
  },
  currentIndex: {
    type: Number,
    default: -1,
  },
  isPlaying: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:localMusicList', 'play-music'])

const selectFolder = async () => {
  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: '选择音乐文件夹',
    })

    if (selected) {
      const files = await invoke('scan_folder', {
        path: selected,
        extensions: ['mp3', 'flac', 'wav', 'ogg', 'm4a'],
      })
      emit('update:localMusicList', files)
      ElMessage.success(`找到 ${files.length} 首本地音乐`)
    }
  } catch (e) {
    console.error('选择文件夹失败:', e)
    ElMessage.error('选择文件夹失败: ' + e)
  }
}
</script>

<style lang="less" scoped>
.local-music-tab {
  height: 100%;
  overflow-y: auto;
  padding: 20px;
}

.list-header {
  margin-bottom: 20px;
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

    &.active {
      background: #e0e0e0;
      color: #2a5298;
    }

    .music-icon {
      font-size: 20px;
    }

    .music-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
