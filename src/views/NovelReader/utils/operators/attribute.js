/**
 * 属性提取运算符
 * 实现 @ 操作符，从元素中提取属性
 */

import { isEmpty } from '../types.js'

export function attributeOperator(source, attribute, options = {}) {
  try {
    if (typeof source === 'string') {
      return {
        success: false,
        data: null,
        selector: 'attr',
        error: '字符串无法提取属性'
      }
    }
    
    let value = null
    
    if (attribute === 'text') {
      value = source.textContent?.trim() || ''
    } else if (attribute === 'html') {
      value = source.innerHTML
    } else if (attribute === 'outerHTML') {
      value = source.outerHTML
    } else if (attribute === 'href') {
      value = source.getAttribute('href')
    } else if (attribute === 'src') {
      value = source.getAttribute('src')
    } else if (attribute.startsWith('attr.')) {
      value = source.getAttribute(attribute.substring(5))
    } else {
      value = source.getAttribute(attribute)
    }
    
    return {
      success: !isEmpty(value),
      data: value,
      selector: 'attr',
      attribute
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      selector: 'attr',
      error: `属性提取失败: ${error.message}`
    }
  }
}

export function multiAttributeOperator(source, attributes, options = {}) {
  const attrList = attributes.split(',').map(a => a.trim()).filter(a => a)
  const results = {}
  
  for (const attr of attrList) {
    const result = attributeOperator(source, attr, options)
    if (result.success) {
      results[attr] = result.data
    }
  }
  
  return {
    success: Object.keys(results).length > 0,
    data: results,
    selector: 'attr'
  }
}