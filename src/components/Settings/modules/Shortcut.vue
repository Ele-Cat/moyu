<template>
  <el-form class="settings-section">
    <el-form-item label="老板键:">
      <div class="shortcut-display">
        <kbd>Ctrl</kbd> + <kbd>~</kbd>
      </div>
      <p class="setting-tip">按下可隐藏/显示窗口</p>
    </el-form-item>
  </el-form>
</template>

<script setup>
</script>

<style lang="less" scoped>
.shortcut-display {
  display: flex;
  align-items: center;
  gap: 8px;

  kbd {
    background: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 0 8px;
    font-family: var(--font-family);
  }
}

.setting-tip {
  font-size: 12px;
  color: var(--text-color-muted);
  margin-left: 8px;
}
</style>
