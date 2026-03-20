import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
  state: () => {
    return {
      sidebarCollapsed: false,
      isDark: false,
      bossKeyEnabled: true,
      showSettings: false,
    };
  },
  getters: {
    isSidebarCollapsed: (state) => state.sidebarCollapsed,
    isDarkMode: (state) => state.isDark,
    isBossKeyEnabled: (state) => state.bossKeyEnabled,
    isSettingsVisible: (state) => state.showSettings,
  },
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    
    toggleTheme() {
      this.isDark = !this.isDark;
    },
    
    setDark(value) {
      this.isDark = value;
    },
    
    toggleSettings() {
      this.showSettings = !this.showSettings;
    },
    
    openSettings() {
      this.showSettings = true;
    },
    
    closeSettings() {
      this.showSettings = false;
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        paths: ['sidebarCollapsed', 'isDark', 'bossKeyEnabled'],
      },
    ],
  },
});
