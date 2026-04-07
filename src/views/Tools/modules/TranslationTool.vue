<template>
  <div class="translation-tool">
    <div class="translation-header">
      <el-select v-model="fromLang" placeholder="源语言" filterable @change="handleLangChange">
        <el-option label="自动检测" value="auto" />
        <el-option v-for="lang in languages" :key="lang.code" :label="lang.label" :value="lang.code" />
      </el-select>
      <el-button type="primary" :icon="Sort" circle @click="swapLanguages" class="swap-btn" />
      <el-select v-model="toLang" placeholder="目标语言" filterable @change="handleLangChange">
        <el-option v-for="lang in languages" :key="lang.code" :label="lang.label" :value="lang.code" />
      </el-select>
    </div>
    
    <div class="translation-content">
      <div class="translation-box">
        <el-input
          v-model="sourceText"
          type="textarea"
          :rows="8"
          placeholder="请输入要翻译的内容"
          @input="handleTranslate"
        />
        <div class="char-count">{{ sourceText.length }}/5000</div>
      </div>
      
      <div class="translation-box">
        <el-input
          v-model="targetText"
          type="textarea"
          :rows="8"
          placeholder="翻译结果"
          readonly
        />
        <div v-if="pronounceText" class="pronounce">{{ pronounceText }}</div>
      </div>
    </div>
    
    <div class="translation-actions">
      <el-button type="primary" :loading="translating" @click="handleTranslate">
        翻译
      </el-button>
      <el-button @click="clearAll">清空</el-button>
      <el-button @click="copyResult">复制结果</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Sort } from '@element-plus/icons-vue'
import { get, post } from '@/utils/http'

defineOptions({ name: 'TranslationTool' })

const languages = ref([])
const fromLang = ref('auto')
const toLang = ref('zh-CHS')
const sourceText = ref('')
const targetText = ref('')
const pronounceText = ref('')
const translating = ref(false)
let translateTimer = null

onMounted(async () => {
  await fetchLanguages()
})

async function fetchLanguages() {
  try {
    const data = await get('https://60s.viki.moe/v2/fanyi/langs')
    if (data.code === 200) {
      languages.value = data.data
    }
  } catch (e) {
    console.error('获取语言列表失败:', e)
  }
}

function handleLangChange() {
  if (sourceText.value) {
    handleTranslate()
  }
}

function swapLanguages() {
  if (fromLang.value === 'auto') {
    ElMessage.warning('自动检测无法交换')
    return
  }
  const temp = fromLang.value
  fromLang.value = toLang.value
  toLang.value = temp
  
  const textTemp = sourceText.value
  sourceText.value = targetText.value
  targetText.value = textTemp
}

function handleTranslate() {
  if (translateTimer) {
    clearTimeout(translateTimer)
  }
  
  translateTimer = setTimeout(() => {
    doTranslate()
  }, 500)
}

async function doTranslate() {
  if (!sourceText.value.trim()) {
    targetText.value = ''
    pronounceText.value = ''
    return
  }
  
  translating.value = true
  
  try {
    const data = await get(`https://60s.viki.moe/v2/fanyi?text=${sourceText.value}&from=${fromLang.value}&to=${toLang.value}`)
    
    if (data.code === 200) {
      targetText.value = data.data.target.text
      pronounceText.value = data.data.target.pronounce || ''
    } else {
      ElMessage.error(data.message || '翻译失败')
    }
  } catch (e) {
    console.error('翻译失败:', e)
    ElMessage.error('翻译失败，请稍后重试')
  } finally {
    translating.value = false
  }
}

function clearAll() {
  sourceText.value = ''
  targetText.value = ''
  pronounceText.value = ''
}

function copyResult() {
  if (!targetText.value) {
    ElMessage.warning('没有可复制的内容')
    return
  }
  
  navigator.clipboard.writeText(targetText.value).then(() => {
    ElMessage.success('复制成功')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
</script>

<style lang="less" scoped>
.translation-tool {
  padding: 20px;
  
  .translation-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    
    .el-select {
      width: 180px;
    }
    
    .swap-btn {
      flex-shrink: 0;
    }
  }
  
  .translation-content {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    
    .translation-box {
      flex: 1;
      position: relative;
      
      .el-textarea {
        :deep(.el-textarea__inner) {
          font-size: 16px;
          line-height: 1.6;
        }
      }
      
      .char-count {
        position: absolute;
        bottom: 8px;
        right: 12px;
        font-size: 12px;
        color: #999;
      }
      
      .pronounce {
        margin-top: 8px;
        padding: 8px 12px;
        background: var(--el-fill-color-light);
        border-radius: 4px;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
  }
  
  .translation-actions {
    display: flex;
    gap: 12px;
  }
}
</style>
