import { defineStore } from "pinia";

export const useWallpaperStore = defineStore("wallpaper", {
  state: () => {
    return {
      history: [],
      favorites: [],
      videoActive: false,
      videoPath: null,
      staticCategories: [],
    };
  },
  getters: {
    getHistory: (state) => state.history,
    getFavorites: (state) => state.favorites,
    isVideoActive: (state) => state.videoActive,
    getVideoPath: (state) => state.videoPath,
    getStaticCategories: (state) => state.staticCategories,
  },
  actions: {
    addToHistory(item) {
      if (!item.cover) {
        return
      }
      this.history = this.history.filter(h => h.url !== item.url)
      this.history.unshift({ ...item })
    },
    
    removeFromHistory(url) {
      this.history = this.history.filter(h => h.url !== url);
    },
    
    clearHistory() {
      this.history = [];
    },
    
    addToFavorites(item) {
      this.favorites = this.favorites.filter(h => h.url !== item.url)
      this.favorites.unshift({ ...item })
    },
    
    removeFromFavorites(url) {
      this.favorites = this.favorites.filter(f => f.url !== url);
    },
    
    isFavorited(item) {
      return this.favorites.some(f => f.url === item.url);
    },
    
    clearFavorite() {
      this.favorites = [];
    },
    
    setVideoActive(active) {
      this.videoActive = active;
    },
    
    setVideoPath(url) {
      this.videoPath = url;
    },
    
    setStaticCategories(categories) {
      this.staticCategories = categories;
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        paths: ['history', 'favorites', 'videoPath', 'videoActive', 'staticCategories'],
      },
    ],
  },
});
