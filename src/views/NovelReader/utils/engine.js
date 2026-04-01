/**
 * 书源规则解析引擎
 * 整合所有选择器和运算符，提供统一的规则解析接口
 */

import { isEmpty, RuleParseError, SelectorType, OperatorType } from './types.js'
import * as selectors from './selectors/index.js'
import * as operators from './operators/index.js'

export class BookSourceRuleEngine {
  constructor(options = {}) {
    this.options = {
      defaultSelector: SelectorType.CSS,
      timeout: 10000,
      strictMode: false,
      debug: false,
      context: {},
      cache: { enabled: false, maxSize: 1000, ttl: 300000 },
      ...options
    }
    
    if (this.options.cache.enabled) {
      this.cache = new Map()
    }
  }

  async parseRule(rule, source, context = {}) {
    try {
      if (!rule || typeof rule !== 'string') {
        throw new Error('规则不能为空')
      }

      const cacheKey = this._generateCacheKey(rule, source, context)
      if (this.options.cache.enabled && this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.options.cache.ttl) {
          return { ...cached.result, fromCache: true }
        }
        this.cache.delete(cacheKey)
      }

      const parseResult = await this._executeRule(rule.trim(), source, context)
      
      if (this.options.cache.enabled && parseResult.success) {
        this._cacheResult(cacheKey, parseResult)
      }

      return parseResult

    } catch (error) {
      if (this.options.strictMode) {
        throw new RuleParseError(error.message, rule, 'unknown', error)
      }
      return {
        success: false,
        data: null,
        rule: rule,
        selector: 'unknown',
        error: error.message
      }
    }
  }

  async _executeRule(rule, source, context) {
    if (rule.includes('||')) {
      return this._handleFallbackRule(rule, source, context)
    }
    
    if (rule.includes('&&')) {
      return this._handleConcatRule(rule, source, context)
    }
    
    if (rule.includes('##')) {
      return this._handleRegexCleanRule(rule, source, context)
    }
    
    if (rule.includes('@') && !rule.includes(':contains(')) {
      return this._handleAttributeRule(rule, source, context)
    }
    
    if (rule.match(/\[\d+\]/) || rule.match(/\[\d+:\d+\]/)) {
      return this._handleIndexRule(rule, source, context)
    }
    
    return this._executeSelector(rule, source, context)
  }

  async _handleFallbackRule(rule, source, context) {
    const parts = operators.parseFallbackRule(rule)
    const selectorFns = parts.map(part => ({
      rule: part,
      execute: (src, ctx) => this._executeRule(part, src, ctx)
    }))
    
    return operators.fallbackOperator(selectorFns, source, context, this.options)
  }

  async _handleConcatRule(rule, source, context) {
    const parts = operators.parseConcatRule(rule)
    const selectorFns = parts.map(part => ({
      rule: part,
      execute: (src, ctx) => this._executeRule(part, src, ctx)
    }))
    
    return operators.concatOperator(selectorFns, source, context, this.options)
  }

  async _handleRegexCleanRule(rule, source, context) {
    const parts = operators.parseCleanRule(rule)
    const selectorFn = {
      rule: parts[0],
      execute: (src, ctx) => this._executeRule(parts[0], src, ctx)
    }
    
    let result = await this._executeRule(parts[0], source, context)
    
    if (result.success) {
      for (let i = 1; i < parts.length; i++) {
        result = operators.regexCleanOperator(result.data, parts[i], this.options)
      }
    }
    
    return result
  }

  async _handleAttributeRule(rule, source, context) {
    const atIndex = rule.lastIndexOf('@')
    const selector = rule.substring(0, atIndex)
    const attribute = rule.substring(atIndex + 1)
    
    const baseResult = selector ? await this._executeRule(selector, source, context) : { success: true, data: source }
    
    if (!baseResult.success) return baseResult
    
    return operators.attributeOperator(baseResult.data, attribute, this.options)
  }

  async _handleIndexRule(rule, source, context) {
    const bracketMatch = rule.match(/^(.+?)\[(\d+|\d*:\d*)\]$/)
    if (!bracketMatch) {
      return this._executeSelector(rule, source, context)
    }
    
    const [, selector, index] = bracketMatch
    const baseResult = selector ? await this._executeRule(selector, source, context) : { success: true, data: source }
    
    if (!baseResult.success) return baseResult
    
    if (index.includes(':')) {
      return operators.rangeOperator(baseResult.data, index, this.options)
    }
    return operators.indexOperator(baseResult.data, index, this.options)
  }

  async _executeSelector(rule, source, context) {
    const { selectorType, expression } = this._parseSelectorType(rule)
    
    let dataSource = source
    if (selectorType !== SelectorType.JSON && typeof source === 'string') {
      if (source.trim().startsWith('{') || source.trim().startsWith('[')) {
        try {
          dataSource = JSON.parse(source)
        } catch (e) {}
      }
    }
    
    switch (selectorType) {
      case SelectorType.CSS:
        if (rule.includes(':contains(')) {
          return selectors.cssContainsSelector(dataSource, expression, { ...this.options, ...context })
        }
        return selectors.cssSelector(dataSource, expression, { ...this.options, ...context })
        
      case SelectorType.XPATH:
        return selectors.xpathSelector(dataSource, expression, { ...this.options, ...context })
        
      case SelectorType.JSON:
        return selectors.jsonSelector(dataSource, expression, { ...this.options, ...context })
        
      case SelectorType.REGEX:
        return selectors.regexSelector(dataSource, expression, { ...this.options, ...context })
        
      case SelectorType.JS:
        return selectors.jsSelector(dataSource, expression, { ...this.options, ...context })
        
      case SelectorType.TEXT:
        return selectors.textSelector(dataSource, { ...this.options, ...context, rule: expression })
        
      default:
        return selectors.cssSelector(dataSource, rule, { ...this.options, ...context })
    }
  }

  _parseSelectorType(rule) {
    if (rule.startsWith('@css:')) {
      return { selectorType: SelectorType.CSS, expression: rule.substring(5) }
    }
    if (rule.startsWith('@json:') || rule.startsWith('$')) {
      return { selectorType: SelectorType.JSON, expression: rule }
    }
    if (rule.startsWith('@xpath:')) {
      return { selectorType: SelectorType.XPATH, expression: rule.substring(7) }
    }
    if (rule.startsWith('@js:')) {
      return { selectorType: SelectorType.JS, expression: rule.substring(4) }
    }
    if (rule.startsWith('@regex:') || rule.startsWith(':')) {
      return { selectorType: SelectorType.REGEX, expression: rule.substring(rule.startsWith('@regex:') ? 7 : 1) }
    }
    
    return { selectorType: this.options.defaultSelector, expression: rule }
  }

  _generateCacheKey(rule, source, context) {
    const sourceStr = typeof source === 'string' ? source.substring(0, 100) : 'dom'
    return `${rule}_${sourceStr}_${JSON.stringify(context)}`
  }

  _cacheResult(key, result) {
    if (this.cache.size >= this.options.cache.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, { result, timestamp: Date.now() })
  }

  clearCache() {
    if (this.cache) this.cache.clear()
  }
}

export const engine = new BookSourceRuleEngine()

export function parseRule(rule, source, context) {
  return engine.parseRule(rule, source, context)
}

export function extractFromHtml(html, rule, options = {}) {
  return engine.parseRule(rule, html, options)
}

export function extractFromJson(json, rule, options = {}) {
  return engine.parseRule(rule, json, options)
}