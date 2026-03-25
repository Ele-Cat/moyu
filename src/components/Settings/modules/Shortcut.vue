<template>
  <div class="settings-section">
    <div class="setting-item">
      <label>老板键</label>
      <div class="shortcut-display">
        <kbd>Ctrl</kbd> + <kbd>~</kbd>
      </div>
      <p class="setting-tip">按下可隐藏/显示窗口</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style lang="less" scoped>
.setting-item {
  margin-bottom: 24px;

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--text-color);
  }
}

.setting-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-color-muted);
}

.shortcut-display {
  display: flex;
  align-items: center;
  gap: 8px;

  kbd {
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 4px 12px;
    font-family: var(--font-family);
    font-size: 14px;
  }
}
</style>
