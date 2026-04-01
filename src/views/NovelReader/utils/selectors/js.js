/**
 * JavaScript 选择器解析器
 */

import { isEmpty, RuleParseError } from '../types.js'

export function jsSelector(source, code, options = {}) {
  try {
    const env = createJsEnv(source, options.variables || {})
    const fn = new Function('source', 'env', `with(env) { return (${code}) }`)
    const result = fn(source, env)
    
    return {
      success: !isEmpty(result),
      data: result,
      rule: code,
      selector: 'js'
    }
  } catch (error) {
    throw new RuleParseError(`JS选择器解析失败: ${error.message}`, code, 'js', error)
  }
}

function createJsEnv(source, variables = {}) {
  return {
    source,
    JSON,
    Math,
    Date,
    Array,
    Object,
    String,
    Number,
    RegExp,
    console,
    ...variables,
    
    log: (...args) => console.log(...args),
    result: null,
    
    source: source,
    
    getStr(str, start, end) {
      if (typeof str !== 'string') return ''
      const s = start !== undefined ? str.indexOf(start) : 0
      const e = end !== undefined ? str.indexOf(end, s) : str.length
      return s >= 0 && e > s ? str.substring(s + (start ? start.length : 0), e) : ''
    },
    
    getJson(str) {
      try {
        return JSON.parse(str)
      } catch (e) {
        return null
      }
    },
    
    html() {
      return typeof source === 'string' ? source : source.outerHTML || ''
    },
    
    text() {
      return typeof source === 'string' ? source : source.textContent || ''
    }
  }
}

export function jsConditionalSelector(source, code, options = {}) {
  try {
    const match = code.match(/^(\??)(.+?)\s*->\s*(.+)$/)
    if (!match) return jsSelector(source, code, options)
    
    const [, isNegated, condition, expression] = match
    const env = createJsEnv(source, options.variables || {})
    const conditionFn = new Function('source', 'env', `with(env) { return (${condition}) }`)
    const conditionResult = conditionFn(source, env)
    
    const shouldExecute = isNegated ? !conditionResult : conditionResult
    
    if (!shouldExecute) {
      return { success: false, data: null, rule: code, selector: 'js' }
    }
    
    return jsSelector(source, expression, options)
  } catch (error) {
    throw new RuleParseError(`JS条件选择器解析失败: ${error.message}`, code, 'js', error)
  }
}

export function jsMapSelector(source, code, options = {}) {
  try {
    let data = source
    if (typeof source === 'string') {
      try { data = JSON.parse(source) } catch (e) { data = [source] }
    }
    
    if (!Array.isArray(data)) {
      data = [data]
    }
    
    const env = createJsEnv(source, options.variables || {})
    const fn = new Function('item', 'index', 'env', `with(env) { return (${code}) }`)
    const results = data.map((item, index) => fn(item, index, env))
    
    return {
      success: results.length > 0,
      data: results,
      rule: code,
      selector: 'js'
    }
  } catch (error) {
    throw new RuleParseError(`JS映射选择器解析失败: ${error.message}`, code, 'js', error)
  }
}

export function jsFilterSelector(source, code, options = {}) {
  try {
    let data = source
    if (typeof source === 'string') {
      try { data = JSON.parse(source) } catch (e) { data = [source] }
    }
    
    if (!Array.isArray(data)) {
      data = [data]
    }
    
    const env = createJsEnv(source, options.variables || {})
    const fn = new Function('item', 'index', 'env', `with(env) { return (${code}) }`)
    const results = data.filter((item, index) => fn(item, index, env))
    
    return {
      success: results.length > 0,
      data: results,
      rule: code,
      selector: 'js'
    }
  } catch (error) {
    throw new RuleParseError(`JS过滤选择器解析失败: ${error.message}`, code, 'js', error)
  }
}

export function jsReduceSelector(source, code, options = {}) {
  try {
    let data = source
    if (typeof source === 'string') {
      try { data = JSON.parse(source) } catch (e) { data = [source] }
    }
    
    if (!Array.isArray(data)) {
      return { success: false, data: null, rule: code, selector: 'js' }
    }
    
    const [initCode, accumCode] = code.split('->').map(s => s.trim())
    const initValue = initCode ? eval(initCode) : data[0]
    
    const env = createJsEnv(source, options.variables || {})
    const fn = new Function('accum', 'item', 'index', 'env', `with(env) { return (${accumCode}) }`)
    const result = data.reduce((acc, item, index) => fn(acc, item, index, env), initValue)
    
    return {
      success: true,
      data: result,
      rule: code,
      selector: 'js'
    }
  } catch (error) {
    throw new RuleParseError(`JS归约选择器解析失败: ${error.message}`, code, 'js', error)
  }
}