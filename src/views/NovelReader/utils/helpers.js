/**
 * 书源辅助工具函数
 * Cookie 管理、URL 处理等
 */

import { extractElement } from '@/hooks/useApi'

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
    const elHtml = el.outerHTML || String(el)
    
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

export async function parseSearchResultAsync(content, ruleSearch, sourceUrl = '') {
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

  for (const el of elements) {
    const elHtml = el.outerHTML || String(el)
    
    const [bookName, author, bookUrl, coverUrl, intro, kind, wordCount, lastChapter] = await Promise.all([
      extractSingleRuleAsync(elHtml, ruleSearch.name),
      extractSingleRuleAsync(elHtml, ruleSearch.author),
      extractSingleRuleAsync(elHtml, ruleSearch.bookUrl),
      extractSingleRuleAsync(elHtml, ruleSearch.coverUrl),
      extractSingleRuleAsync(elHtml, ruleSearch.intro),
      extractSingleRuleAsync(elHtml, ruleSearch.kind),
      extractSingleRuleAsync(elHtml, ruleSearch.wordCount),
      extractSingleRuleAsync(elHtml, ruleSearch.lastChapter || ruleSearch.latestChapter),
    ])

    const book = { bookName, author, bookUrl, coverUrl, intro, kind, wordCount, lastChapter }

    if (book.bookName) {
      book.bookUrl = resolveUrl(book.bookUrl || '', sourceUrl)
      book.coverUrl = resolveUrl(book.coverUrl || '', sourceUrl)
      results.push(book)
    }
  }

  return results
}

