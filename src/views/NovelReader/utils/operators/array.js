/**
 * 索引选择运算符
 * 实现 [] 操作符，从数组或元素列表中选择特定索引
 */

import { isEmpty } from '../types.js'

export function indexOperator(source, index, options = {}) {
  try {
    let data = source
    
    if (typeof source === 'string') {
      try {
        data = JSON.parse(source)
      } catch (e) {
        data = [source]
      }
    }
    
    if (!Array.isArray(data)) {
      data = [data]
    }
    
    let idx = parseInt(index)
    if (isNaN(idx)) {
      return {
        success: false,
        data: null,
        selector: 'index',
        error: `无效的索引: ${index}`
      }
    }
    
    let result
    if (idx >= 0) {
      result = data[idx]
    } else {
      result = data[data.length + idx]
    }
    
    return {
      success: result !== undefined,
      data: result,
      selector: 'index',
      index
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      selector: 'index',
      error: `索引操作失败: ${error.message}`
    }
  }
}

export function rangeOperator(source, range, options = {}) {
  try {
    let data = source
    
    if (typeof source === 'string') {
      try {
        data = JSON.parse(source)
      } catch (e) {
        data = [source]
      }
    }
    
    if (!Array.isArray(data)) {
      data = [data]
    }
    
    const parts = range.split(':').map(p => parseInt(p))
    const start = isNaN(parts[0]) ? 0 : parts[0]
    const end = isNaN(parts[1]) ? data.length : parts[1]
    
    const result = data.slice(start, end)
    
    return {
      success: result.length > 0,
      data: result,
      selector: 'index',
      range
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      selector: 'index',
      error: `范围操作失败: ${error.message}`
    }
  }
}

export function multiIndexOperator(source, indices, options = {}) {
  const idxList = indices.split(',').map(i => i.trim()).filter(i => i)
  const results = []
  
  for (const idx of idxList) {
    const result = indexOperator(source, idx, options)
    if (result.success) {
      results.push(result.data)
    }
  }
  
  return {
    success: results.length > 0,
    data: results,
    selector: 'index'
  }
}