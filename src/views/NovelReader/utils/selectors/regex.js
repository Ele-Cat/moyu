/**
 * 正则选择器解析器
 */

import { isEmpty, RuleParseError } from '../types.js'

export function regexSelector(source, pattern, options = {}) {
  try {
    const text = typeof source === 'string' ? source : source.textContent || ''
    const regex = new RegExp(pattern, 'g')
    const results = []
    let match
    
    while ((match = regex.exec(text)) !== null) {
      results.push(match[1] !== undefined ? match[1] : match[0])
    }
    
    return {
      success: results.length > 0,
      data: results.length === 1 ? results[0] : results,
      rule: pattern,
      selector: 'regex'
    }
  } catch (error) {
    throw new RuleParseError(`正则选择器解析失败: ${error.message}`, pattern, 'regex', error)
  }
}

export function regexReplaceSelector(source, pattern, replacement, options = {}) {
  try {
    const text = typeof source === 'string' ? source : source.textContent || ''
    const regex = new RegExp(pattern, 'g')
    const result = text.replace(regex, replacement)
    
    return {
      success: true,
      data: result,
      rule: pattern,
      selector: 'regex'
    }
  } catch (error) {
    throw new RuleParseError(`正则替换失败: ${error.message}`, pattern, 'regex', error)
  }
}

export function regexSplitSelector(source, pattern, options = {}) {
  try {
    const text = typeof source === 'string' ? source : source.textContent || ''
    const regex = new RegExp(pattern)
    const results = text.split(regex)
    
    return {
      success: results.length > 0,
      data: results,
      rule: pattern,
      selector: 'regex'
    }
  } catch (error) {
    throw new RuleParseError(`正则分割失败: ${error.message}`, pattern, 'regex', error)
  }
}

export function regexTestSelector(source, pattern, options = {}) {
  try {
    const text = typeof source === 'string' ? source : source.textContent || ''
    const regex = new RegExp(pattern)
    const match = text.match(regex)
    
    return {
      success: match !== null,
      data: match ? (match[1] || match[0]) : null,
      rule: pattern,
      selector: 'regex'
    }
  } catch (error) {
    throw new RuleParseError(`正则测试失败: ${error.message}`, pattern, 'regex', error)
  }
}

export function regexMultiPatternSelector(source, patterns, options = {}) {
  const results = {}
  const patternArray = patterns.split(',').map(p => p.trim()).filter(p => p)
  
  patternArray.forEach(pattern => {
    const result = regexSelector(source, pattern, options)
    if (result.success) {
      results[pattern] = result.data
    }
  })
  
  return {
    success: Object.keys(results).length > 0,
    data: results,
    rule: patterns,
    selector: 'regex'
  }
}