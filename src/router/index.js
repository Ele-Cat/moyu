import { createRouter, createWebHistory } from 'vue-router'
import BlankLayout from '@/layouts/BlankLayout/Index.vue'
import DefaultLayout from '@/layouts/DefaultLayout/Index.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
      component: DefaultLayout,
      children: [
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
          path: '/game',
          name: 'game',
          component: () => import('../views/Game/Index.vue'),
          meta: { title: '游戏' },
        },
        {
          path: '/tools',
          name: 'tools',
          component: () => import('../views/Tools/Index.vue'),
          meta: { title: '实用工具' }
        },
      ]
    },
    {
      path: '/sub',
      name: 'sub',
      component: BlankLayout,
      children: [
        {
          path: 'video-wallpaper',
          name: 'video-wallpaper',
          component: () => import('../views/Sub/VideoWallpaper.vue'),
          meta: { title: '视频壁纸' }
        },
        {
          path: 'reminder',
          name: 'reminder',
          component: () => import('../views/Sub/Reminder.vue'),
          meta: { title: '提醒' }
        },
      ]
    }
  ]
})

export default router
