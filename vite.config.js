import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(async () => ({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
        },
      },
    },
  },
}));
