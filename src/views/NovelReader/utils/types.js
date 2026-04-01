/**
 * 类型定义
 * Book Source Rule Parser - Browser Compatible Version
 */

export const SelectorType = {
  CSS: 'css',
  XPATH: 'xpath',
  JSON: 'json',
  REGEX: 'regex',
  JS: 'js',
  TEXT: 'text'
}

export const OperatorType = {
  FALLBACK: '||',
  CONCAT: '&&',
  ATTR: '@',
  INDEX: '[]',
  REGEX_CLEAN: '##',
  CONTAINS: ':contains('
}

export function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export class RuleParseError extends Error {
  constructor(message, rule, selector, originalError) {
    super(message)
    this.name = 'RuleParseError'
    this.rule = rule
    this.selector = selector
    this.originalError = originalError
  }
}