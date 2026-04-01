/**
 * Legado 书源规则解析器 - 浏览器兼容版
 * Book Source Rule Parser - Browser Compatible Version
 * 
 * 支持: CSS、XPath、JSON、正则、JS 选择器和组合运算规则
 * 
 * @example
 * import { parseRule, extractFromHtml } from '@/views/NovelReader/utils'
 * 
 * const result = await parseRule('.title@text', htmlContent)
 * const jsonResult = await parseRule('$.data.items[*].name', jsonData)
 */

export { SelectorType, OperatorType, isEmpty, RuleParseError } from './types.js'
export * from './selectors/index.js'
export * from './operators/index.js'
export { BookSourceRuleEngine, engine, parseRule, extractFromHtml, extractFromJson } from './engine.js'
export * from './helpers.js'