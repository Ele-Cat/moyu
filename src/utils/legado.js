/**
 * Legado 书源解析工具
 * 参考: e:\demo\moyu\src\views\NovelReader\rules.md
 */

// Cookie 存储
const cookieStore = {}

// 正则表达式
const CSS_PREFIX = '@css:'
const JSON_PREFIX = '@json:'
const XPATH_PREFIX = '@xpath:'
const JS_PREFIX = '@js:'
const JS_TAG_PATTERN = /<js>([\s\S]*?)<\/js>/g

/**
 * ==================== URL 构建 ====================
 */

/**
 * 构建搜索 URL
 * @param {Object} source - 书源配置
 * @param {string} keyword - 搜索关键词
 * @param {number} page - 页码
 * @returns {Object} { url, method, headers, body }
 */
export function buildSearchUrl(source, keyword, page = 1) {
  let url = source.searchUrl || ''
  let body = null
  let method = 'GET'
  let headers = parseHeader(source.header)

  // 执行 @js: 脚本
  url = executeUrlJs(url, source, keyword, page)

  // 解析 JSON 配置格式: url,{"body":"...","method":"POST","headers":{}}
  const jsonMatch = url.match(/,(\s*\{[\s\S]*\})\s*$/)
  if (jsonMatch) {
    try {
      const jsonStr = jsonMatch[1]
      const urlConfig = JSON.parse(jsonStr)
      if (urlConfig.body) {
        body = urlConfig.body
        method = urlConfig.method || 'POST'
      }
      if (urlConfig.headers) {
        headers = { ...headers, ...urlConfig.headers }
      }
      if (urlConfig.charset) {
        headers['charset'] = urlConfig.charset
      }
      url = url.substring(0, url.indexOf(',')).trim()
    } catch (e) {
      console.warn('解析 searchUrl JSON 失败:', e)
    }
  }

  // 替换变量
  url = url.replace(/\{\{key\}\}/g, encodeURIComponent(keyword))
  url = url.replace(/\{\{key2\}\}/g, keyword)
  url = url.replace(/\{\{page\}\}/g, String(page))
  url = url.replace(/\{\{pageNumber\}\}/g, String(page))
  url = url.replace(/\{\{page\.(\d+)\}\}/g, (_, n) => String(page + parseInt(n) - 1))

  // 处理相对 URL
  url = resolveUrl(url, source.bookSourceUrl)

  // 处理 body 中的变量
  if (body) {
    body = body.replace(/\{\{key\}\}/g, encodeURIComponent(keyword))
    body = body.replace(/\{\{key2\}\}/g, keyword)
    body = body.replace(/\{\{page\}\}/g, String(page))
    body = body.replace(/\{\{pageNumber\}\}/g, String(page))
    
    // 将 URL 编码字符串转为对象
    if (typeof body === 'string' && body.includes('=')) {
      const params = new URLSearchParams(body)
      const obj = {}
      for (const [key, value] of params) {
        obj[key] = value
      }
      body = obj
    }
  }

  return { url, method, headers, body }
}

/**
 * 执行 URL 中的 @js: 脚本
 */
function executeUrlJs(url, source, key, page = 1) {
  const jsMatch = url.match(/@js:([\s\S]*?)(?=\$\$|&&|,|$)/)
  if (!jsMatch) return url

  const jsCode = jsMatch[1].trim()
  const env = createJsEnv(source, key, page)

  try {
    const result = executeJs(jsCode, env)
    if (result !== undefined && result !== null) {
      return url.replace(/@js:[\s\S]*?(?=\$\$|&&|,|$)/, String(result))
    }
  } catch (e) {
    console.warn('执行 URL JS 失败:', e.message)
  }
  return url
}

/**
 * ==================== 请求头解析 ====================
 */

/**
 * 解析请求头
 * @param {string} headerStr - 请求头 JSON 字符串
 * @returns {Object} 请求头对象
 */
