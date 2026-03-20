import { defineStore } from "pinia";

export const useWallpaperStore = defineStore("wallpaper", {
  state: () => {
    return {
      history: [],
      favorites: [],
      currentVideoPath: null,
      videoActive: false,
    };
  },
  getters: {
    getHistory: (state) => state.history,
    getFavorites: (state) => state.favorites,
    isVideoActive: (state) => state.videoActive,
    getCurrentVideoPath: (state) => state.currentVideoPath,
  },
  actions: {
    addToHistory(item) {
      const exists = this.history.find(h => h.path === item.path);
      if (!exists) {
        this.history.unshift({
          ...item,
          timestamp: Date.now()
        });
        if (this.history.length > 50) {
          this.history.pop();
        }
      }
    },
    
    removeFromHistory(path) {
      this.history = this.history.filter(h => h.path !== path);
    },
    
    clearHistory() {
      this.history = [];
    },
    
    addToFavorites(item) {
      const exists = this.favorites.find(f => f.path === item.path);
      if (!exists) {
        this.favorites.unshift({
          ...item,
          timestamp: Date.now()
        });
      }
    },
    
    removeFromFavorites(path) {
      this.favorites = this.favorites.filter(f => f.path !== path);
    },
    
    isFavorite(path) {
      return this.favorites.some(f => f.path === path);
    },
    
    setVideoActive(active) {
      console.log('active: ', active);
      this.videoActive = active;
    },
    
    setCurrentVideoPath(path) {
      this.currentVideoPath = path;
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        paths: ['history', 'favorites', 'currentVideoPath', 'videoActive'],
      },
    ],
  },
});
