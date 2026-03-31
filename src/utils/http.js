import axios from 'axios'

const instance = axios.create({
  timeout: 30 * 1000
})

instance.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  response => {
    return response
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

export async function get(url, params = {}, options = {}) {
  try {
    const response = await instance.get(url, {
      params,
      ...options
    })
    return response.data
  } catch (error) {
    throw error
  }
}

export async function post(url, data = {}, options = {}) {
  try {
    const response = await instance.post(url, data, options)
    return response.data
  } catch (error) {
    throw error
  }
}

export async function fetchUrl(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    dataType = 'text'
  } = options

  try {
    const config = {
      method,
      url,
      headers: {
        ...instance.defaults.headers.common,
        ...headers
      },
      responseType: dataType === 'json' ? 'json' : 'text'
    }

    if (body && method.toUpperCase() === 'POST') {
      config.data = body
    }

    const response = await instance.request(config)
    return response.data
  } catch (error) {
    throw error
  }
}

export default instance
