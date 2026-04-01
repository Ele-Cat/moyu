/**
 * 书源辅助工具函数
 * Cookie 管理、URL 处理等
 */

const cookieStore = {}

export function getCookie(tag, key) {
  const tagStore = cookieStore[tag] || {}
  return tagStore[key] || null
}

export function setCookie(tag, key, value) {
  if (!cookieStore[tag]) {
    cookieStore[tag] = {}
  }
  cookieStore[tag][key] = value
}

export function removeCookie(tag, key = null) {
  if (key) {
    delete cookieStore[tag]?.[key]
  } else {
    delete cookieStore[tag]
  }
}

export function resolveUrl(url, baseUrl) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  if (url.startsWith('//')) {
    return window.location.protocol + url
  }
  if (url.startsWith('/')) {
    try {
      const base = new URL(baseUrl || window.location.origin)
      return base.origin + url
    } catch (e) {
      return url
    }
  }
  if (baseUrl) {
    const base = baseUrl.replace(/\/[^\/]*$/, '')
    return base + '/' + url
  }
  return url
}

function parseHtml(html) {
  const parser = new DOMParser()
  return parser.parseFromString(html, 'text/html')
}

export function parseSearchResult(content, ruleSearch, sourceUrl = '') {
  if (!content || !ruleSearch) return []

  const results = []
  let bookListRule = ruleSearch.bookList || ''

  let isJson = false
  let jsonData = null
  
  const trimmed = content.trim()
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      jsonData = JSON.parse(content)
      isJson = true
    } catch (e) {}
  }

  let elements = []
  
  if (isJson) {
    if (bookListRule.startsWith('$')) {
      const jsonPath = bookListRule.replace(/^\$\.?/, '')
      elements = jsonSelect(jsonData, jsonPath)
    } else if (bookListRule.startsWith('@json:')) {
      const jsonPath = bookListRule.substring(6)
      elements = jsonSelect(jsonData, jsonPath)
    } else {
      elements = jsonSelect(jsonData, bookListRule || '$')
    }
  } else {
    if (bookListRule.startsWith('@css:')) {
      const selector = bookListRule.substring(5)
      const doc = parseHtml(content)
      elements = Array.from(doc.querySelectorAll(selector))
    } else if (bookListRule.startsWith('@xpath:')) {
      const xpath = bookListRule.substring(7)
      const doc = parseHtml(content)
      const result = doc.evaluate(xpath, doc.body, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
      elements = []
      for (let i = 0; i < result.snapshotLength; i++) {
        elements.push(result.snapshotItem(i))
      }
    } else if (bookListRule.startsWith('$')) {
      const jsonPath = bookListRule.replace(/^\$\.?/, '')
      try {
        const match = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
        if (match) {
          const json = JSON.parse(match[1])
          elements = jsonSelect(json, jsonPath)
        }
      } catch (e) {}
    } else if (bookListRule.startsWith(':')) {
      const regex = new RegExp(bookListRule.substring(1), 'g')
      const matches = content.match(regex)
      elements = matches ? matches.map(m => ({ textContent: m, outerHTML: m })) : []
    } else {
      const doc = parseHtml(content)
      elements = Array.from(doc.querySelectorAll(bookListRule || 'a'))
    }
  }

  elements.forEach(el => {
    const book = {
      bookName: extractSingleRule(el, ruleSearch.name, sourceUrl),
      author: extractSingleRule(el, ruleSearch.author, sourceUrl),
      bookUrl: extractSingleRule(el, ruleSearch.bookUrl, sourceUrl),
      coverUrl: extractSingleRule(el, ruleSearch.coverUrl, sourceUrl),
      intro: extractSingleRule(el, ruleSearch.intro, sourceUrl),
      kind: extractSingleRule(el, ruleSearch.kind, sourceUrl),
      wordCount: extractSingleRule(el, ruleSearch.wordCount, sourceUrl),
      lastChapter: extractSingleRule(el, ruleSearch.lastChapter || ruleSearch.latestChapter, sourceUrl),
    }

    if (book.bookName) {
      book.bookUrl = resolveUrl(book.bookUrl || '', sourceUrl)
      book.coverUrl = resolveUrl(book.coverUrl || '', sourceUrl)
      results.push(book)
    }
  })

  return results
}

