import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Home/Index.vue'),
      meta: { title: '首页' }
    },
    {
      path: '/novel',
      name: 'novel',
      component: () => import('../views/NovelReader/Index.vue'),
      meta: { title: '小说阅读' }
    },
    {
      path: '/music',
      name: 'music',
      component: () => import('../views/MusicPlayer/Index.vue'),
      meta: { title: '音乐播放' }
    },
    {
      path: '/news',
      name: 'news',
      component: () => import('../views/NewsList/Index.vue'),
      meta: { title: '热点新闻' }
    },
    {
      path: '/wallpaper',
      name: 'wallpaper',
      component: () => import('../views/Wallpaper/Index.vue'),
      meta: { title: '桌面壁纸' }
    },
    {
      path: '/video-wallpaper',
      name: 'video-wallpaper',
      component: () => import('../views/VideoWallpaper/Index.vue'),
      meta: { title: '视频壁纸' }
    },
    {
      path: '/game',
      name: 'game',
      component: () => import('../views/Game/Index.vue'),
      meta: { title: '游戏' },
      children: [
        {
          path: 'maze',
          name: 'maze-game',
          component: () => import('../views/Game/modules/MazeGame.vue'),
          meta: { title: '迷宫小游戏' }
        },
        {
          path: 'breakout',
          name: 'breakout-game',
          component: () => import('../views/Game/modules/BreakoutGame.vue'),
          meta: { title: '打砖块' }
        },
        {
          path: '2048',
          name: 'game-2048',
          component: () => import('../views/Game/modules/Game2048.vue'),
          meta: { title: '2048' }
        },
        {
          path: 'snake',
          name: 'snake-game',
          component: () => import('../views/Game/modules/SnakeGame.vue'),
          meta: { title: '贪吃蛇' }
        },
        {
          path: 'tetris',
          name: 'tetris-game',
          component: () => import('../views/Game/modules/TetrisGame.vue'),
          meta: { title: '俄罗斯方块' }
        },
        {
          path: 'typing',
          name: 'typing-game',
          component: () => import('../views/Game/modules/TypingGame.vue'),
          meta: { title: '打字练习' }
        }
      ]
    },
    {
      path: '/tools',
      name: 'tools',
      component: () => import('../views/Tools/Index.vue'),
      meta: { title: '实用工具' }
    }
  ]
})

export default router
