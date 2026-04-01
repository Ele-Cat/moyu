<template>
  <div class="game-page">
    <el-scrollbar v-if="!currentGame">
      <div class="game-list">
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
    </el-scrollbar>

    <template v-else>
      <el-page-header class="game-header" :icon="ArrowLeft" @back="goBack">
        <template #content>
          <span class="text-large font-600 mr-3"> {{ currentGame.name }} </span>
        </template>
        <template #extra v-if="currentGame.help">
          <el-button type="primary" size="small" :icon="QuestionFilled" circle @click="showHelp = true" />
        </template>
      </el-page-header>
      <el-scrollbar class="game-content">
        <component :is="currentGame.component" />
      </el-scrollbar>
    </template>

    <el-dialog v-model="showHelp" v-if="currentGame" :title="`${currentGame.name}`" width="500px">
      <div class="help-content" v-if="currentGame">
        <div v-html="currentGame.help"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowLeft, QuestionFilled } from '@element-plus/icons-vue'
import MazeGame from './modules/MazeGame.vue'
import BreakoutGame from './modules/BreakoutGame.vue'
import Game2048 from './modules/Game2048.vue'
import SnakeGame from './modules/SnakeGame.vue'
import TetrisGame from './modules/TetrisGame.vue'
import MemoryGame from './modules/MemoryGame.vue'

defineOptions({ name: 'Game' })

const currentGame = ref(null)
const showHelp = ref(false)

const games = [
  {
    id: 'maze',
    name: '迷宫小游戏',
    icon: '🎮',
    desc: '挑战迷宫，寻找出口',
    help: `<p>- 使用 <b>方向键</b> 或 <b>WASD</b> 控制角色移动。</p><p>- 玩家控制 <span style="color: #2e7d32;">绿色方块</span>，终点是 <span style="color: #dc143c;">红色方块</span></p>`,
    component: MazeGame
  },
  {
    id: 'breakout',
    name: '打砖块',
    icon: '🧱',
    desc: '经典弹球，回忆童年',
    help: '← → 或 A D 控制挡板',
    component: BreakoutGame
  },
  {
    id: '2048',
    name: '2048',
    icon: '🔢',
    desc: '数字合并，极其耐玩',
    help: '↑ ↓ ← → 或 WASD 控制移动',
    component: Game2048
  },
  {
    id: 'snake',
    name: '贪吃蛇',
    icon: '🐍',
    desc: '经典贪吃蛇',
    help: '↑ ↓ ← → 控制方向',
    component: SnakeGame
  },
  {
    id: 'tetris',
    name: '俄罗斯方块',
    icon: '🧱',
    desc: '方块消除，益智游戏',
    help: '← → 控制移动 | ↑ 旋转 | ↓ 加速',
    component: TetrisGame
  },
  {
    id: 'memory',
    name: '记忆游戏',
    icon: '🧠',
    desc: '记住高亮方块位置',
    help: '游戏开始后，方块会随机高亮显示，记住这些位置后高亮会消失。点击正确的方块进入下一关。共有 3 次错误机会，错误 3 次游戏结束。方块数量和难度会逐渐增加。',
    component: MemoryGame
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
    height: calc(100vh - 90px);
    padding-right: 20px;
  }

  .help-content {
    color: var(--text-color);
    line-height: 2;
    font-size: 14px;
  }
}
</style>