export function parseHeader(headerStr) {
  if (!headerStr) return {}
  try {
    const headers = JSON.parse(headerStr)
    // 处理 proxy
    if (headers.proxy) {
      // 代理配置
    }
    return headers
  } catch {
    return {}
  }
}

/**
 * ==================== 搜索结果解析 ====================
 */

/**
 * 解析搜索结果
 * @param {string} html - HTML 或 JSON 内容
 * @param {Object} ruleSearch - 搜索规则
 * @param {string} sourceUrl - 书源 URL
 * @returns {Array} 书籍列表
 */
export function parseSearchResult(content, ruleSearch, sourceUrl = '') {
  if (!content || !ruleSearch) return []

  const results = []
  let bookListRule = ruleSearch.bookList || ''

  // 检测是否为 JSON 格式
  let isJson = false
  let jsonData = null
  
  const trimmed = content.trim()
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      jsonData = JSON.parse(content)
      isJson = true
    } catch (e) {
      // 不是有效 JSON，继续按 HTML 处理
    }
  }

  let elements = []
  
  if (isJson) {
    // JSON 格式 - 使用 JSONPath 解析
    if (bookListRule.startsWith('$') || bookListRule.startsWith(JSON_PREFIX)) {
      const jsonPath = bookListRule.replace(JSON_PREFIX, '')
      elements = jsonSelect(jsonData, jsonPath)
    } else {
      // 尝试用 JSONPath 解析
      elements = jsonSelect(jsonData, bookListRule)
    }
  } else {
    // HTML 格式
    if (bookListRule.startsWith(CSS_PREFIX)) {
      const selector = bookListRule.substring(CSS_PREFIX.length)
      elements = cssSelect(content, selector)
    } else if (bookListRule.startsWith(XPATH_PREFIX)) {
      elements = xpathSelect(content, bookListRule.substring(XPATH_PREFIX.length))
    } else if (bookListRule.startsWith('$') || bookListRule.startsWith(JSON_PREFIX)) {
      // HTML 中的 JSON 数据
      const jsonPath = bookListRule.replace(JSON_PREFIX, '')
      elements = jsonSelect(content, jsonPath)
    } else if (bookListRule.startsWith(':')) {
      elements = regexAllInOne(content, bookListRule.substring(1), sourceUrl)
    } else {
      elements = jsoupSelect(content, bookListRule)
    }
  }

  elements.forEach(el => {
    const book = {
      bookName: extractRule(el, ruleSearch.name, sourceUrl),
      author: extractRule(el, ruleSearch.author, sourceUrl),
      bookUrl: extractRule(el, ruleSearch.bookUrl, sourceUrl),
      coverUrl: extractRule(el, ruleSearch.coverUrl, sourceUrl),
      intro: extractRule(el, ruleSearch.intro, sourceUrl),
      kind: extractRule(el, ruleSearch.kind, sourceUrl),
      wordCount: extractRule(el, ruleSearch.wordCount, sourceUrl),
      latestChapter: extractRule(el, ruleSearch.lastChapter || ruleSearch.latestChapter, sourceUrl),
    }

    if (book.bookName) {
      book.bookUrl = resolveUrl(book.bookUrl || '', sourceUrl)
      book.coverUrl = resolveUrl(book.coverUrl || '', sourceUrl)
      results.push(book)
    }
  })

  return results
}

/**
 * ==================== 规则提取 ====================
 */

/**
 * 提取规则处理入口
 * @param {string|Object} element - HTML 字符串或 DOM 元素或 JSON 对象
 * @param {string} rule - 提取规则
 * @param {string} baseUrl - 基础 URL
 * @returns {string} 提取结果
 */
