<template>
  <div class="video-wallpaper">
    <video
      ref="videoRef"
      class="video-player"
      autoplay
      loop
      muted
      src="https://oss.ytab.top/yy_video_wallpaper/02ed430b-b136-43e9-8539-0a2233749e9b.mp4"
    ></video>
    <!-- <img class="video-player" src="https://oss.ytab.top/yy_video_wallpaper/02ed430b-b136-43e9-8539-0a2233749e9b.webp" alt=""> -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'

const route = useRoute()
const videoRef = ref(null)

onMounted(() => {
  const path = route.query.path
  // if (path) {
  //   const decodedPath = decodeURIComponent(path)
  //   const videoPath = decodedPath.replace(/\\/g, '/')
  //   console.log('Loading video from:', videoPath)
  //   if (videoRef.value) {
  //     videoRef.value.src = `file://${videoPath}`
  //     videoRef.value.src = "https://oss.ytab.top/yy_video_wallpaper/02ed430b-b136-43e9-8539-0a2233749e9b.mp4"
  //     videoRef.value.play()
  //     videoRef.value.addEventListener('ended', () => {
  //       videoRef.value.play()
  //     })
  //   }
  // }
})

async function stopVideoWallpaper() {
  try {
    await invoke('stop_video_wallpaper')
  } catch (e) {
    console.error('停止视频壁纸失败:', e)
  }
}
</script>

<style scoped>
.video-wallpaper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  background: transparent;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* pointer-events: none; */
}
</style>
