<template>
  <el-card 
    class="todo-card"
    :class="{ 'history-card': isHistory }"
    shadow="hover"
  >
    <div class="todo-card-content">
      <div class="todo-card-header">
        <span class="todo-title">{{ todo.title }}</span>
        <el-tag v-if="isHistory" type="success">已完成</el-tag>
        <el-tag v-else :type="todo.runMode === 'time' ? 'primary' : 'warning'">
          {{ todo.runMode === 'time' ? '指定时间' : 'CRON' }}
        </el-tag>
      </div>
      <div class="todo-card-desc">{{ todo.description || '暂无详情' }}</div>
      <div class="todo-card-actions">
        <div class="todo-card-time">
          <el-icon><Clock /></el-icon>
          <span v-if="isHistory">完成于 {{ formatDateTime(todo.completedAt) }}</span>
          <span v-else-if="todo.runMode === 'time'">{{ formatDateTime(todo.scheduleTime) }}</span>
          <template v-else>
            <el-tooltip content="点击查看详情" placement="right-start">
              <template #content>
                <p v-for="item in getCronNextTimes(todo.cronExpression, 8)">{{ item }}</p>
                ...
              </template>
              {{ getCronNextTimes(todo.cronExpression, 1)[0] }}
            </el-tooltip>
          </template>
        </div>
        <div class="todo-card-action">
          <template v-if="!isHistory">
            <el-button type="primary" size="small" @click="$emit('edit', todo)">
              编辑
            </el-button>
            <el-popconfirm
              title="确定删除这条待办吗？"
              @confirm="$emit('delete', todo.id)"
            >
              <template #reference>
                <el-button type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
          <template v-else>
            <el-popconfirm
              title="确定删除这条历史记录吗？"
              @confirm="$emit('delete', todo.id, todo.completedAt)"
            >
              <template #reference>
                <el-button type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup>
import { Clock } from '@element-plus/icons-vue'
import { getCronNextTimes, formatDateTime } from '@/utils/util'

defineProps({
  todo: {
    type: Object,
    required: true
  },
  isHistory: {
    type: Boolean,
    default: false
  }
})

defineEmits(['edit', 'delete'])
</script>

<style lang="less" scoped>
.todo-card {
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  .todo-card-content {
    .todo-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .todo-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
        margin-right: 8px;
      }
    }

    .todo-card-desc {
      color: var(--text-color-regular);
      font-size: 14px;
      margin-bottom: 12px;
      line-height: 1.5;
      min-height: 42px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      line-clamp: 2;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .todo-card-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .todo-card-time {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--text-color-secondary);
        font-size: 12px;
      }
    }
  }
}

.history-card {
  opacity: 0.85;
}
</style>
