import { defineStore } from "pinia";

const themes = [
  {
    id: 'default',
    name: '默认紫',
    isDark: false,
    primaryColor: '#667eea',
    primaryColorEnd: '#764ba2',
  },
  {
    id: 'blue',
    name: '海洋蓝',
    isDark: false,
    primaryColor: '#1e3c72',
    primaryColorEnd: '#2a5298',
  },
  {
    id: 'green',
    name: '清新绿',
    isDark: false,
    primaryColor: '#11998e',
    primaryColorEnd: '#38ef7d',
  },
  {
    id: 'pink',
    name: '甜蜜粉',
    isDark: false,
    primaryColor: '#ec008c',
    primaryColorEnd: '#fc6767',
  },
  {
    id: 'dark',
    name: '暗夜紫',
    isDark: true,
    primaryColor: '#667eea',
    primaryColorEnd: '#764ba2',
  },
  {
    id: 'darkBlue',
    name: '暗夜蓝',
    isDark: true,
    primaryColor: '#1e3c72',
    primaryColorEnd: '#2a5298',
  },
];

export const useAppStore = defineStore("app", {
  state: () => {
    return {
      sidebarCollapsed: false,
      isDark: false,
      bossKeyEnabled: true,
      showSettings: false,
      currentThemeId: 'default',
      themes,
      storagePath: '',
    };
  },
  getters: {
    isSidebarCollapsed: (state) => state.sidebarCollapsed,
    isDarkMode: (state) => state.isDark,
    isBossKeyEnabled: (state) => state.bossKeyEnabled,
    isSettingsVisible: (state) => state.showSettings,
    currentTheme: (state) => state.themes.find(t => t.id === state.currentThemeId) || state.themes[0],
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
      const theme = this.currentTheme;
      this.applyElementPlusTheme(theme.primaryColor);
    },

    setStoragePath(path) {
      this.storagePath = path;
    },

    setTheme(themeId) {
      const theme = this.themes.find(t => t.id === themeId);
      if (theme) {
        this.currentThemeId = themeId;
        this.isDark = theme.isDark;
        this.applyTheme(theme);
      }
    },

    applyTheme(theme) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', theme.primaryColor);
      root.style.setProperty('--primary-color-end', theme.primaryColorEnd);
      
      this.applyElementPlusTheme(theme.primaryColor);
    },

    applyElementPlusTheme(primaryColor) {
      const root = document.documentElement;
      root.style.setProperty('--el-color-primary', primaryColor);
      root.style.setProperty('--el-color-primary-light-3', this.lightenColor(primaryColor, 20));
      root.style.setProperty('--el-color-primary-light-5', this.lightenColor(primaryColor, 40));
      root.style.setProperty('--el-color-primary-light-7', this.lightenColor(primaryColor, 60));
      root.style.setProperty('--el-color-primary-light-8', this.lightenColor(primaryColor, 70));
      root.style.setProperty('--el-color-primary-light-9', this.lightenColor(primaryColor, 80));
      root.style.setProperty('--el-color-primary-dark-2', this.darkenColor(primaryColor, 10));
    },

    lightenColor(hex, percent) {
      const num = parseInt(hex.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.min(255, (num >> 16) + amt);
      const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
      const B = Math.min(255, (num & 0x0000FF) + amt);
      return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    },

    darkenColor(hex, percent) {
      const num = parseInt(hex.replace('#', ''), 16);
      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, (num >> 16) - amt);
      const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
      const B = Math.max(0, (num & 0x0000FF) - amt);
      return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
    },

    initTheme() {
      const theme = this.currentTheme;
      this.applyTheme(theme);
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
        paths: ['sidebarCollapsed', 'isDark', 'bossKeyEnabled', 'currentThemeId', 'storagePath'],
      },
    ],
  },
});
