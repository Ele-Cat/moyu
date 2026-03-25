<template>
  <div class="game-page">
    <div class="game-list" v-if="!currentGame">
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
      <el-page-header class="game-header" :icon="ArrowLeft" @click="goBack">
        <template #content>
          <span class="text-large font-600 mr-3"> {{ currentGame.name }} </span>
        </template>
      </el-page-header>
      <el-scrollbar class="game-content">
        <component :is="currentGame.component" />
      </el-scrollbar>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import MazeGame from './modules/MazeGame.vue'
import BreakoutGame from './modules/BreakoutGame.vue'
import Game2048 from './modules/Game2048.vue'
import SnakeGame from './modules/SnakeGame.vue'
import TetrisGame from './modules/TetrisGame.vue'
import TypingGame from './modules/TypingGame.vue'

defineOptions({ name: 'Game' })

const currentGame = ref(null)

const games = [
  {
    id: 'maze',
    name: '迷宫小游戏',
    icon: '🎮',
    desc: '挑战迷宫，寻找出口',
    component: MazeGame
  },
  {
    id: 'breakout',
    name: '打砖块',
    icon: '🧱',
    desc: '经典弹球，回忆童年',
    component: BreakoutGame
  },
  {
    id: '2048',
    name: '2048',
    icon: '🔢',
    desc: '数字合并，极其耐玩',
    component: Game2048
  },
  {
    id: 'snake',
    name: '贪吃蛇',
    icon: '🐍',
    desc: '经典贪吃蛇',
    component: SnakeGame
  },
  {
    id: 'tetris',
    name: '俄罗斯方块',
    icon: '🧱',
    desc: '方块消除，益智游戏',
    component: TetrisGame
  },
  {
    id: 'typing',
    name: '打字练习',
    icon: '⌨️',
    desc: '摸鱼打字，速度制胜',
    component: TypingGame
  }
]

function enterGame(game) {
  currentGame.value = game
}

function goBack() {
  currentGame.value = null
}
</script>

<style lang="less" scoped>
.game-page {
  height: 100%;
  background: var(--bg-color);
  overflow: auto;

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
  }

  .game-header {
    background: var(--bg-color-secondary);
    padding: 12px 20px;
  }

  .game-content {
    height: calc(100vh - 88px);
    padding-right: 20px;
  }
}
</style>
