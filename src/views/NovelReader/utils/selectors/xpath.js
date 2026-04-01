/**
 * XPath 选择器解析器
 * 使用浏览器原生 XPath
 */

import { isEmpty, RuleParseError } from '../types.js'

export function xpathSelector(source, selector, options = {}) {
  try {
    const doc = typeof source === 'string' ? parseHtml(source) : source
    const { expression, attribute } = parseXPathExpression(selector)
    
    const result = doc.evaluate(
      expression,
      doc.body || doc.documentElement,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    )
    
    if (result.snapshotLength === 0) {
      return { success: false, data: null, rule: selector, selector: 'xpath' }
    }
    
    const values = []
    for (let i = 0; i < result.snapshotLength; i++) {
      const node = result.snapshotItem(i)
      let value = null
      
      if (!attribute || attribute === 'text') {
        value = node.textContent?.trim() || ''
      } else if (attribute === 'html') {
        value = node.innerHTML
      } else {
        value = node.getAttribute(attribute)
      }
      
      if (value !== null) values.push(value)
    }
    
    const data = values.length === 1 ? values[0] : values
    
    return {
      success: !isEmpty(data),
      data,
      rule: selector,
      selector: 'xpath'
    }
  } catch (error) {
    throw new RuleParseError(`XPath选择器解析失败: ${error.message}`, selector, 'xpath', error)
  }
}

function parseHtml(html) {
  const parser = new DOMParser()
  return parser.parseFromString(html, 'text/html')
}

function parseXPathExpression(expression) {
  const atIndex = expression.lastIndexOf('@')
  
  if (atIndex === -1) {
    return { expression, attribute: null }
  }
  
  return {
    expression: expression.substring(0, atIndex),
    attribute: expression.substring(atIndex + 1)
  }
}

export function xpathAttributeSelector(source, selector, options = {}) {
  return xpathSelector(source, selector, options)
}

export function xpathTextSelector(source, selector, options = {}) {
  return xpathSelector(source, selector + '@text', options)
}