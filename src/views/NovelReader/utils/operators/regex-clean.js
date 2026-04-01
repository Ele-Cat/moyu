/**
 * 正则净化运算符
 * 实现 ## 操作符，使用正则表达式清理文本
 */

import { isEmpty } from '../types.js'

export function regexCleanOperator(source, pattern, options = {}) {
  try {
    let text = source
    
    if (typeof source !== 'string') {
      text = source.textContent || ''
    }
    
    const regex = new RegExp(pattern, 'g')
    const result = text.replace(regex, '')
    
    return {
      success: true,
      data: result.trim(),
      selector: 'regexClean',
      pattern
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      selector: 'regexClean',
      error: `正则净化失败: ${error.message}`
    }
  }
}

export function parseCleanRule(rule) {
  const parts = []
  let current = ''
  let depth = 0
  
  for (let i = 0; i < rule.length; i++) {
    const char = rule[i]
    if (char === '(') depth++
    else if (char === ')') depth--
    else if (char === '#' && depth === 0 && rule[i + 1] === '#') {
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

export function batchRegexCleanOperator(source, patterns, options = {}) {
  let text = source
  
  if (typeof source !== 'string') {
    text = source.textContent || ''
  }
  
  const patternList = patterns.split('##').map(p => p.trim()).filter(p => p)
  
  for (const pattern of patternList) {
    const regex = new RegExp(pattern, 'g')
    text = text.replace(regex, '')
  }
  
  return {
    success: true,
    data: text.trim(),
    selector: 'regexClean',
    patterns
  }
}

const PRESET_PATTERNS = {
  whitespace: '\\s+',
  blank: '^\\s*$',
  punctuation: '[.,;:!?，。；：！？]',
  html: '<[^>]+>',
  tag: '<[^>]*>',
  noscript: '<noscript>[\\s\\S]*?</noscript>',
  script: '<script[^>]*>[\\s\\S]*?</script>',
  style: '<style[^>]*>[\\s\\S]*?</style>',
  comment: '<!--[\\s\\S]*?-->'
}

export function presetCleanOperator(source, presetName, options = {}) {
  const pattern = PRESET_PATTERNS[presetName]
  
  if (!pattern) {
    return {
      success: false,
      data: null,
      selector: 'regexClean',
      error: `未知的预设: ${presetName}`
    }
  }
  
  return regexCleanOperator(source, pattern, options)
}

export function smartCleanOperator(source, options = {}) {
  let text = source
  
  if (typeof source !== 'string') {
    text = source.textContent || ''
  }
  
  text = text.replace(/<[^>]+>/g, '')
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/\s+/g, ' ')
  text = text.trim()
  
  return {
    success: true,
    data: text,
    selector: 'regexClean',
    type: 'smart'
  }
}