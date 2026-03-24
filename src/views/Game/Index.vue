<template>
  <div class="game-page">
    <div class="game-list" v-if="!hasChildRoute">
      <div class="page-title">游戏中心</div>
      <div class="game-grid">
        <div 
          v-for="game in games" 
          :key="game.id"
          class="game-card"
          @click="enterGame(game)"
        >
          <div class="game-icon">{{ game.icon }}</div>
          <div class="game-name">{{ game.name }}</div>
          <div class="game-desc">{{ game.desc }}</div>
        </div>
      </div>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

defineOptions({ name: 'Game' })

const router = useRouter()
const route = useRoute()

const games = [
  {
    id: 'maze',
    name: '迷宫小游戏',
    icon: '🎮',
    desc: '挑战迷宫，寻找出口',
    route: '/game/maze'
  }
]

const hasChildRoute = computed(() => {
  return route.path !== '/game'
})

function enterGame(game) {
  router.push(game.route)
}
</script>

<style scoped>
.game-page {
  height: 100%;
  background: var(--bg-color);
  overflow: auto;
}

.game-list {
  padding: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: var(--text-color);
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.game-card {
  background: var(--bg-color-secondary);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.game-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 12px;
}

.game-name {
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 8px;
  color: var(--text-color);
}

.game-desc {
  font-size: 12px;
  text-align: center;
  color: var(--text-color-muted);
}
</style>
