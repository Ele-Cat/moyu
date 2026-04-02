<template>
  <div class="music-player">
    <div class="header">
      <div class="source-selector">
        <el-select v-model="currentSourceId" @change="handleSourceChange" placeholder="选择音源">
          <el-option
            v-for="source in sources"
            :key="source.id"
            :label="source.name"
            :value="source.id"
          >
            <div class="source-option">
              <span>{{ source.name }}</span>
              <el-tag :type="getSourceStatusType(source.status)" size="small">
                {{ getSourceStatusText(source.status) }}
              </el-tag>
            </div>
          </el-option>
        </el-select>
        <el-button type="primary" size="small" @click="showSourceManage = true">
          管理音源
        </el-button>
      </div>
    </div>

    <div class="content">
      <el-tabs v-model="activeTab" class="main-tabs">
        <el-tab-pane label="🔍 搜索" name="search">
          <SearchTab
            :current-music="currentMusic"
            :is-playing="isPlaying"
            @play-music="playOnlineMusic"
            @add-to-playlist="addToPlayList"
          />
        </el-tab-pane>

        <el-tab-pane label="📋 歌单" name="songlist">
          <SongListTab @load-songs="handleLoadSongs" />
        </el-tab-pane>

        <el-tab-pane label="🏆 排行榜" name="leaderboard">
          <LeaderboardTab @load-songs="handleLoadSongs" />
        </el-tab-pane>

        <el-tab-pane label="💾 本地音乐" name="local">
          <LocalMusicTab
            v-model:local-music-list="localMusicList"
            :current-index="currentIndex"
            :is-playing="isPlaying && isLocalMusic"
            @play-music="playLocalMusic"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <div class="player-bar">
      <div class="current-music">
        <div class="cover">
          {{ currentMusic ? '🎵' : '📀' }}
        </div>
        <div class="info">
          <div class="title">{{ currentMusic?.name || currentMusic?.songname || '未选择音乐' }}</div>
          <div class="artist">
            {{ currentMusic?.singer?.map(s => s.name).join(' / ') || currentMusic?.artist || '' }}
          </div>
        </div>
      </div>

      <div class="controls">
        <div class="progress">
          <span>{{ formatTime(currentTime) }}</span>
          <el-slider
            v-model="currentTime"
            :max="duration"
            @change="seekMusic"
            :show-tooltip="false"
          />
          <span>{{ formatTime(duration) }}</span>
        </div>

        <div class="control-buttons">
          <el-button circle @click="prevMusic">
            <el-icon><DArrowLeft /></el-icon>
          </el-button>
          <el-button type="primary" circle size="large" @click="togglePlay">
            <el-icon>
              <VideoPlay v-if="!isPlaying" />
              <VideoPause v-else />
            </el-icon>
          </el-button>
          <el-button circle @click="nextMusic">
            <el-icon><DArrowRight /></el-icon>
          </el-button>
        </div>

        <div class="extra-controls">
          <el-button circle @click="toggleMute">
            <el-icon>
              <Mute v-if="isMuted" />
              <Microphone v-else />
            </el-icon>
          </el-button>
          <el-select v-model="playMode" @change="changeMode" size="small">
            <el-option value="sequence" label="顺序" />
            <el-option value="loop" label="单曲" />
            <el-option value="random" label="随机" />
          </el-select>
        </div>
      </div>
    </div>

    <audio
      ref="audioRef"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @loadedmetadata="onLoaded"
      @error="onError"
    ></audio>

    <el-dialog v-model="showSourceManage" title="音源管理" width="600px">
      <div class="source-manage">
        <el-form :model="newSource" label-width="80px">
          <el-form-item label="名称">
            <el-input v-model="newSource.name" placeholder="输入音源名称" />
          </el-form-item>
          <el-form-item label="地址">
            <el-input v-model="newSource.url" placeholder="输入音源脚本地址" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="addNewSource">添加</el-button>
          </el-form-item>
        </el-form>

        <el-divider />

        <div class="source-list">
          <div v-for="source in sources" :key="source.id" class="source-item">
            <div class="info">
              <span class="name">{{ source.name }}</span>
              <el-tag :type="getSourceStatusType(source.status)" size="small">
                {{ getSourceStatusText(source.status) }}
              </el-tag>
            </div>
            <div class="actions">
              <el-switch v-model="source.enabled" @change="toggleSource(source.id)" />
              <el-button type="danger" size="small" link @click="deleteSource(source.id)">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { convertFileSrc } from '@tauri-apps/api/core'
import { ElMessage } from 'element-plus'
import { DArrowLeft, DArrowRight, VideoPlay, VideoPause, Mute, Microphone } from '@element-plus/icons-vue'
import { useMusicSourceStore } from '@/stores/modules/musicSource'
import musicSdk from '@/utils/musicSdk'
import SearchTab from './modules/SearchTab.vue'
import SongListTab from './modules/SongListTab.vue'
import LeaderboardTab from './modules/LeaderboardTab.vue'
import LocalMusicTab from './modules/LocalMusicTab.vue'

defineOptions({ name: 'MusicPlayer' })

const sourceStore = useMusicSourceStore()

const activeTab = ref('search')
const currentSourceId = ref(sourceStore.currentSourceId)
const sources = computed(() => sourceStore.sources)

const localMusicList = ref([])
const currentIndex = ref(-1)
const currentMusic = ref(null)
const isPlaying = ref(false)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const playMode = ref('sequence')
const isLocalMusic = ref(false)

const showSourceManage = ref(false)
const newSource = ref({ name: '', url: '' })

const audioRef = ref(null)
const playList = ref([])

