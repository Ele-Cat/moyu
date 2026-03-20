<template>
  <div class="video-wallpaper">
    <video
      ref="videoRef"
      class="video-player"
      autoplay
      loop
      muted
      :src="videoSrc"
    ></video>
  </div>
</template>

<script setup>
defineOptions({ name: 'VideoWallpaper' })
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const videoRef = ref(null)

const videoSrc = computed(() => {
  const path = route.query.path
  if (path) {
    const decodedPath = decodeURIComponent(path)
    if (decodedPath.startsWith('http')) {
      return decodedPath
    }
    return `file://${decodedPath.replace(/\\/g, '/')}`
  }
  return 'https://oss.ytab.top/yy_video_wallpaper/02ed430b-b136-43e9-8539-0a2233749e9b.mp4'
})

onMounted(() => {
  if (videoRef.value) {
    videoRef.value.play()
  }
})
</script>

<style scoped>
.video-wallpaper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