export function extractRule(element, rule, baseUrl = '') {
  if (!rule) return ''

  // 处理连接符
  if (rule.includes('&&')) {
    return rule.split('&&').map(r => extractSingleRule(element, r.trim(), baseUrl)).join('')
  }
  if (rule.includes('||')) {
    const parts = rule.split('||')
    for (const part of parts) {
      const result = extractSingleRule(element, part.trim(), baseUrl)
      if (result) return result
    }
    return ''
  }
  if (rule.includes('%%')) {
    return extractZipRule(element, rule.split('%%'), baseUrl)
  }
 
  return extractSingleRule(element, rule, baseUrl)
}

/**
 * 单条规则提取
 */
function extractSingleRule(element, rule, baseUrl = '') {
  if (!rule) return ''

  // 如果 element 是 JSON 对象（已解析的 JSON）
  if (element && typeof element === 'object' && !Array.isArray(element) && !(element instanceof Element)) {
    // 使用 JSONPath 解析
    const jsonPath = rule.replace(JSON_PREFIX, '').replace(/^\$\.?/, '')
    if (jsonPath || rule.startsWith('$') || rule.startsWith(JSON_PREFIX)) {
      return jsonExtract(element, jsonPath || rule.replace(JSON_PREFIX, ''), baseUrl)
    }
  }

  if (!element) return ''

  rule = rule.trim()

  // 处理 <js></js> 标签
  if (rule.includes('<js>')) {
    return executeJsTag(element, rule, baseUrl)
  }

  // 处理 @js: 规则
  if (rule.includes(JS_PREFIX)) {
    return executeJsRule(element, rule, baseUrl)
  }

  // 处理正则净化 ##regex##replacement
  let cleanRule = ''
  let replaceStr = ''
  const cleanMatch = rule.match(/^(.+?)##(.+)$/)
  if (cleanMatch) {
    cleanRule = cleanMatch[1]
    replaceStr = cleanMatch[2]
  } else {
    cleanRule = rule
  }

  let result = ''

  // 根据前缀选择解析方式
  if (cleanRule.startsWith(CSS_PREFIX)) {
    result = cssExtract(element, cleanRule.substring(CSS_PREFIX.length), baseUrl)
  } else if (cleanRule.startsWith(XPATH_PREFIX)) {
    result = xpathExtract(element, cleanRule.substring(XPATH_PREFIX.length), baseUrl)
  } else if (cleanRule.startsWith('$') || cleanRule.startsWith(JSON_PREFIX)) {
    const jsonPath = cleanRule.replace(JSON_PREFIX, '').replace(/^\$\.?/, '')
    result = jsonExtract(element, jsonPath, baseUrl)
  } else if (cleanRule.startsWith(':')) {
    // 正则 AllInOne
    result = regexAllInOne(element, cleanRule.substring(1), baseUrl)[0] || ''
  } else {
    // 默认 JSOUP
    result = jsoupExtract(element, cleanRule, baseUrl)
  }

  // 应用净化规则
  if (replaceStr) {
    result = result.replace(new RegExp(cleanRule.split('##')[0] || '.*', 'g'), replaceStr === '<<' ? '' : replaceStr)
  }

  return result
}

/**
 * JSOUP 格式解析
 * 格式: class.name.0@tag.a.0@text
 * @为分隔符，分3段: 类型(class), 名称, 位置
 * 位置: 0开始，-1倒数第一个，!排除
 * 最后一段: text, html, href, src, all, ownText, textNodes
 */
function jsoupSelect(html, rule) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  let isReverse = false
  if (rule.startsWith('-')) {
    isReverse = true
    rule = rule.substring(1)
  }

  const parts = rule.split('@')
  let elements = [doc.body]

  for (let i = 0; i < parts.length; i++) {
    let part = parts[i]
    let nextParts = part.split('.')
    
    // 处理没有前缀的选择器，如 ".line" 视为 "class.line"
    if (nextParts[0] === '' && nextParts.length > 1) {
      nextParts = ['class', nextParts[1], ...nextParts.slice(2)]
    }
    
    let type = nextParts[0]
    let name = nextParts[1]
    let posStr = nextParts[2]
    let excludeStr = nextParts[3]

    let matched = []

    elements.forEach(el => {
      if (type === 'class') {
        matched = Array.from(el.getElementsByClassName(name))
      } else if (type === 'id') {
        const found = el.getElementById(name)
        if (found) matched = [found]
      } else if (type === 'tag') {
        matched = Array.from(el.getElementsByTagName(name))
      } else if (type === 'text') {
        matched = Array.from(el.querySelectorAll(`*:contains("${name}")`))
      } else if (type === 'children') {
        matched = Array.from(el.children)
      } else if (type.match(/^\d+$/)) {
        const idx = parseInt(type)
        const children = Array.from(el.children)
        if (children[idx]) matched = [children[idx]]
      } else if (part.startsWith('.')) {
        // CSS 类选择器 .className
        matched = Array.from(el.getElementsByClassName(part.substring(1)))
      } else if (part.startsWith('#')) {
        // CSS ID 选择器 #id
        const found = el.getElementById(part.substring(1))
        if (found) matched = [found]
      } else {
        // CSS 标签选择器 tagName
        matched = Array.from(el.getElementsByTagName(part))
      }
    })

    // 处理位置
    if (posStr !== undefined) {
      const pos = parseInt(posStr)
      if (!isNaN(pos)) {
        if (pos >= 0) {
          matched = matched.slice(pos, pos + 1)
        } else {
          matched = matched.slice(pos)
        }
      }
    }

    // 处理排除 !0:1
    if (excludeStr && excludeStr.startsWith('!')) {
      const excludeParts = excludeStr.substring(1).split(':').map(Number)
      matched = matched.filter((_, i) => !excludeParts.includes(i))
    }

    elements = matched
    if (elements.length === 0) break
  }

  if (isReverse) elements.reverse()

  return elements
}

