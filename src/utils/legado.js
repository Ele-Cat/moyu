export function buildSearchUrl(source, keyword) {
  let url = source.searchUrl || ''
  
  url = url.replace(/{{key}}/g, encodeURIComponent(keyword))
  url = url.replace(/{{page}}/g, '1')
  url = url.replace(/{{pageNumber}}/g, '1')
  
  if (!url.startsWith('http')) {
    url = source.bookSourceUrl + url
  }
  
  return url
}

export function parseHeader(headerStr) {
  if (!headerStr) return {}
  try {
    return JSON.parse(headerStr)
  } catch {
    return {}
  }
}

export function parseSearchResult(html, ruleSearch, sourceUrl = '') {
  if (!html || !ruleSearch) return []
  
  const results = []
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const bookListRule = ruleSearch.bookList || ''
    console.log('bookList规则:', bookListRule)
    
    const bookElements = doc.querySelectorAll(bookListRule)
    console.log('找到书籍元素数量:', bookElements.length)
    
    if (bookElements.length === 0) {
      console.log('HTML中的ul元素:', doc.querySelectorAll('ul').length)
      console.log('HTML中的li元素:', doc.querySelectorAll('li').length)
    }
    
    bookElements.forEach(el => {
      const book = {
        bookName: extractRule(el, ruleSearch.name, sourceUrl),
        author: extractRule(el, ruleSearch.author, sourceUrl),
        bookUrl: extractRule(el, ruleSearch.bookUrl, sourceUrl),
        coverUrl: extractRule(el, ruleSearch.coverUrl, sourceUrl),
        intro: extractRule(el, ruleSearch.intro, sourceUrl),
        kind: extractRule(el, ruleSearch.kind, sourceUrl),
        wordCount: extractRule(el, ruleSearch.wordCount, sourceUrl),
        latestChapter: extractRule(el, ruleSearch.lastChapter, sourceUrl),
      }
      
      if (book.bookName) {
        if (!book.bookUrl || book.bookUrl === '') {
          const nameEl = el.querySelector('.rank_bkname a') || el.querySelector('a')
          if (nameEl) {
            book.bookUrl = nameEl.getAttribute('href') || ''
          }
        }
        
        if (book.bookUrl && !book.bookUrl.startsWith('http') && !book.bookUrl.startsWith('//')) {
          if (book.bookUrl.startsWith('/')) {
            const baseUrl = sourceUrl || ruleSearch.bookSourceUrl || ''
            book.bookUrl = baseUrl + book.bookUrl
          } else {
            book.bookUrl = sourceUrl + '/' + book.bookUrl
          }
        }
        
        if (!book.coverUrl || book.coverUrl === '') {
          const imgEl = el.querySelector('img')
          if (imgEl) {
            book.coverUrl = imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || ''
          }
        }
        
        if (book.coverUrl && !book.coverUrl.startsWith('http') && !book.coverUrl.startsWith('//')) {
          if (book.coverUrl.startsWith('/')) {
            const baseUrl = sourceUrl || ruleSearch.bookSourceUrl || ''
            book.coverUrl = baseUrl + book.coverUrl
          } else {
            book.coverUrl = sourceUrl + '/' + book.coverUrl
          }
        }
        
        if (book.bookUrl) {
          console.log('解析到书籍:', book.bookName, 'URL:', book.bookUrl)
          results.push(book)
        }
      }
    })
  } catch (e) {
    console.error('解析搜索结果失败:', e)
  }
  
  return results
}

function extractRule(el, rule, baseUrl = '') {
  if (!rule || !el) return ''
  
  if (rule.includes('@js:')) {
    const jsIndex = rule.indexOf('@js:')
    const selectorPart = rule.substring(0, jsIndex).trim()
    const jsPart = rule.substring(jsIndex)
    
    let extractedValue = ''
    
    if (selectorPart) {
      extractedValue = extractSingleRule(el, selectorPart, baseUrl)
    } else {
      extractedValue = el.textContent?.trim() || ''
    }
    
    return executeJsRuleWithValue(extractedValue, jsPart, baseUrl)
  }
  
  if (rule.includes('&&')) {
    const parts = rule.split('&&')
    let result = ''
    for (const part of parts) {
      result += extractSingleRule(el, part.trim(), baseUrl)
    }
    return result.trim()
  }
  
  return extractSingleRule(el, rule, baseUrl)
}

