<template>
  <el-dialog v-model="visible" title="目录" width="400px">
    <el-scrollbar height="60vh" ref="scrollbarRef">
      <div
        v-for="(chapter, index) in bookStore.chapterList"
        :key="index"
        class="toc-item"
        :class="{ active: index === bookStore.currentChapterIndex }"
        :title="chapter.title"
        @click="goToChapter(index)"
      >
        {{ chapter.title }}
      </div>
    </el-scrollbar>
  </el-dialog>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useBookStore } from '@/stores/modules/book'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
})

const emit = defineEmits(['update:modelValue', 'loadChapter'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const scrollbarRef = ref()
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    nextTick(() => {
      const scrollTop = bookStore.currentChapterIndex * 36
      scrollbarRef.value.setScrollTop(scrollTop)
    })
  }
})

const bookStore = useBookStore()

const goToChapter = (index) => {
  emit('loadChapter', index)
}
</script>

<style lang="less" scoped>
.toc-item {
  padding: 0 12px;
  height: 36px;
  line-height: 36px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: var(--hover-bg);
  }

  &.active {
    color: var(--primary-color);
    font-weight: bold;
  }
}
</style>
