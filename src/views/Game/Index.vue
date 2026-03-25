<template>
  <div class="game-page">
    <div class="game-list" v-if="!hasChildRoute">
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

    <template v-else>
      <el-page-header class="page-header" :icon="ArrowLeft" @back="goBack">
        <template #content>
          <span> {{ game.name }} </span>
        </template>
      </el-page-header>
      <router-view />
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'

defineOptions({ name: 'Game' })

const router = useRouter()
const route = useRoute()
const game = computed(() => {
  return games.find(g => g.route === route.path)
})

const games = [
  {
    id: 'maze',
    name: '迷宫小游戏',
    icon: '🎮',
    desc: '挑战迷宫，寻找出口',
    route: '/game/maze'
  },
  {
    id: 'breakout',
    name: '打砖块',
    icon: '🧱',
    desc: '经典弹球，回忆童年',
    route: '/game/breakout'
  },
  {
    id: '2048',
    name: '2048',
    icon: '🔢',
    desc: '数字合并，极其耐玩',
    route: '/game/2048'
  },
  {
    id: 'snake',
    name: '贪吃蛇',
    icon: '🐍',
    desc: '经典贪吃蛇',
    route: '/game/snake'
  },
  {
    id: 'tetris',
    name: '俄罗斯方块',
    icon: '🧱',
    desc: '方块消除，益智游戏',
    route: '/game/tetris'
  },
  {
    id: 'typing',
    name: '打字练习',
    icon: '⌨️',
    desc: '摸鱼打字，速度制胜',
    route: '/game/typing'
  }
]

const hasChildRoute = computed(() => {
  return route.path !== '/game'
})

function enterGame(game) {
  router.push(game.route)
}

function goBack() {
  router.back()
}
</script>

<style lang="less" scoped>
.game-page {
  height: 100%;
  background: var(--bg-color);
  overflow: auto;
}

.page-header {
  margin-bottom: 20px;
}

.game-list {
  padding: 20px;
}

.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.game-card {
  background: var(--bg-color-secondary);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--border-color);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    border-color: var(--primary-color);
  }
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