function executeJsRuleWithValue(inputValue, rule, baseUrl) {
  try {
    const jsMatch = rule.match(/@js:\s*(.+)$/s)
    if (!jsMatch) return inputValue
    
    const jsCode = jsMatch[1].trim()
    const result = inputValue
    
    const evalFn = new Function('result', 'baseUrl', `
      const result = result;
      const baseUrl = baseUrl;
      ${jsCode}
      return result;
    `)
    
    const output = evalFn(result, baseUrl)
    
    if (typeof output === 'string') {
      return output
    } else if (output != null) {
      return String(output)
    }
    return ''
  } catch (e) {
    console.warn('JS规则执行失败:', e)
    return inputValue
  }
}

function extractSingleRule(el, rule, baseUrl = '') {
  if (!rule || !el) return ''
  
  rule = rule.trim()
  
  if (rule.includes('@js:')) {
    return executeJsRule(el, rule)
  }
  
  let selector = rule
  let suffix = ''
  
  const jsIndex = rule.indexOf('@js:')
  if (jsIndex > 0) {
    selector = rule.substring(0, jsIndex).trim()
  } else {
    const atIndex = rule.lastIndexOf('@')
    if (atIndex > 0) {
      const possibleSuffix = rule.substring(atIndex + 1)
      if (possibleSuffix === 'text' || possibleSuffix === 'html' || 
          possibleSuffix.startsWith('-') || possibleSuffix.match(/^[a-zA-Z-]+$/)) {
        selector = rule.substring(0, atIndex).trim()
        suffix = possibleSuffix
      }
    }
  }
  
  selector = selector.trim()
  
  const pseudoMatch = selector.match(/:(nth-child|eq|first|last)\((\d+)\)/)
  let element = el
  
  if (selector && selector !== '.' && selector !== '') {
    try {
      if (pseudoMatch) {
        const pseudoType = pseudoMatch[1]
        const pseudoIndex = parseInt(pseudoMatch[2])
        
        let cleanSelector = selector.replace(pseudoMatch[0], '')
        
        if (cleanSelector) {
          const elements = Array.from(el.querySelectorAll(cleanSelector))
          if (pseudoType === 'nth-child') {
            element = elements[pseudoIndex - 1] || el
          } else if (pseudoType === 'eq') {
            element = elements[pseudoIndex] || el
          } else if (pseudoType === 'first') {
            element = elements[0] || el
          } else if (pseudoType === 'last') {
            element = elements[elements.length - 1] || el
          }
        } else {
          const elements = Array.from(el.children)
          if (pseudoType === 'nth-child') {
            element = elements[pseudoIndex - 1] || el
          } else if (pseudoType === 'eq') {
            element = elements[pseudoIndex] || el
          } else if (pseudoType === 'first') {
            element = elements[0] || el
          } else if (pseudoType === 'last') {
            element = elements[elements.length - 1] || el
          }
        }
      } else {
        const found = el.querySelector(selector)
        if (found) {
          element = found
        } else if (el.matches && el.matches(selector)) {
          element = el
        }
      }
    } catch (e) {
      console.warn('选择器解析失败:', selector, e)
    }
  }
  
  if (suffix === 'text') {
    return element.textContent?.trim() || ''
  } else if (suffix === 'html') {
    return element.innerHTML || ''
  } else if (suffix.startsWith('-')) {
    const count = parseInt(suffix.substring(1)) || 1
    if (count === 1) {
      return element.textContent?.trim() || ''
    } else {
      const texts = []
      const siblings = element.parentElement ? Array.from(element.parentElement.children) : [element]
      for (let i = 0; i < Math.min(count, siblings.length); i++) {
        texts.push(siblings[i].textContent.trim())
      }
      return texts.join('')
    }
  } else if (suffix.match(/^[a-zA-Z-]+$/)) {
    return element.getAttribute(suffix) || ''
  } else {
    return element.textContent?.trim() || ''
  }
}

function executeJsRule(el, rule) {
  try {
    const jsMatch = rule.match(/@js:\s*(.+)$/s)
    if (!jsMatch) return ''
    
    const jsCode = jsMatch[1].trim()
    
    let result = ''
    const originalElement = el
    
    const evalFn = new Function('element', 'doc', `
      const el = element;
      const result = ${jsCode};
      return result;
    `)
    
    result = evalFn(el, el.ownerSession || null)
    
    if (typeof result === 'string') {
      return result
    } else if (result != null) {
      return String(result)
    }
    return ''
  } catch (e) {
    console.warn('JS规则执行失败:', e)
    return ''
  }
}