function jsonSelect(data, path) {
  if (!path) return Array.isArray(data) ? data : [data]
  
  const results = []
  const cleanPath = path.replace(/^\$\.?/, '')
  const keys = cleanPath.split('.')
  
  function traverse(obj, keyPath) {
    if (keyPath.length === 0) {
      results.push(obj)
      return
    }
    
    const [key, ...rest] = keyPath
    
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
  
  traverse(data, keys)
  return results
}

export function parseHeader(headerStr) {
  const headers = {}
  if (!headerStr) return headers
  
  const lines = headerStr.split('\n')
  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim()
      const value = line.substring(colonIndex + 1).trim()
      if (key && value) {
        headers[key] = value
      }
    }
  }
  return headers
}

export function buildSearchUrl(source, keyword, page = 1) {
  let url = source.searchUrl || ''
  let body = null
  let method = 'GET'
  let headers = parseHeader(source.header)
  
  url = url.replace(/\{\{key\}\}/g, encodeURIComponent(keyword))
  url = url.replace(/\{\{key2\}\}/g, keyword)
  url = url.replace(/\{\{page\}\}/g, String(page))
  url = url.replace(/\{\{pageNumber\}\}/g, String(page))
  url = url.replace(/\{\{page\.(\d+)\}\}/g, (_, n) => String(page + parseInt(n) - 1))
  
  url = resolveUrl(url, source.bookSourceUrl)
  
  return { url, method, headers, body }
}

export function buildCatalogUrl(source, bookUrl) {
  let url = bookUrl
  if (!url.startsWith('http')) {
    url = resolveUrl(url, source.bookSourceUrl)
  }
  return { url, method: 'GET', headers: parseHeader(source.header), body: null }
}

export function parseCatalog(html, ruleToc, sourceUrl = '') {
  if (!html || !ruleToc) return []
  
  const chapters = []
  let ruleList = ruleToc.bookUrl
  
  let elements = []
  if (ruleList.startsWith('@css:')) {
    const selector = ruleList.substring(5)
    const doc = parseHtml(html)
    elements = Array.from(doc.querySelectorAll(selector))
  } else {
    const doc = parseHtml(html)
    elements = Array.from(doc.querySelectorAll(ruleList || 'a'))
  }
  
  elements.forEach(el => {
    const title = el.textContent?.trim() || ''
    const url = el.getAttribute('href') || ''
    
    if (title && url) {
      chapters.push({
        title,
        url: resolveUrl(url, sourceUrl)
      })
    }
  })
  
  return chapters
}

export function buildContentUrl(source, chapterUrl) {
  let url = chapterUrl
  if (!url.startsWith('http')) {
    url = resolveUrl(url, source.bookSourceUrl)
  }
  return { url, method: 'GET', headers: parseHeader(source.header), body: null }
}

