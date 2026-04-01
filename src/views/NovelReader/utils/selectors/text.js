/**
 * Text 选择器解析器
 */

import { isEmpty, RuleParseError } from '../types.js'

export function textSelector(source, options = {}) {
  try {
    let text = ''
    
    if (typeof source === 'string') {
      text = source
    } else if (source && source.textContent) {
      text = source.textContent
    } else if (source && source.outerHTML) {
      text = source.outerHTML
    }
    
    return {
      success: !isEmpty(text),
      data: text.trim(),
      rule: options.rule || 'text',
      selector: 'text'
    }
  } catch (error) {
    throw new RuleParseError(`Text选择器解析失败: ${error.message}`, options.rule || 'text', 'text', error)
  }
}

export function quotedTextSelector(source, options = {}) {
  try {
    const text = typeof source === 'string' ? source : source.textContent || ''
    const results = []
    const regex = /"([^"]+)"|'([^']+)'/g
    let match
    
    while ((match = regex.exec(text)) !== null) {
      results.push(match[1] || match[2])
    }
    
    return {
      success: results.length > 0,
      data: results.length === 1 ? results[0] : results,
      rule: options.rule || 'quotedText',
      selector: 'text'
    }
  } catch (error) {
    throw new RuleParseError(`引用文本选择器解析失败: ${error.message}`, options.rule || 'quotedText', 'text', error)
  }
}

export function multilineTextSelector(source, options = {}) {
  try {
    const text = typeof source === 'string' ? source : source.textContent || ''
    const lines = text.split('\n').map(line => line.trim()).filter(line => line)
    
    return {
      success: lines.length > 0,
      data: lines,
      rule: options.rule || 'multilineText',
      selector: 'text'
    }
  } catch (error) {
    throw new RuleParseError(`多行文本选择器解析失败: ${error.message}`, options.rule || 'multilineText', 'text', error)
  }
}

export function templateTextSelector(source, template, options = {}) {
  try {
    const text = typeof source === 'string' ? source : source.textContent || ''
    const results = []
    const regex = /\{([^}]+)\}/g
    let match
    const data = {}
    
    while ((match = regex.exec(template)) !== null) {
      const key = match[1]
      if (key.startsWith('$')) {
        data[key] = text
      } else if (options.variables && options.variables[key] !== undefined) {
        data[key] = options.variables[key]
      }
    }
    
    let result = template
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    }
    
    return {
      success: true,
      data: result,
      rule: template,
      selector: 'text'
    }
  } catch (error) {
    throw new RuleParseError(`模板文本选择器解析失败: ${error.message}`, template, 'text', error)
  }
}