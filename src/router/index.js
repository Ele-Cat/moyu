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
      component: () => import('../views/Home/Index.vue')
    },
    {
      path: '/novel',
      name: 'novel',
      component: () => import('../views/NovelReader/Index.vue')
    },
    {
      path: '/music',
      name: 'music',
      component: () => import('../views/MusicPlayer/Index.vue')
    },
    {
      path: '/news',
      name: 'news',
      component: () => import('../views/NewsList/Index.vue')
    },
    {
      path: '/wallpaper',
      name: 'wallpaper',
      component: () => import('../views/Wallpaper/Index.vue')
    },
    {
      path: '/video-wallpaper',
      name: 'video-wallpaper',
      component: () => import('../views/VideoWallpaper/Index.vue')
    },
    {
      path: '/game',
      name: 'game',
      component: () => import('../views/Game/Index.vue')
    },
    {
      path: '/tools',
      name: 'tools',
      component: () => import('../views/Tools/Index.vue')
    }
  ]
})

export default router