export function buildCatalogUrl(source, bookUrl) {
  const ruleToc = source.ruleToc || {}
  const ruleBookInfo = source.ruleBookInfo || {}
  
  let tocUrl = ruleToc.chapterUrl || ruleBookInfo.tocUrl || ''
  
  if (!tocUrl) {
    return bookUrl
  }
  
  tocUrl = tocUrl.replace(/\{\{[^}]+\}\}/g, (match) => {
    if (match.includes('bookUrl')) {
      return bookUrl
    }
    return match
  })
  
  if (tocUrl && !tocUrl.startsWith('http') && !tocUrl.startsWith('//')) {
    const baseUrl = source.bookSourceUrl || ''
    if (tocUrl.startsWith('/')) {
      tocUrl = baseUrl + tocUrl
    } else {
      tocUrl = baseUrl + '/' + tocUrl
    }
  }
  
  return tocUrl
}

export function parseCatalog(html, ruleToc, sourceUrl = '') {
  if (!html) return []
  
  const chapters = []
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    let listRule = ruleToc?.chapterList || ruleToc?.chapterUrl || 'a'
    if (listRule.includes('@')) {
      listRule = listRule.split('@')[0]
    }
    
    const nameRule = ruleToc?.chapterName || 'text'
    const urlRule = ruleToc?.chapterUrl || 'href'
    
    const elements = doc.querySelectorAll(listRule)
    
    elements.forEach((el, index) => {
      let title = extractRule(el, nameRule, sourceUrl)
      let url = extractRule(el, urlRule, sourceUrl)
      
      if (url && !url.startsWith('http') && !url.startsWith('//')) {
        if (url.startsWith('/')) {
          url = sourceUrl + url
        } else {
          url = sourceUrl + '/' + url
        }
      }
      
      if (title) {
        chapters.push({
          title: title,
          url: url,
          index: index
        })
      }
    })
  } catch (e) {
    console.error('解析目录失败:', e)
  }
  
  return chapters
}

export function buildContentUrl(source, chapterUrl) {
  if (!chapterUrl) return ''
  
  if (chapterUrl.startsWith('http')) {
    return chapterUrl
  }
  
  const baseUrl = source.bookSourceUrl || ''
  if (chapterUrl.startsWith('/')) {
    return baseUrl + chapterUrl
  } else {
    return baseUrl + '/' + chapterUrl
  }
}

export function parseContent(html, ruleContent, source) {
  if (!html) return ''
  
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    let contentRule = ruleContent?.content || '#content'
    
    if (contentRule.includes('@js:')) {
      const jsMatch = contentRule.match(/@js:\s*(.+)$/s)
      if (jsMatch) {
        const jsCode = jsMatch[1].trim()
        try {
          const evalFn = new Function('doc', 'html', `return ${jsCode}`)
          const result = evalFn(doc, html)
          if (typeof result === 'string') {
            return processContent(result, ruleContent?.replaceRegex)
          }
        } catch (e) {
          console.warn('正文JS规则执行失败:', e)
        }
      }
    }
    
    let contentElement
    if (contentRule.startsWith('#') || contentRule.startsWith('.')) {
      contentElement = doc.querySelector(contentRule.split('@')[0])
    } else if (contentRule.includes('@')) {
      contentElement = doc.querySelector(contentRule.split('@')[0])
    } else {
      contentElement = doc.querySelector('#' + contentRule) || 
                       doc.querySelector('.' + contentRule) ||
                       doc.querySelector(contentRule)
    }
    
    if (!contentElement) {
      contentElement = doc.body
    }
    
    let content = contentElement?.innerHTML || ''
    
    return processContent(content, ruleContent?.replaceRegex)
  } catch (e) {
    console.error('解析正文失败:', e)
    return ''
  }
}

function processContent(content, replaceRegex) {
  if (replaceRegex) {
    const patterns = replaceRegex.split('|')
    patterns.forEach(pattern => {
      if (pattern) {
        try {
          content = content.replace(new RegExp(pattern, 'g'), '')
        } catch (e) {
          content = content.replace(pattern, '')
        }
      }
    })
  }
  
  content = content.replace(/<script[\s\S]*?<\/script>/gi, '')
  content = content.replace(/<style[\s\S]*?<\/style>/gi, '')
  
  return content
}