/**
 * JSOUP 提取内容
 */
function jsoupExtract(element, rule, baseUrl) {
  const parts = rule.split('@')
  
  // 最后一段是获取方式
  const suffix = parts[parts.length - 1]
  const selectorParts = parts.slice(0, -1)
  
  let el = element
  
  // 遍历选择器
  if (selectorParts.length > 0 && selectorParts[0]) {
    const selector = selectorParts.join('.')
    const parsed = jsoupParseSelector(selector)
    
    if (parsed.type === 'class') {
      el = element.getElementsByClassName(parsed.name)[parsed.pos]
    } else if (parsed.type === 'id') {
      el = element.getElementById(parsed.name)
    } else if (parsed.type === 'tag') {
      el = element.getElementsByTagName(parsed.name)[parsed.pos]
    }
  }
  
  if (!el) return ''

  // 根据后缀返回内容
  if (suffix === 'text') {
    return el.textContent?.trim() || ''
  } else if (suffix === 'ownText') {
    return el.textContent?.trim() || ''
  } else if (suffix === 'textNodes') {
    return Array.from(el.childNodes)
      .filter(n => n.nodeType === Node.TEXT_NODE)
      .map(n => n.textContent.trim())
      .join('')
  } else if (suffix === 'html' || suffix === 'outerHtml') {
    return el.innerHTML || ''
  } else if (suffix === 'all') {
    return el.outerHTML || ''
  } else if (suffix === 'href' || suffix === 'src' || suffix === 'data-src') {
    return el.getAttribute(suffix) || ''
  } else if (suffix.startsWith('-')) {
    // 获取前面N个元素
    const count = parseInt(suffix.substring(1)) || 1
    const siblings = el.parentElement ? Array.from(el.parentElement.children).slice(0, count) : [el]
    return siblings.map(e => e.textContent.trim()).join('')
  } else {
    return el.getAttribute(suffix) || el.textContent?.trim() || ''
  }
}

/**
 * 解析 JSOUP 选择器
 */
function jsoupParseSelector(selector) {
  const parts = selector.split('.')
  return {
    type: parts[0],
    name: parts[1],
    pos: parseInt(parts[2]) || 0
  }
}

/**
 * ==================== CSS 选择器 ====================
 */

