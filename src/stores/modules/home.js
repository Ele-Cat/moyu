import { defineStore } from "pinia";

export const useHomeStore = defineStore("home", {
  state: () => {
    return {
      modules: [
        {
          id: 'novel',
          name: '小说阅读',
          icon: '📖',
          desc: '本地txt小说阅读',
          path: '/novel',
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          isFolder: false
        },
        {
          id: 'music',
          name: '音乐播放',
          icon: '🎵',
          desc: '本地音乐播放',
          path: '/music',
          x: 1,
          y: 0,
          width: 1,
          height: 1,
          isFolder: false
        },
        {
          id: 'news',
          name: '热点新闻',
          icon: '📰',
          desc: '实时热点资讯',
          path: '/news',
          x: 0,
          y: 1,
          width: 1,
          height: 1,
          isFolder: false
        },
        {
          id: 'tools',
          name: '实用工具',
          icon: '🛠️',
          desc: '倒计时/剪贴板/翻译',
          path: '/tools',
          x: 1,
          y: 1,
          width: 1,
          height: 1,
          isFolder: false
        },
        {
          id: 'wallpaper',
          name: '桌面壁纸',
          icon: '🖼️',
          desc: '静态/动态壁纸',
          path: '/wallpaper',
          x: 0,
          y: 2,
          width: 1,
          height: 1,
          isFolder: false
        }
      ]
    };
  },
  actions: {
    addModule(module) {
      this.modules.push({
        ...module,
        id: Date.now().toString(),
        x: 0,
        y: this.modules.length,
        width: 1,
        height: 1,
        isFolder: false
      })
    },
    
    updateModule(id, updates) {
      const index = this.modules.findIndex(m => m.id === id)
      if (index !== -1) {
        this.modules[index] = { ...this.modules[index], ...updates }
      }
    },
    
    removeModule(id) {
      this.modules = this.modules.filter(m => m.id !== id)
    },
    
    updatePosition(id, x, y) {
      const module = this.modules.find(m => m.id === id)
      if (module) {
        module.x = x
        module.y = y
      }
    },
    
    updateSize(id, width, height) {
      const module = this.modules.find(m => m.id === id)
      if (module) {
        module.width = width
        module.height = height
      }
    },
    
    setModules(newModules) {
      this.modules = newModules
    }
  },
  persist: {
    key: 'home',
    storage: localStorage
  }
});
