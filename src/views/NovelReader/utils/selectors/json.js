/**
 * JSON 选择器解析器
 * 使用 JSONPath 语法
 */

import { isEmpty, RuleParseError } from '../types.js'

export function jsonSelector(source, path, options = {}) {
  try {
    const jsonData = prepareJsonData(source)
    const result = queryJsonPath(jsonData, path)
    
    if (isEmpty(result)) {
      return { success: false, data: null, rule: path, selector: 'json' }
    }
    
    const data = extractJsonResult(result)
    
    return {
      success: !isEmpty(data),
      data,
      rule: path,
      selector: 'json'
    }
  } catch (error) {
    throw new RuleParseError(`JSON选择器解析失败: ${error.message}`, path, 'json', error)
  }
}

function prepareJsonData(source) {
  if (typeof source === 'string') {
    try {
      return JSON.parse(source)
    } catch (parseError) {
      throw new Error(`JSON 解析失败: ${parseError.message}`)
    }
  } else if (typeof source === 'object' && source !== null) {
    return source
  } else {
    throw new Error(`不支持的数据类型: ${typeof source}`)
  }
}

function queryJsonPath(data, path) {
  const cleanPath = path.startsWith('$.') ? path.substring(2) : path.replace(/^\$\.?/, '')
  const results = []
  
  function traverse(obj, keyPath) {
    const keys = keyPath.split('.')
    let current = obj
    
    for (const key of keys) {
      if (current === undefined || current === null) return
      
      if (key === '*') {
        if (Array.isArray(current)) {
          current.forEach(item => traverse(item, ''))
          return
        } else if (typeof current === 'object') {
          Object.values(current).forEach(item => traverse(item, ''))
          return
        }
      } else if (key.includes('[')) {
        const bracketMatch = key.match(/^(.+?)\[(\d+)?(?::(\d+))?\]$/)
        if (bracketMatch) {
          const [, prop, start, end] = bracketMatch
          const arr = prop ? current[prop] : current
          if (Array.isArray(arr)) {
            const s = start !== undefined ? parseInt(start) : 0
            const e = end !== undefined ? parseInt(end) : arr.length
            arr.slice(s, e).forEach(item => traverse(item, ''))
            return
          }
        }
      } else {
        current = current[key]
      }
    }
    
    if (current !== undefined) results.push(current)
  }
  
  if (cleanPath) {
    traverse(data, cleanPath)
  } else {
    results.push(data)
  }
  
  return results
}

function extractJsonResult(result) {
  if (result.length === 0) {
    return null
  } else if (result.length === 1) {
    return result[0]
  } else {
    return result
  }
}

export function jsonArraySelector(source, path, options = {}) {
  return jsonSelector(source, path, options)
}

export function jsonMultiPathSelector(source, paths, options = {}) {
  const results = {}
  const pathArray = paths.split(',').map(p => p.trim()).filter(p => p)
  
  pathArray.forEach(path => {
    const result = jsonSelector(source, path, options)
    if (result.success) {
      results[path] = result.data
    }
  })
  
  return {
    success: Object.keys(results).length > 0,
    data: results,
    rule: paths,
    selector: 'json'
  }
}

export function jsonFilterSelector(source, path, options = {}) {
  const match = path.match(/^(.+?)\?\((\?.+)\)$/)
  if (!match) return jsonSelector(source, path, options)
  
  const [, jsonPath, filterPath] = match
  const jsonResult = jsonSelector(source, jsonPath)
  
  if (!jsonResult.success || !Array.isArray(jsonResult.data)) {
    return jsonResult
  }
  
  const filtered = jsonResult.data.filter(item => {
    const filterResult = jsonSelector(item, filterPath)
    return filterResult.success && !isEmpty(filterResult.data)
  })
  
  return {
    success: filtered.length > 0,
    data: filtered,
    rule: path,
    selector: 'json'
  }
}