function cssSelect(html, selector) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return Array.from(doc.querySelectorAll(selector))
}

function cssExtract(element, selector, baseUrl) {
  const el = typeof element === 'string' 
    ? (new DOMParser()).parseFromString(element, 'text/html').querySelector(selector)
    : element.querySelector(selector)
  
  if (!el) return ''
  
  // 解析后缀
  const parts = selector.split('@')
  const suffix = parts[parts.length - 1]
  
  if (suffix === 'text') return el.textContent?.trim() || ''
  if (suffix === 'html') return el.innerHTML || ''
  if (suffix === 'href') return el.getAttribute('href') || ''
  if (suffix === 'src') return el.getAttribute('src') || ''
  
  return el.textContent?.trim() || ''
}

/**
 * ==================== JSONPath ====================
 */

function jsonSelect(html, jsonPath) {
  try {
    const data = typeof html === 'string' ? JSON.parse(html) : html
    const results = []
    const entries = jsonPathToEntries(jsonPath)
    
    function traverse(obj, path) {
      if (path.length === 0) {
        results.push(obj)
        return
      }
      
      const [key, ...rest] = path
      
      if (key === '*') {
        if (Array.isArray(obj)) {
          obj.forEach(item => traverse(item, rest))
        } else if (obj && typeof obj === 'object') {
          Object.values(obj).forEach(item => traverse(item, rest))
        }
      } else if (key.match(/^\d+$/)) {
        if (Array.isArray(obj) && obj[key]) {
          traverse(obj[key], rest)
        }
      } else if (obj && obj[key] !== undefined) {
        traverse(obj[key], rest)
      }
    }
    
    traverse(data, entries)
    return results
  } catch (e) {
    console.warn('JSONPath 解析失败:', e)
    return []
  }
}

function jsonExtract(element, jsonPath, baseUrl) {
  const text = typeof element === 'string' ? element : element.textContent?.trim() || ''
  
  try {
    const data = JSON.parse(text)
    const entries = jsonPathToEntries(jsonPath.replace(/^\$\.?/, ''))
    
    let current = data
    for (const key of entries) {
      if (current === undefined || current === null) return ''
      
      if (key === '*') {
        if (Array.isArray(current)) {
          return current.map(item => JSON.stringify(item)).join('\n')
        }
        return ''
      }
      
      const idxMatch = key.match(/^(\w+)\[(\d+)\]$/)
      if (idxMatch) {
        current = current[idxMatch[1]]?.[parseInt(idxMatch[2])]
      } else {
        current = current[key]
      }
    }
    
    if (typeof current === 'object') {
      return JSON.stringify(current)
    }
    return current !== undefined ? String(current) : ''
  } catch (e) {
    return ''
  }
}

function jsonPathToEntries(path) {
  return path.replace(/\[(\d+)\]/g, '[$1]')
    .split('.')
    .filter(Boolean)
}

/**
 * ==================== XPath ====================
 */

function xpathSelect(html, xpath) {
  // 简化实现，使用 DOM + XPath
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  try {
    const result = document.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null)
    const elements = []
    let node = result.iterateNext()
    while (node) {
      elements.push(node)
      node = result.iterateNext()
    }
    return elements
  } catch (e) {
    console.warn('XPath 解析失败:', e)
    return []
  }
}

function xpathExtract(element, xpath, baseUrl) {
  try {
    const doc = element.ownerDocument || (new DOMParser()).parseFromString(element, 'text/html')
    const result = doc.evaluate(xpath, doc, null, XPathResult.STRING_TYPE, null)
    return result.stringValue
  } catch (e) {
    return ''
  }
}

/**
 * ==================== 正则 ====================
 */

function regexAllInOne(html, pattern, baseUrl) {
  try {
    const regex = new RegExp(pattern, 'g')
    const results = []
    let match
    while ((match = regex.exec(html)) !== null) {
      results.push(match[1] || match[0])
    }
    return results
  } catch (e) {
    return []
  }
}

