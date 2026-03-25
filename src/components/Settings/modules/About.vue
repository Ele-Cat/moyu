<template>
  <div class="settings-section">
    <div class="about-info">
      <div class="app-icon">
        <img src="/icon.ico" alt="icon" />
      </div>
      <h4>摸鱼日常</h4>
      <p>版本 0.1.0</p>
      <p class="desc">一款实用的桌面摸鱼小工具</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style lang="less" scoped>
.about-info {
  text-align: center;
  padding: 20px;
}

.app-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;

  img {
    width: 100%;
    height: 100%;
  }
}

h4 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--text-color);
}

p {
  margin: 4px 0;
  color: var(--text-color-secondary);
}

.desc {
  margin-top: 16px;
  font-size: 14px;
  color: var(--text-color-muted);
}
</style>
