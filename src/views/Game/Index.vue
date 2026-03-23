<template>
  <div class="game-page">
    <MazeGame />
  </div>
</template>

<script setup>
defineOptions({ name: 'Game' })
import MazeGame from './modules/MazeGame.vue'
</script>

<style scoped>
.game-page {
  height: 100%;
  background: var(--bg-color);
}
</style>
