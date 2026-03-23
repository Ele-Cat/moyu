<template>
  <div class="category-tabs">
    <div 
      v-for="cat in categories" 
      :key="cat.id"
      :class="['cat-item', { active: modelValue === cat.id }]"
      @click="handleClick(cat)"
    >
      {{ cat.category }}
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

function handleClick(cat) {
  emit('update:modelValue', cat.id)
  emit('change', cat)
}
</script>

<style scoped>
.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 15px;
}

.cat-item {
  padding: 5px 12px;
  border-radius: 15px;
  cursor: pointer;
  background: var(--bg-color-secondary);
  font-size: 12px;
  transition: all 0.2s;
}

.cat-item:hover {
  background: var(--hover-bg);
}

.cat-item.active {
  background: var(--primary-color);
  color: #fff;
}
</style>