const getSourceStatusType = (status) => {
  const map = {
    idle: 'info',
    loading: 'warning',
    ready: 'success',
    error: 'danger',
  }
  return map[status] || 'info'
}

const getSourceStatusText = (status) => {
  const map = {
    idle: '未加载',
    loading: '加载中',
    ready: '就绪',
    error: '错误',
  }
  return map[status] || '未知'
}

const handleSourceChange = async (sourceId) => {
  try {
    await sourceStore.setCurrentSource(sourceId)
    ElMessage.success('音源切换成功')
  } catch (error) {
    ElMessage.error('音源切换失败: ' + error.message)
  }
}

const handleLoadSongs = (songs) => {
  playList.value = songs
  activeTab.value = 'search'
}

const playOnlineMusic = async (music) => {
  try {
    ElMessage.info('正在获取播放链接...')
    const url = await musicSdk.getMusicUrl(music)
    
    if (!url) {
      ElMessage.error('无法获取播放链接')
      return
    }

    currentMusic.value = music
    isLocalMusic.value = false
    
    if (!audioRef.value) return
    
    audioRef.value.src = url
    audioRef.value.play()
    isPlaying.value = true
  } catch (error) {
    ElMessage.error('播放失败: ' + error.message)
  }
}

const addToPlayList = (music) => {
  if (!playList.value.find(m => m.songmid === music.songmid)) {
    playList.value.push(music)
    ElMessage.success('已添加到播放列表')
  }
}

const playLocalMusic = (index) => {
  if (!audioRef.value) return

  currentIndex.value = index
  currentMusic.value = localMusicList.value[index]
  isLocalMusic.value = true

  const src = convertFileSrc(currentMusic.value.path)
  audioRef.value.src = src
  audioRef.value.play()
  isPlaying.value = true
}

const togglePlay = () => {
  if (!audioRef.value) return

  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
  isPlaying.value = !isPlaying.value
}

const prevMusic = () => {
  const list = isLocalMusic.value ? localMusicList.value : playList.value
  if (list.length === 0) return

  if (playMode.value === 'random') {
    const randomIndex = Math.floor(Math.random() * list.length)
    playByIndex(randomIndex)
  } else {
    const newIndex = currentIndex.value <= 0 ? list.length - 1 : currentIndex.value - 1
    playByIndex(newIndex)
  }
}

const nextMusic = () => {
  const list = isLocalMusic.value ? localMusicList.value : playList.value
  if (list.length === 0) return

  if (playMode.value === 'random') {
    const randomIndex = Math.floor(Math.random() * list.length)
    playByIndex(randomIndex)
  } else {
    const newIndex = currentIndex.value >= list.length - 1 ? 0 : currentIndex.value + 1
    playByIndex(newIndex)
  }
}

const playByIndex = (index) => {
  if (isLocalMusic.value) {
    playLocalMusic(index)
  } else {
    const music = playList.value[index]
    currentIndex.value = index
    playOnlineMusic(music)
  }
}

const seekMusic = (value) => {
  if (!audioRef.value) return
  audioRef.value.currentTime = value
  currentTime.value = value
}

const toggleMute = () => {
  if (!audioRef.value) return

  isMuted.value = !isMuted.value
  audioRef.value.muted = isMuted.value
}

const changeMode = () => {
  ElMessage.info(`播放模式已切换为: ${playMode.value === 'sequence' ? '顺序' : playMode.value === 'loop' ? '单曲循环' : '随机'}`)
}

const onEnded = () => {
  if (playMode.value === 'loop') {
    audioRef.value?.play()
  } else {
    nextMusic()
  }
}

const onTimeUpdate = () => {
  if (audioRef.value) {
    currentTime.value = Math.floor(audioRef.value.currentTime)
  }
}

const onLoaded = () => {
  if (audioRef.value) {
    duration.value = Math.floor(audioRef.value.duration)
  }
}

const onError = () => {
  ElMessage.error('播放出错，请尝试其他音源或歌曲')
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const addNewSource = () => {
  if (!newSource.value.name || !newSource.value.url) {
    ElMessage.warning('请填写完整的音源信息')
    return
  }

  sourceStore.addSource(newSource.value)
  newSource.value = { name: '', url: '' }
  ElMessage.success('音源添加成功')
}

const deleteSource = (sourceId) => {
  sourceStore.removeSource(sourceId)
  ElMessage.success('音源已删除')
}

const toggleSource = (sourceId) => {
  sourceStore.toggleSourceEnabled(sourceId)
}

onUnmounted(() => {
  if (audioRef.value) {
    audioRef.value.pause()
  }
})
</script>

<style lang="less" scoped>
.music-player {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.header {
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid #eee;

  .source-selector {
    display: flex;
    gap: 10px;
    align-items: center;
  }
}

.content {
  flex: 1;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.95);
  margin: 20px;
  border-radius: 12px;
}

.main-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
  }

  :deep(.el-tab-pane) {
    height: 100%;
    overflow: hidden;
  }
}

.player-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 15px 25px;
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid #eee;

  .current-music {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 250px;

    .cover {
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }

    .info {
      flex: 1;
      overflow: hidden;

      .title {
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .artist {
        font-size: 12px;
        color: #888;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .controls {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .progress {
      display: flex;
      align-items: center;
      gap: 15px;

      span {
        font-size: 12px;
        color: #666;
        min-width: 40px;
      }
    }

    .control-buttons {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
    }

    .extra-controls {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
    }
  }
}

.source-manage {
  .source-list {
    .source-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #eee;

      &:last-child {
        border-bottom: none;
      }

      .info {
        display: flex;
        align-items: center;
        gap: 10px;

        .name {
          font-weight: 500;
        }
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 15px;
      }
    }
  }
}
</style>
