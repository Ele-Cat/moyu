<template>
  <div class="tools-page">
    <el-scrollbar v-if="!currentTool">
      <div class="tool-list">
        <div 
          v-for="tool in tools" 
          :key="tool.id"
          class="tool-card"
          @click="enterTool(tool)"
        >
          <div class="tool-icon">{{ tool.icon }}</div>
          <div class="tool-name">{{ tool.name }}</div>
          <div class="tool-desc">{{ tool.desc }}</div>
        </div>
      </div>
    </el-scrollbar>

    <template v-else>
      <el-page-header class="tool-header" :icon="ArrowLeft" @back="goBack">
        <template #content>
          <span class="text-large font-600 mr-3"> {{ currentTool.name }} </span>
        </template>
        <template #extra v-if="currentTool.help">
          <el-button type="primary" size="small" :icon="QuestionFilled" circle @click="showHelp = true" />
        </template>
      </el-page-header>
      <el-scrollbar class="tool-content">
        <component :is="currentTool.component" />
      </el-scrollbar>
    </template>

    <el-dialog v-model="showHelp" v-if="currentTool" :title="`${currentTool.name}`" width="500px">
      <div class="help-content" v-if="currentTool">
        <div v-html="currentTool.help"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowLeft, QuestionFilled } from '@element-plus/icons-vue'
import CountdownTool from './modules/CountdownTool.vue'
import ClipboardTool from './modules/ClipboardTool.vue'

defineOptions({ name: 'Tools' })

const currentTool = ref(null)
const showHelp = ref(false)

const tools = [
  {
    id: 'countdown',
    name: '摸鱼倒计时',
    icon: '⏰',
    desc: '设置目标时间，计算剩余时间',
    help: `<p>倒计时模式：设置目标时间，实时显示距离目标还有多少时间。</p><p>番茄钟模式：工作25分钟，休息5分钟，帮助提高专注力。</p><p>点击"最小化到托盘"可以将窗口隐藏到系统托盘。</p>`,
    component: CountdownTool
  },
  {
    id: 'clipboard',
    name: '剪贴板工具',
    icon: '📋',
    desc: '自动记录剪贴板历史',
    help: `<p>自动记录剪贴板历史，方便查找之前复制的内容。</p><p>点击任意记录可快速复制到剪贴板。</p><p>按 <b>Ctrl+Alt+V</b> 快速打开剪贴板（需要后台运行）。</p><p>历史记录保存在本地浏览器存储中。</p>`,
    component: ClipboardTool
  }
]

function enterTool(tool) {
  currentTool.value = tool
}

function goBack() {
  currentTool.value = null
}
</script>

<style lang="less" scoped>
.tools-page {
  height: 100%;
  background: var(--bg-color);
  overflow: auto;

  .tool-list {
    padding: 20px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 16px;
  }

  .tool-card {
    background: var(--bg-color-secondary);
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid var(--border-color);

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      border-color: var(--primary-color);
    }

    .tool-icon {
      font-size: 48px;
      text-align: center;
      margin-bottom: 12px;
    }

    .tool-name {
      font-size: 16px;
      font-weight: bold;
      color: var(--text-color);
      text-align: center;
      margin-bottom: 8px;
    }

    .tool-desc {
      font-size: 12px;
      color: var(--text-color-secondary);
      text-align: center;
    }
  }

  .tool-header {
    background: var(--bg-color-secondary);
    padding: 12px 20px;
  }

  .tool-content {
    height: calc(100% - 60px);
  }

  .help-content {
    line-height: 1.8;
    color: var(--text-color);

    p {
      margin-bottom: 12px;
    }

    b {
      color: var(--primary-color);
    }
  }
}
</style>
