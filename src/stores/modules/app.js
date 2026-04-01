import { defineStore } from "pinia";

const themes = [
  {
    id: 'purple',
    name: '浪漫紫',
    primaryColor: '#667eea',
    primaryColorEnd: '#764ba2',
  },
  {
    id: 'blue',
    name: '海洋蓝',
    primaryColor: '#00b8f9',
    primaryColorEnd: '#0166eb',
  },
  {
    id: 'green',
    name: '清新绿',
    primaryColor: '#39b54a',
    primaryColorEnd: '#8dc63f',
  },
  {
    id: 'pink',
    name: '甜蜜粉',
    primaryColor: '#ec008c',
    primaryColorEnd: '#6739b6',
  },
  {
    id: 'cyan',
    name: '潮流青',
    primaryColor: '#06edfe',
    primaryColorEnd: '#48b2fe',
  },
  {
    id: 'purple2',
    name: '梦幻紫',
    primaryColor: '#9000ff',
    primaryColorEnd: '#5e00ff',
  },
  {
    id: 'orange',
    name: '活力橙',
    primaryColor: '#ff9700',
    primaryColorEnd: '#ed1c24',
  },
  {
    id: 'red',
    name: '热情红',
    primaryColor: '#f43f3b',
    primaryColorEnd: '#ec008c',
  },
];

export const useAppStore = defineStore("app", {
  state: () => {
    return {
      sidebarCollapsed: false,
      isDark: false,
      bossKeyEnabled: true,
      showSettings: false,
      currentThemeId: 'purple',
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
      this.applyDarkMode(this.isDark);
    },
    
    setDark(value) {
      this.isDark = value;
      this.applyDarkMode(value);
      const theme = this.currentTheme;
      this.applyElementPlusTheme(theme.primaryColor);
    },

    applyDarkMode(isDark) {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    },

    setStoragePath(path) {
      this.storagePath = path;
    },

    setTheme(themeId) {
      const theme = this.themes.find(t => t.id === themeId);
      if (theme) {
        this.currentThemeId = themeId;
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
      this.applyDarkMode(this.isDark);
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