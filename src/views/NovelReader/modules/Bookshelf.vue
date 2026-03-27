<template>
  <div class="bookshelf">
    <div v-if="bookshelfList.length > 0" class="book-list">
      <div
        v-for="book in bookshelfList"
        :key="book.bookUrl + book.sourceUrl"
        class="book-item"
        @click="$emit('select-book', book)"
      >
        <img
          v-if="book.coverUrl"
          :src="book.coverUrl"
          class="book-cover"
          @error="book.coverUrl = ''"
        />
        <div v-else class="book-cover placeholder">📖</div>
        <div class="book-info">
          <div class="book-name">{{ book.bookName }}</div>
          <div class="book-author">{{ book.author }}</div>
          <div class="book-progress">{{ book.readProgress || '未阅读' }}</div>
        </div>
      </div>
    </div>
    <div v-else class="empty">
      <div class="empty-icon">📚</div>
      <p>书架空空如也</p>
      <p class="tip">去搜索添加书籍吧</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBookSourceStore } from '@/stores/modules/bookSource'

defineEmits(['select-book'])

const bookSourceStore = useBookSourceStore()

const bookshelfList = computed(() => bookSourceStore.bookshelf)
</script>

<style lang="less" scoped>
.bookshelf {
  padding: 15px;
  height: 100%;
  overflow-y: auto;
}

.book-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.book-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.book-cover {
  width: 70px;
  height: 95px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;

  &.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e0e0e0;
    font-size: 30px;
  }
}

.book-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;

  .book-name {
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .book-author {
    font-size: 13px;
    color: #888;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .book-progress {
    font-size: 12px;
    color: #667eea;
    margin-top: 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;

  .empty-icon {
    font-size: 60px;
    margin-bottom: 15px;
  }

  p {
    margin: 5px 0;
  }

  .tip {
    font-size: 13px;
    color: #aaa;
  }
}
</style>