async function extractSingleRuleAsync(elementHtml, rule, baseUrl) {
  if (!rule || !elementHtml) return ''
  
  try {
    const result = await extractElement(elementHtml, rule)
    return result || ''
  } catch (e) {
    console.error('[extractSingleRuleAsync] error:', e)
    return ''
  }
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

export function buildContentUrl(source, chapterUrl) {
  let url = chapterUrl
  if (!url.startsWith('http')) {
    url = resolveUrl(url, source.bookSourceUrl)
  }
  return { url, method: 'GET', headers: parseHeader(source.header), body: null }
}

export function parseCatalog(html, ruleToc, sourceUrl = '') {
  if (!html || !ruleToc) return []
  
  const chapters = []
  const ruleList = ruleToc.list || ruleToc.chapterList || ''
  
  let elements = []
  if (ruleList.startsWith('@css:')) {
    const selector = ruleList.substring(5)
    const doc = parseHtml(html)
    elements = Array.from(doc.querySelectorAll(selector))
  } else if (ruleList.startsWith('@xpath:')) {
    const xpath = ruleList.substring(7)
    const doc = parseHtml(html)
    const result = doc.evaluate(xpath, doc.body, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
    for (let i = 0; i < result.snapshotLength; i++) {
      elements.push(result.snapshotItem(i))
    }
  } else {
    const doc = parseHtml(html)
    elements = Array.from(doc.querySelectorAll(ruleList || 'a'))
  }
  
  const nameRule = ruleToc.name || ruleToc.chapterName || 'text'
  const urlRule = ruleToc.url || ruleToc.chapterUrl || 'href'
  
  elements.forEach(el => {
    const chapter = {
      title: extractSingleRule(el, nameRule, sourceUrl),
      url: extractSingleRule(el, urlRule, sourceUrl),
    }
    
    if (chapter.title || chapter.url) {
      chapter.url = resolveUrl(chapter.url || '', sourceUrl)
      chapters.push(chapter)
    }
  })
  
  return chapters
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
  if (!path || !data) return ''
  
  const keys = path.split('.')
  let current = data
  
  for (const key of keys) {
    if (key === '*') {
      if (Array.isArray(current)) {
        return current.map(item => typeof item === 'object' ? JSON.stringify(item) : item).join('')
      }
      return ''
    }
    if (key.match(/^\d+$/)) {
      if (Array.isArray(current)) {
        current = current[parseInt(key)]
      } else {
        return ''
      }
    } else if (current && typeof current === 'object') {
      current = current[key]
    } else {
      return ''
    }
    if (current === undefined || current === null) return ''
  }
  
  if (typeof current === 'object') {
    return JSON.stringify(current)
  }
  return String(current)
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
    const doc = parseHtml(element.outerHTML)
    const el = doc.querySelector(selector)
    return el?.textContent?.trim() || ''
  }
  
  if (rule.startsWith('@xpath:')) {
    const xpath = rule.substring(7)
    const doc = parseHtml(element.outerHTML)
    const result = doc.evaluate(xpath, doc.body, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null)
    return result.singleNodeValue?.textContent?.trim() || ''
  }
  
  if (rule.startsWith('$')) {
    try {
      const jsonPath = rule.replace(/^\$\.?/, '')
      const data = JSON.parse(element.outerHTML)
      return getJsonPath(data, jsonPath)
    } catch (e) {
      return ''
    }
  }
  
  if (rule.startsWith(':')) {
    const regex = new RegExp(rule.substring(1))
    const text = element.textContent || ''
    const match = text.match(regex)
    return match ? (match[1] || match[0]) : ''
  }
  
  const html = element.outerHTML
  const doc = parseHtml(html)
  
  const parts = rule.split('@').filter(p => p)
  let currentElement = element
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    
    if (!currentElement) return ''
    
    if (part === 'text' || part === 'textNodes') {
      return currentElement.textContent?.trim() || ''
    }
    
    if (part === 'ownText') {
      return currentElement.textContent?.replace(currentElement.innerText || '', '').trim() || ''
    }
    
    if (part === 'href' || part === 'src') {
      return currentElement.getAttribute(part) || ''
    }
    
    if (part.startsWith('data-')) {
      return currentElement.getAttribute(part) || ''
    }
    
    if (part === 'html' || part === 'all') {
      return currentElement.innerHTML?.trim() || ''
    }
    
    if (part === currentElement.tagName?.toLowerCase()) {
      continue
    }
    
    if (/^([a-zA-Z][a-zA-Z0-9]*)\.(\d+|-?\d+)$/.test(part)) {
      const match = part.match(/^([a-zA-Z][a-zA-Z0-9]*)\.(\d+|-?\d+)$/)
      const tagName = match[1]
      const idx = parseInt(match[2])
      const els = currentElement.querySelectorAll(tagName)
      if (els.length === 0) return ''
      const finalIdx = idx >= 0 ? idx : els.length + idx
      if (finalIdx < 0 || finalIdx >= els.length) return ''
      currentElement = els[finalIdx]
      continue
    }
    
    if (/^\d+$/.test(part)) {
      const idx = parseInt(part)
      const children = Array.from(currentElement.children)
      if (children.length === 0) return ''
      const finalIdx = idx >= 0 ? idx : children.length + idx
      if (finalIdx < 0 || finalIdx >= children.length) return ''
      currentElement = children[finalIdx]
      continue
    }
    
    if (part === 'children') {
      continue
    }
    
    try {
      const els = currentElement.querySelectorAll(part)
      if (els.length > 0) {
        const remainingParts = parts.slice(i + 1)
        if (remainingParts.length > 0) {
          for (const el of els) {
            const hasChild = remainingParts[0] === 'text' || remainingParts[0] === 'href' || 
                           remainingParts[0] === 'src' || remainingParts[0] === 'html' ||
                           remainingParts[0] === 'ownText' || remainingParts[0].startsWith('data-') ||
                           el.querySelector(remainingParts[0])
            if (hasChild) {
              currentElement = el
              break
            }
          }
        } else {
          currentElement = els[0]
        }
      } else {
        return ''
      }
    } catch (e) {
      return ''
    }
  }
  
  return currentElement?.textContent?.trim() || ''
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
