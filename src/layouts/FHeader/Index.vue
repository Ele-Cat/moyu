<template>
  <header class="titlebar" data-tauri-drag-region>
    <div class="titlebar-left">
      <img src="/icon.ico" alt="icon" class="iconbar" />
      <span class="title">摸鱼日常</span>
    </div>
    <TitleBarButtons />
  </header>
</template>

<script setup>
import TitleBarButtons from './TitleBarButtons.vue'
</script>

<style scoped>
.titlebar {
  height: var(--header-height);
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-end) 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  user-select: none;
  -webkit-app-region: drag;
}

.titlebar-left {
  display: flex;
  align-items: center;
}

.iconbar {
  width: 20px;
  height: 20px;
  margin-right: 5px;
}

.title {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}
</style>