export function parseContent(html, ruleContent, sourceUrl = '') {
  if (!html || !ruleContent) return ''
  
  const rule = ruleContent.content || ruleContent
  let content = ''
  
  if (rule.startsWith('@css:')) {
    const selector = rule.substring(5)
    const doc = parseHtml(html)
    const el = doc.querySelector(selector)
    content = el?.textContent?.trim() || ''
  } else if (rule.startsWith('@xpath:')) {
    const xpath = rule.substring(7)
    const doc = parseHtml(html)
    const result = doc.evaluate(xpath, doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    content = result.singleNodeValue?.textContent?.trim() || ''
  } else if (rule.startsWith('$')) {
    const jsonPath = rule.replace(/^\$\.?/, '')
    try {
      const data = JSON.parse(html)
      content = getJsonPath(data, jsonPath)
    } catch (e) {}
  } else {
    const doc = parseHtml(html)
    const el = doc.querySelector(rule)
    content = el?.textContent?.trim() || ''
  }
  
  return content.replace(/\s+/g, ' ').trim()
}

function getJsonPath(data, path) {
  const keys = path.split('.')
  let current = data
  for (const key of keys) {
    if (current === undefined || current === null) return ''
    if (key === '*') {
      if (Array.isArray(current)) {
        return current.map(c => c?.text || c?.content || '').join('\n')
      }
      return ''
    }
    current = current[key]
  }
  return typeof current === 'string' ? current : JSON.stringify(current)
}

export function parseBookInfo(html, ruleBookInfo, sourceUrl = '') {
  if (!html || !ruleBookInfo) return {}
  
  return {
    coverUrl: resolveUrl(extractRule(html, ruleBookInfo.coverUrl, sourceUrl), sourceUrl),
    author: extractRule(html, ruleBookInfo.author, sourceUrl),
    intro: extractRule(html, ruleBookInfo.intro, sourceUrl),
    wordCount: extractRule(html, ruleBookInfo.wordCount, sourceUrl),
    lastChapter: extractRule(html, ruleBookInfo.lastChapter, sourceUrl)
  }
}

function extractRule(element, rule, baseUrl = '') {
  if (!rule) return ''
  
  if (rule.includes('||')) {
    const parts = rule.split('||')
    for (const part of parts) {
      const result = extractSingleRule(element, part.trim(), baseUrl)
      if (result) return result
    }
    return ''
  }
  
  return extractSingleRule(element, rule, baseUrl)
}

function extractSingleRule(element, rule, baseUrl) {
  if (!rule) return ''
  
  if (rule.startsWith('@css:')) {
    const selector = rule.substring(5)
    const doc = parseHtml(typeof element === 'string' ? element : element.outerHTML)
    const el = doc.querySelector(selector)
    return el?.textContent?.trim() || ''
  }
  
  if (rule.startsWith('@xpath:')) {
    const xpath = rule.substring(7)
    const doc = parseHtml(typeof element === 'string' ? element : element.outerHTML)
    const result = doc.evaluate(xpath, doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return result.singleNodeValue?.textContent?.trim() || ''
  }
  
  if (rule.startsWith('$')) {
    try {
      const jsonPath = rule.replace(/^\$\.?/, '')
      const data = JSON.parse(typeof element === 'string' ? element : element.outerHTML)
      return getJsonPath(data, jsonPath)
    } catch (e) {
      return ''
    }
  }
  
  if (rule.startsWith(':')) {
    const regex = new RegExp(rule.substring(1))
    const text = typeof element === 'string' ? element : element.textContent || ''
    const match = text.match(regex)
    return match ? (match[1] || match[0]) : ''
  }
  
  const doc = parseHtml(typeof element === 'string' ? element : element.outerHTML)
  const el = doc.querySelector(rule)
  return el?.textContent?.trim() || ''
}

export function parseExplore(html, ruleExplore, sourceUrl = '') {
  if (!html || !ruleExplore) return []
  
  const books = []
  const ruleList = ruleExplore.bookList || ''
  
  let elements = []
  if (ruleList.startsWith('@css:')) {
    const selector = ruleList.substring(5)
    const doc = parseHtml(html)
    elements = Array.from(doc.querySelectorAll(selector))
  } else {
    const doc = parseHtml(html)
    elements = Array.from(doc.querySelectorAll(ruleList || '.book-item, .novel-item, a'))
  }
  
  elements.forEach(el => {
    const book = {
      bookName: el.querySelector('.title, .book-title, .name')?.textContent?.trim() || '',
      bookUrl: el.querySelector('a')?.getAttribute('href') || '',
      coverUrl: el.querySelector('img')?.getAttribute('src') || '',
      author: el.querySelector('.author, .book-author')?.textContent?.trim() || ''
    }
    
    if (book.bookName) {
      book.bookUrl = resolveUrl(book.bookUrl, sourceUrl)
      book.coverUrl = resolveUrl(book.coverUrl, sourceUrl)
      books.push(book)
    }
  })
  
  return books
}