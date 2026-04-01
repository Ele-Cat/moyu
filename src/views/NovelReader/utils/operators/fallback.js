/**
 * 回退机制运算符
 * 实现 || 操作符，提供多级容错保障
 */

import { isEmpty } from '../types.js'

export function fallbackOperator(selectors, source, context = {}, options = {}) {
  const errors = []
  const rules = []
  
  for (let i = 0; i < selectors.length; i++) {
    const selector = selectors[i]
    rules.push(selector.rule || 'unknown')
    
    try {
      const result = selector.execute(source, context, options)
      
      if (result.success && !isEmpty(result.data)) {
        return {
          success: true,
          data: result.data,
          rule: rules.join(' || '),
          selector: 'fallback',
          usedRule: selector.rule || 'unknown',
          fallbackIndex: i
        }
      } else {
        errors.push({ rule: selector.rule || 'unknown', error: 'empty result', index: i })
      }
    } catch (error) {
      errors.push({ rule: selector.rule || 'unknown', error: error.message, index: i })
    }
  }
  
  const lastSelector = selectors[selectors.length - 1]
  try {
    const lastResult = lastSelector.execute(source, context, options)
    return {
      success: false,
      data: lastResult.data || null,
      rule: rules.join(' || '),
      selector: 'fallback',
      error: `所有选择器都失败: ${errors.map(e => `[${e.index}] ${e.rule}: ${e.error}`).join('; ')}`,
      usedRule: lastSelector.rule || 'unknown',
      fallbackIndex: selectors.length - 1
    }
  } catch (finalError) {
    return {
      success: false,
      data: null,
      rule: rules.join(' || '),
      selector: 'fallback',
      error: `所有选择器都失败，最后兜底也失败: ${finalError.message}`
    }
  }
}

export function parseFallbackRule(rule) {
  const parts = []
  let current = ''
  let depth = 0
  
  for (let i = 0; i < rule.length; i++) {
    const char = rule[i]
    if (char === '(') depth++
    else if (char === ')') depth--
    else if (char === '|' && depth === 0 && rule[i + 1] === '|') {
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

export function validateFallbackRules(rules) {
  return rules.every(rule => typeof rule === 'string' && rule.trim().length > 0)
}