/**
 * ==================== JavaScript ====================
 */

/**
 * 创建 JS 执行环境
 */
function createJsEnv(source, key, page = 1) {
  return {
    source: source,
    key: key || '',
    page: page,
    baseUrl: source.bookSourceUrl || '',
    bookUrl: '',
    tocUrl: '',
    url: '',
    cookie: {
      get: (tag, key) => getCookie(tag, key),
      getKey: (tag) => getCookie(tag),
      set: (tag, key, value) => setCookie(tag, key, value),
      remove: (tag) => removeCookie(tag)
    },
    cache: {
      get: (key) => null,
      put: (key, value, time) => {},
      remove: (key) => {}
    },
    java: {
      ajax: (url) => fetch(url).then(r => r.text()),
      ajaxAll: (urls) => Promise.all(urls.map(url => fetch(url).then(r => r.text()))),
      get: (url, headers) => fetch(url, { headers }).then(r => r.text()),
      post: (url, body, headers) => fetch(url, { method: 'POST', body, headers }).then(r => r.text()),
      base64Decode: (str) => atob(str),
      base64Encode: (str) => btoa(str),
      md5Encode: (str) => md5(str),
      encodeURI: (str) => encodeURIComponent(str),
      htmlFormat: (str) => str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' '),
      timeFormat: (timestamp) => new Date(timestamp).toLocaleString(),
      log: (msg) => console.log('[JS]', msg),
      getCookie: (tag, key) => getCookie(tag, key),
      setCookie: (tag, key, value) => setCookie(tag, key, value),
      getElements: (rule) => {
        // 简化实现
        return []
      },
      getString: (rule) => '',
      setContent: (content, baseUrl) => content
    }
  }
}

/**
 * 执行 JS 代码
 */
function executeJs(jsCode, env) {
  const keys = Object.keys(env)
  const values = Object.values(env)
  
  try {
    const fn = new Function(...keys, jsCode)
    return fn(...values)
  } catch (e) {
    console.warn('JS 执行失败:', e.message)
    return ''
  }
}

/**
 * 处理 <js></js> 标签
 */
function executeJsTag(element, rule, baseUrl) {
  const matches = rule.matchAll(JS_TAG_PATTERN)
  let result = ''
  
  for (const match of matches) {
    const jsCode = match[1]
    const env = createJsEnvElement(element, baseUrl)
    result += executeJs(jsCode, env)
  }
  
  return result
}

/**
 * 执行 @js: 规则
 */
function executeJsRule(element, rule, baseUrl) {
  const jsMatch = rule.match(/@js:\s*(.+)$/s)
  if (!jsMatch) return ''
  
  const jsCode = jsMatch[1].trim()
  const env = createJsEnvElement(element, baseUrl)
  
  return executeJs(jsCode, env)
}

/**
 * 创建元素级 JS 环境
 */
function createJsEnvElement(element, baseUrl) {
  const src = typeof element === 'string' ? element : element.outerHTML || ''
  const text = typeof element === 'string' ? element : element.textContent?.trim() || ''
  
  return {
    result: text,
    baseUrl: baseUrl,
    src: src,
    element: element,
    doc: element.ownerDocument,
    elementList: typeof element === 'string' ? [] : Array.from(element.querySelectorAll('*')),
    java: createJsEnv({}, '').java
  }
}

/**
 * ==================== Cookie 操作 ====================
 */

export function getCookie(tag, key) {
  if (!tag) return ''
  const domain = tag.includes('://') ? new URL(tag).hostname : tag
  if (key) {
    return cookieStore[domain]?.[key] || ''
  }
  return Object.entries(cookieStore[domain] || {}).map(([k, v]) => `${k}=${v}`).join('; ')
}

export function setCookie(tag, key, value) {
  if (!tag) return
  const domain = tag.includes('://') ? new URL(tag).hostname : tag
  if (!cookieStore[domain]) cookieStore[domain] = {}
  cookieStore[domain][key] = value
}

