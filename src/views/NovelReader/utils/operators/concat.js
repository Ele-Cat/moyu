/**
 * 拼接运算符
 * 实现 && 操作符，拼接多个选择器的结果
 */

import { isEmpty } from '../types.js'

export function concatOperator(selectors, source, context = {}, options = {}) {
  const results = []
  const rules = []
  
  for (const selector of selectors) {
    try {
      const result = selector.execute(source, context, options)
      
      if (result.success) {
        results.push(result.data)
        rules.push(selector.rule || 'unknown')
      } else {
        return {
          success: false,
          data: null,
          rule: rules.concat(selector.rule || 'unknown').join(' && '),
          selector: 'concat',
          error: `选择器 "${selector.rule}" 失败: ${result.error}`
        }
      }
    } catch (error) {
      return {
        success: false,
        data: null,
        rule: rules.concat(selector.rule || 'unknown').join(' && '),
        selector: 'concat',
        error: `选择器 "${selector.rule}" 执行错误: ${error.message}`
      }
    }
  }
  
  return {
    success: results.length > 0,
    data: results.join(''),
    rule: rules.join(' && '),
    selector: 'concat'
  }
}

export function parseConcatRule(rule) {
  const parts = []
  let current = ''
  let depth = 0
  
  for (let i = 0; i < rule.length; i++) {
    const char = rule[i]
    if (char === '(') depth++
    else if (char === ')') depth--
    else if (char === '&' && depth === 0 && rule[i + 1] === '&') {
      parts.push(current.trim())
      current = ''
      i++
      continue
    }
    current += char
  }
  
  if (current.trim()) {
    parts.push(current.trim())
  }
  
  return parts
}

export function smartConcatOperator(selectors, source, context = {}, options = {}) {
  const results = []
  const rules = []
  
  for (const selector of selectors) {
    try {
      const result = selector.execute(source, context, options)
      
      if (result.success) {
        let data = result.data
        if (typeof data === 'string') {
          data = data.trim()
        }
        results.push(data)
        rules.push(selector.rule || 'unknown')
      }
    } catch (error) {
      console.warn(`Smart concat: 选择器 "${selector.rule}" 执行错误: ${error.message}`)
    }
  }
  
  const combined = results.join('')
  
  return {
    success: results.length > 0 && !isEmpty(combined),
    data: combined,
    rule: rules.join(' && '),
    selector: 'concat'
  }
}