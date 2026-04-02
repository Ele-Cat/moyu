import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useMusicSourceStore = defineStore('musicSource', () => {
  const sources = ref([
    { id: 'sixyin', name: 'SixYin（六音）', url: 'https://ghproxy.net/raw.githubusercontent.com/pdone/lx-music-source/main/sixyin/latest.js', enabled: true, status: 'idle' },
    { id: 'huibq', name: 'Huibq', url: 'https://ghproxy.net/raw.githubusercontent.com/pdone/lx-music-source/main/huibq/latest.js', enabled: true, status: 'idle' },
    { id: 'flower', name: 'Flower（野花）', url: 'https://ghproxy.net/raw.githubusercontent.com/pdone/lx-music-source/main/flower/latest.js', enabled: true, status: 'idle' },
    { id: 'grass', name: 'Grass（野草）', url: 'https://tt.tenmeng.com/moonue/js/yecao202412.js', enabled: true, status: 'idle' },
    { id: 'liumingye', name: '刘明野独家音源', url: 'https://s3.liumingye.cn/files/tool/lx-dujia.js', enabled: true, status: 'idle' },
  ])

  const currentSourceId = ref('sixyin')
  const sourceInstances = ref({})
  const loadError = ref('')

  const getCurrentSource = () => {
    return sources.value.find(s => s.id === currentSourceId.value)
  }

  const loadSource = async (sourceId) => {
    const source = sources.value.find(s => s.id === sourceId)
    if (!source) {
      loadError.value = `音源 ${sourceId} 不存在`
      return false
    }

    try {
      source.status = 'loading'
      loadError.value = ''

      if (sourceInstances.value[sourceId]) {
        source.status = 'ready'
        return true
      }

      const response = await fetch(source.url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const scriptContent = await response.text()
      
      const script = document.createElement('script')
      script.textContent = `
        (function() {
          const exports = {};
          const module = { exports: exports };
          try {
            ${scriptContent}
            window.__musicSource_${sourceId} = module.exports || exports;
          } catch(e) {
            console.error('Source load error:', e);
            window.__musicSource_${sourceId}_error = e;
          }
        })();
      `
      document.body.appendChild(script)
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (window[`__musicSource_${sourceId}_error`]) {
        throw window[`__musicSource_${sourceId}_error`]
      }
      
      sourceInstances.value[sourceId] = window[`__musicSource_${sourceId}`]
      source.status = 'ready'
      return true
    } catch (error) {
      source.status = 'error'
      loadError.value = `加载音源失败: ${error.message}`
      console.error('Source load error:', error)
      return false
    }
  }

  const setCurrentSource = async (sourceId) => {
    const source = sources.value.find(s => s.id === sourceId)
    if (!source) return false

    const success = await loadSource(sourceId)
    if (success) {
      currentSourceId.value = sourceId
    }
    return success
  }

  const addSource = (source) => {
    const newSource = {
      id: source.id || `custom_${Date.now()}`,
      name: source.name,
      url: source.url,
      enabled: true,
      status: 'idle',
    }
    sources.value.push(newSource)
  }

  const removeSource = (sourceId) => {
    const index = sources.value.findIndex(s => s.id === sourceId)
    if (index > -1) {
      sources.value.splice(index, 1)
      delete sourceInstances.value[sourceId]
      if (currentSourceId.value === sourceId && sources.value.length > 0) {
        currentSourceId.value = sources.value[0].id
      }
    }
  }

  const toggleSourceEnabled = (sourceId) => {
    const source = sources.value.find(s => s.id === sourceId)
    if (source) {
      source.enabled = !source.enabled
    }
  }

  const getSourceInstance = (sourceId) => {
    return sourceInstances.value[sourceId]
  }

  return {
    sources,
    currentSourceId,
    sourceInstances,
    loadError,
    getCurrentSource,
    loadSource,
    setCurrentSource,
    addSource,
    removeSource,
    toggleSourceEnabled,
    getSourceInstance,
  }
}, {
  persist: {
    key: 'musicSource',
    storage: localStorage,
  },
})