export function removeCookie(tag) {
  if (!tag) return ''
  const domain = tag.includes('://') ? new URL(tag).hostname : tag
  delete cookieStore[domain]
  return domain
}

/**
 * ==================== URL 处理 ====================
 */

export function resolveUrl(url, baseUrl) {
  if (!url) return ''
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) {
    return url
  }
  if (!baseUrl) return url
  
  try {
    const base = new URL(baseUrl)
    if (url.startsWith('/')) {
      return base.origin + url
    } else {
      return base.origin + base.pathname.replace(/\/[^\/]*$/, '/') + url
    }
  } catch (e) {
    return url
  }
}

/**
 * ==================== 目录解析 ====================
 */

export function buildCatalogUrl(source, bookUrl) {
  const ruleToc = source.ruleToc || {}
  let tocUrl = ruleToc.chapterUrl || ''
  
  if (!tocUrl) {
    // 尝试从 ruleBookInfo 获取
    const ruleBookInfo = source.ruleBookInfo || {}
    tocUrl = ruleBookInfo.tocUrl || ''
  }
  
  if (!tocUrl) return bookUrl
  
  tocUrl = tocUrl.replace(/\{\{bookUrl\}\}/g, bookUrl)
  tocUrl = resolveUrl(tocUrl, source.bookSourceUrl)
  
  return tocUrl
}

export function parseCatalog(html, ruleToc, sourceUrl = '') {
  if (!html) return []
  
  const chapters = []
  const listRule = ruleToc?.chapterList || ruleToc?.chapterUrl || 'a'
  const nameRule = ruleToc?.chapterName || 'text'
  const urlRule = ruleToc?.chapterUrl || 'href'
  
  let elements = []
  if (listRule.startsWith(CSS_PREFIX)) {
    elements = cssSelect(html, listRule.substring(CSS_PREFIX.length))
  } else if (listRule.startsWith('$') || listRule.startsWith(JSON_PREFIX)) {
    elements = jsonSelect(html, listRule.replace(JSON_PREFIX, ''))
  } else if (listRule.startsWith(':')) {
    elements = regexAllInOne(html, listRule.substring(1), sourceUrl)
  } else {
    // JSOUP
    const parts = listRule.split('@')
    const selector = parts[0]
    const isReverse = selector.startsWith('-')
    const sel = isReverse ? selector.substring(1) : selector
    elements = jsoupSelect(html, sel)
    if (isReverse) elements.reverse()
  }
  
  elements.forEach((el, index) => {
    const title = extractRule(el, nameRule, sourceUrl)
    const url = extractRule(el, urlRule, sourceUrl)
    
    if (title) {
      chapters.push({
        title: title,
        url: resolveUrl(url, sourceUrl),
        index: index
      })
    }
  })
  
  return chapters
}

/**
 * ==================== 正文解析 ====================
 */

export function buildContentUrl(source, chapterUrl) {
  if (!chapterUrl) return ''
  return resolveUrl(chapterUrl, source.bookSourceUrl)
}

export function parseContent(html, ruleContent, sourceUrl = '') {
  if (!html) return []
  
  const contentList = []
  const contentRule = ruleContent?.content || ''
  
  let elements = []
  if (contentRule.startsWith(CSS_PREFIX)) {
    elements = cssSelect(html, contentRule.substring(CSS_PREFIX.length))
  } else if (contentRule.startsWith('$') || contentRule.startsWith(JSON_PREFIX)) {
    const result = jsonExtract(html, contentRule.replace(JSON_PREFIX, ''), sourceUrl)
    return [result]
  } else if (contentRule.includes('@js:')) {
    const result = executeJsRule(html, contentRule, sourceUrl)
    return [result]
  } else if (contentRule.startsWith(':')) {
    elements = regexAllInOne(html, contentRule.substring(1), sourceUrl)
  } else {
    elements = jsoupSelect(html, contentRule)
    if (elements.length === 0) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      elements = [doc.body]
    }
  }
  
  elements.forEach(el => {
    let text = el.textContent || ''
    text = text.replace(/\s+/g, ' ').trim()
    
    // 应用净化规则
    if (ruleContent?.replaceRegex) {
      const regex = new RegExp(ruleContent.replaceRegex, 'g')
      text = text.replace(regex, '')
    }
    
    if (text) contentList.push(text)
  })
  
  return contentList
}

