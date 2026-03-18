import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

export function useRequest() {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const execute = async (options) => {
    loading.value = true
    error.value = null

    try {
      const result = await invoke('fetch_api', { options }).body
      data.value = result
      return result
    } catch (e) {
      error.value = e
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    data,
    loading,
    error,
    execute,
  }
}

export async function request(options) {
  const res = await invoke('fetch_api', { options })
  return res.body
}

export async function get(url, headers) {
  return await request({ url, method: 'GET', headers })
}

export async function post(url, body, headers) {
  return await request({ url, method: 'POST', body, headers })
}

export async function put(url, body, headers) {
  return await request({ url, method: 'PUT', body, headers })
}

export async function del(url, headers) {
  return await request({ url, method: 'DELETE', headers })
}
