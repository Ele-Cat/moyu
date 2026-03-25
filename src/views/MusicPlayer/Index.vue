<template>
  <div class="music-player">
    <div class="content">
      <div class="music-list">
        <div class="list-header">
          <button @click="selectFolder">📂 选择音乐文件夹</button>
        </div>

        <div v-if="musicList.length > 0" class="list">
          <div
            v-for="(music, index) in musicList"
            :key="music.path"
            class="music-item"
            :class="{ active: currentIndex === index }"
            @click="playMusic(index)"
          >
            <span class="music-icon">{{ currentIndex === index ? '🔊' : '🎵' }}</span>
            <span class="music-name">{{ music.name }}</span>
          </div>
        </div>

        <div v-else class="empty">
          请选择音乐文件夹
        </div>
      </div>

      <div class="player-panel">
        <div class="current-music">
          <div class="cover">
            {{ currentMusic ? '🎵' : '📀' }}
          </div>
          <div class="info">
            <div class="title">{{ currentMusic?.name || '未选择音乐' }}</div>
          </div>
        </div>

        <div class="controls">
          <button @click="prevMusic">⏮️</button>
          <button class="play-btn" @click="togglePlay">
            {{ isPlaying ? '⏸️' : '▶️' }}
          </button>
          <button @click="nextMusic">⏭️</button>
        </div>

        <div class="progress">
          <span>{{ formatTime(currentTime) }}</span>
          <input
            type="range"
            min="0"
            :max="duration"
            :value="currentTime"
            @input="seekMusic"
          />
          <span>{{ formatTime(duration) }}</span>
        </div>

        <div class="extra-controls">
          <button @click="toggleMute">
            {{ isMuted ? '🔇' : '🔊' }}
          </button>
          <select v-model="playMode" @change="changeMode">
            <option value="sequence">顺序播放</option>
            <option value="loop">单曲循环</option>
            <option value="random">随机播放</option>
          </select>
        </div>
      </div>
    </div>

    <audio
      ref="audioRef"
      @timeupdate="onTimeUpdate"
      @ended="onEnded"
      @loadedmetadata="onLoaded"
    ></audio>
  </div>
</template>

<script setup>
defineOptions({ name: 'MusicPlayer' })
import { ref, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { convertFileSrc } from '@tauri-apps/api/core'

const musicList = ref([])
const currentIndex = ref(-1)
const currentMusic = ref(null)
const isPlaying = ref(false)
const isMuted = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const playMode = ref('sequence')

const audioRef = ref<HTMLAudioElement | null>(null)

async function selectFolder() {
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
      musicList.value = files

      if (musicList.value.length > 0) {
        playMusic(0)
      }
    }
  } catch (e) {
    console.error('选择文件夹失败:', e)
    alert('选择文件夹失败: ' + e)
  }
}

function playMusic(index) {
  if (!audioRef.value) return

  currentIndex.value = index
  currentMusic.value = musicList.value[index]

  const src = convertFileSrc(currentMusic.value.path)
  audioRef.value.src = src
  audioRef.value.play()
  isPlaying.value = true
}

function togglePlay() {
  if (!audioRef.value) return

  if (isPlaying.value) {
    audioRef.value.pause()
  } else {
    audioRef.value.play()
  }
  isPlaying.value = !isPlaying.value
}

function prevMusic() {
  if (musicList.value.length === 0) return

  if (playMode.value === 'random') {
    const randomIndex = Math.floor(Math.random() * musicList.value.length)
    playMusic(randomIndex)
  } else {
    const newIndex = currentIndex.value <= 0 ? musicList.value.length - 1 : currentIndex.value - 1
    playMusic(newIndex)
  }
}

function nextMusic() {
  if (musicList.value.length === 0) return

  if (playMode.value === 'random') {
    const randomIndex = Math.floor(Math.random() * musicList.value.length)
    playMusic(randomIndex)
  } else {
    const newIndex = currentIndex.value >= musicList.value.length - 1 ? 0 : currentIndex.value + 1
    playMusic(newIndex)
  }
}

function seekMusic(event) {
  if (!audioRef.value) return

  const value = parseInt((event.target).value)
  audioRef.value.currentTime = value
  currentTime.value = value
}

function toggleMute() {
  if (!audioRef.value) return

  isMuted.value = !isMuted.value
  audioRef.value.muted = isMuted.value
}

function changeMode() {
}

function onEnded() {
  if (playMode.value === 'loop') {
    audioRef.value?.play()
  } else {
    nextMusic()
  }
}

function onTimeUpdate() {
  if (audioRef.value) {
    currentTime.value = Math.floor(audioRef.value.currentTime)
  }
}

function onLoaded() {
  if (audioRef.value) {
    duration.value = Math.floor(audioRef.value.duration)
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
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
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.music-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  margin: 20px;
  border-radius: 12px;
  overflow: hidden;
}

.list-header {
  padding: 15px;
  border-bottom: 1px solid #eee;

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    background: #2a5298;
    color: #fff;
    cursor: pointer;
  }
}

.list {
  flex: 1;
  overflow-y: auto;
}

.music-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f5f5f5;
  }

  &.active {
    background: #e0e0e0;
    color: #2a5298;
  }
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

.empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
}

.player-panel {
  width: 350px;
  background: rgba(255, 255, 255, 0.95);
  margin: 20px 20px 20px 0;
  border-radius: 12px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.current-music {
  text-align: center;
  margin-bottom: 30px;
}

.cover {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  margin: 0 auto 15px;
  animation: rotate 10s linear infinite;
  animation-play-state: paused;
}

.is-playing .cover {
  animation-play-state: running;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.info .title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.controls {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;

  button {
    width: 50px;
    height: 50px;
    border: none;
    border-radius: 50%;
    background: #2a5298;
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.1);
    }
  }

  .play-btn {
    width: 60px !important;
    height: 60px !important;
    font-size: 24px !important;
  }
}

.progress {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-bottom: 20px;

  span {
    font-size: 12px;
    color: #666;
    min-width: 40px;
  }

  input[type="range"] {
    flex: 1;
  }
}

.extra-controls {
  display: flex;
  align-items: center;
  gap: 15px;

  button {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: #f0f0f0;
    font-size: 18px;
    cursor: pointer;
  }

  select {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 6px;
  }
}
</style>