/**
 * ==================== 书籍详情 ====================
 */

export function parseBookInfo(html, ruleBookInfo, sourceUrl = '') {
  if (!html) return {}
  
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  
  return {
    name: extractRule(doc, ruleBookInfo?.name || '', sourceUrl),
    author: extractRule(doc, ruleBookInfo?.author || '', sourceUrl),
    coverUrl: extractRule(doc, ruleBookInfo?.coverUrl || ruleBookInfo?.cover || '', sourceUrl),
    intro: extractRule(doc, ruleBookInfo?.intro || ruleBookInfo?.description || '', sourceUrl),
    kind: extractRule(doc, ruleBookInfo?.kind || ruleBookInfo?.category || '', sourceUrl),
    wordCount: extractRule(doc, ruleBookInfo?.wordCount || '', sourceUrl),
    lastChapter: extractRule(doc, ruleBookInfo?.lastChapter || ruleBookInfo?.lastChapterName || '', sourceUrl),
    tocUrl: extractRule(doc, ruleBookInfo?.tocUrl || '', sourceUrl),
  }
}

/**
 * ==================== 发现页 ====================
 */

export function parseExplore(html, ruleExplore, sourceUrl = '') {
  if (!html || !ruleExplore) return []
  
  const results = []
  const bookListRule = ruleExplore.bookList || ruleExplore.url || ''
  
  let elements = []
  if (bookListRule.startsWith(CSS_PREFIX)) {
    elements = cssSelect(html, bookListRule.substring(CSS_PREFIX.length))
  } else if (bookListRule.startsWith('$') || bookListRule.startsWith(JSON_PREFIX)) {
    elements = jsonSelect(html, bookListRule.replace(JSON_PREFIX, ''))
  } else {
    elements = jsoupSelect(html, bookListRule)
  }
  
  elements.forEach(el => {
    const book = {
      bookName: extractRule(el, ruleExplore.name, sourceUrl),
      author: extractRule(el, ruleExplore.author, sourceUrl),
      bookUrl: extractRule(el, ruleExplore.bookUrl || ruleExplore.url, sourceUrl),
      coverUrl: extractRule(el, ruleExplore.coverUrl, sourceUrl),
      intro: extractRule(el, ruleExplore.intro, sourceUrl),
      kind: extractRule(el, ruleExplore.kind, sourceUrl),
    }
    
    if (book.bookName || book.bookUrl) {
      book.bookUrl = resolveUrl(book.bookUrl || '', sourceUrl)
      book.coverUrl = resolveUrl(book.coverUrl || '', sourceUrl)
      results.push(book)
    }
  })
  
  return results
}

/**
 * ==================== 辅助函数 ====================
 */

function extractZipRule(element, rules, baseUrl) {
  const results = []
  const elements = []
  
  rules.forEach(rule => {
    const result = extractSingleRule(element, rule.trim(), baseUrl)
    results.push(result)
  })
  
  return results.join('')
}

// 简单 MD5 实现（仅供演示）
function md5(string) {
  // 简化版，实际使用需要完整实现
  let hash = 0
  for (let i = 0; i < string.length; i++) {
    const char = string.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

export default {
  buildSearchUrl,
  parseHeader,
  parseSearchResult,
  parseCatalog,
  parseContent,
  parseBookInfo,
  parseExplore,
  buildCatalogUrl,
  buildContentUrl,
  resolveUrl,
  getCookie,
  setCookie,
  removeCookie,
  extractRule
}
