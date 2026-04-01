/**
 * CSS 选择器解析器
 * 使用浏览器原生 DOM API
 */

import { isEmpty, RuleParseError } from '../types.js'

export function cssSelector(source, selector, options = {}) {
  try {
    const $ = typeof source === 'string' ? parseHtml(source) : source
    const { expression, attribute } = parseCssExpression(selector)
    
    const elements = $.querySelectorAll(expression)
    
    if (elements.length === 0) {
      return { success: false, data: null, rule: selector, selector: 'css' }
    }
    
    let result = extractCssResult(elements, attribute)
    
    return {
      success: !isEmpty(result),
      data: result,
      rule: selector,
      selector: 'css'
    }
  } catch (error) {
    throw new RuleParseError(`CSS选择器解析失败: ${error.message}`, selector, 'css', error)
  }
}

function parseHtml(html) {
  const parser = new DOMParser()
  return parser.parseFromString(html, 'text/html')
}

function parseCssExpression(expression) {
  const atIndex = expression.lastIndexOf('@')
  
  if (atIndex === -1) {
    return { expression, attribute: null }
  }
  
  return {
    expression: expression.substring(0, atIndex),
    attribute: expression.substring(atIndex + 1)
  }
}

function extractCssResult(elements, attribute) {
  const results = []
  
  elements.forEach(el => {
    let value = null
    
    if (!attribute) {
      value = el.outerHTML
    } else if (attribute === 'text') {
      value = el.textContent.trim()
    } else if (attribute === 'html') {
      value = el.innerHTML
    } else if (attribute === 'href' || attribute === 'src') {
      value = el.getAttribute(attribute)
    } else if (attribute.startsWith('attr.')) {
      value = el.getAttribute(attribute.substring(5))
    } else {
      value = el.getAttribute(attribute)
    }
    
    if (value !== null) results.push(value)
  })
  
  return results.length === 1 ? results[0] : results
}

export function cssContainsSelector(source, selector, options = {}) {
  try {
    const $ = typeof source === 'string' ? parseHtml(source) : source
    const match = selector.match(/^(.+?):contains\("([^"]+)"\)$/)
    
    if (!match) {
      return cssSelector(source, selector, options)
    }
    
    const [, expression, text] = match
    const elements = $.querySelectorAll(expression)
    const results = []
    
    elements.forEach(el => {
      if (el.textContent.includes(text)) {
        results.push(el.outerHTML)
      }
    })
    
    return {
      success: results.length > 0,
      data: results.length === 1 ? results[0] : results,
      rule: selector,
      selector: 'css'
    }
  } catch (error) {
    throw new RuleParseError(`CSS选择器解析失败: ${error.message}`, selector, 'css', error)
  }
}