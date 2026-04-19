import { defineStore } from "pinia";
import { invoke } from '@tauri-apps/api/core'

export const useBookStore = defineStore("book", {
  state: () => {
    return {
      books: [],
      currentBook: null,
      chapterList: [],
      currentChapterIndex: 0,
      readingHistory: {},
      readerSettings: {
        window: {
          style: 'normal',
          useLastPosition: true,
          minimizeMainWindow: false,
        },
        word: {
          bounds: {
            x: null,
            y: null,
            width: 800,
            height: 600
          },
          style: {
            fontFamily: 'Microsoft YaHei',
            fontSize: 14,
            lineHeight: 1.2,
            paragraphSpacing: 8,
            textColor: '#000000',
            scrollSpeed: 30
          }
        },
        excel: {
          bounds: {
            x: null,
            y: null,
            width: 800,
            height: 600
          },
          style:{
            fontFamily: 'Microsoft YaHei',
            fontSize: 12,
            lineHeight: 1.5,
            paragraphSpacing: 8,
            bgOpacity: 100,
            bgTheme: '#f5f5f5',
            textOpacity: 100,
            textColor: '#333333',
            cellPadding: 8,
            borderColor: '#d9d9d9',
            headerBgColor: '#f0f0f0'
          }
        },
        normal: {
          bounds: {
            x: null,
            y: null,
            width: 800,
            height: 600
          },
          style: {
            fontFamily: 'Microsoft YaHei',
            fontSize: 14,
            lineHeight: 1.4,
            paragraphSpacing: 10,
            bgOpacity: 100,
            bgTheme: '#f5f5f5',
            textOpacity: 100,
            textColor: '#333333'
          },
        }
      }
    }
  },
  getters: {
    sortedBooks: (state) => {
      return [...state.books].sort((a, b) => {
        const timeA = state.readingHistory[a.bookName]?.lastReadTime || 0
        const timeB = state.readingHistory[b.bookName]?.lastReadTime || 0
        return timeB - timeA
      })
    },
    currentChapter: (state) => state.chapterList[state.currentChapterIndex],
    currentStyle: (state) => {
      const styleMode = state.readerSettings.window?.style || 'normal'
      return state.readerSettings[styleMode]?.style || state.readerSettings.normal?.style || {}
    }
  },
  actions: {
    async scanBooks(storagePath) {
      if (!storagePath) return
      
      try {
        const files = await invoke('scan_folder', {
          path: `${storagePath}/books`,
          extensions: ['txt', 'epub']
        })
        
        this.books = files.map(file => {
          const name = file.name.replace(/\.(txt|epub)$/i, '')
          const format = file.name.toLowerCase().endsWith('.epub') ? 'epub' : 'txt'
          return {
            bookName: name,
            author: '未知',
            filePath: file.path,
            format: format,
            fileSize: formatFileSize(file.size),
            coverUrl: ''
          }
        })
      } catch (e) {
        console.error('扫描书籍失败:', e)
        this.books = []
      }
    },
    
    async loadBook(book) {
      this.currentBook = book
      try {
        if (book.format === 'txt') {
          this.chapterList = await this.parseTxtBook(book.filePath)
        } else if (book.format === 'epub') {
          this.chapterList = await this.parseEpubBook(book.filePath)
        }
      } catch (e) {
        console.error('加载书籍失败:', e)
        this.chapterList = []
      }
    },
    
    async parseTxtBook(filePath) {
      const content = await invoke('read_novel_content', { path: filePath })
      const lines = content.split(/\r?\n/)
      
      const chapters = []
      let currentChapter = null
      let currentContent = []
      let chapterIndex = 0
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        
        if (isChapterTitle(line, i, lines.length, lines)) {
          if (currentChapter) {
            currentChapter.content = currentContent.join('\n')
            chapters.push(currentChapter)
          }
          chapterIndex++
          currentChapter = {
            title: cleanTitle(line),
            index: chapterIndex,
            content: ''
          }
          currentContent = []
        } else if (currentChapter) {
          currentContent.push(line)
        } else {
          if (line.length > 0) {
            currentChapter = {
              title: '前言',
              index: 0,
              content: ''
            }
          }
          if (currentChapter) {
            currentContent.push(line)
          }
        }
      }
      
      if (currentChapter) {
        currentChapter.content = currentContent.join('\n')
        chapters.push(currentChapter)
      }
      
      if (chapters.length === 0) {
        return [{
          title: '全文',
          index: 0,
          content: content.substring(0, 100000)
        }]
      }
      
      return chapters
    },
    
    async parseEpubBook(filePath) {
      try {
        const chapters = await invoke('parse_epub', { filePath })
        return chapters.map((ch, idx) => ({
          title: ch.title || `第${idx + 1}章`,
          index: idx,
          content: ch.content
        }))
      } catch (e) {
        console.error('解析EPUB失败:', e)
        return []
      }
    },
    
    async getChapterContent(chapterIndex) {
      if (!this.currentBook) return '<p>无图书</p>'
      
      try {
        let content = ''
        if (this.currentBook.format === 'txt') {
          const chapter = this.chapterList[chapterIndex]
          content = chapter?.content || ''
        } else if (this.currentBook.format === 'epub') {
          content = await invoke('get_epub_chapter', {
            filePath: this.currentBook.filePath,
            index: chapterIndex
          })
        }
        return this.formatContent(content)
      } catch (e) {
        console.error('获取章节失败:', e)
        return '<p>加载失败</p>'
      }
    },
    
    formatContent(text) {
      if (!text) return '<p>无内容</p>'
      const paragraphs = text.split(/\n+/).filter(p => p.trim())
      return paragraphs.map(p => `<p>${p.trim()}</p>`).join('')
    },
    
    updateReadTime(bookName) {
      const lastReadTime = Date.now()
      this.readingHistory[bookName]['lastReadTime'] = lastReadTime
    },

    updateReadProgress(bookName, chapterIndex = 0, scrollPosition = 0) {
      this.readingHistory[bookName] = {
        ...this.readingHistory[bookName],
        lastReadTime: Date.now(),
        chapterIndex,
        scrollPosition
      }
    },
    
    setCurrentChapterIndex(index) {
      this.currentChapterIndex = index
    },

    saveChapterProgress(scrollPosition) {
      if (this.currentBook?.bookName) {
        this.readingHistory[this.currentBook.bookName] = {
          ...this.readingHistory[this.currentBook.bookName],
          chapterIndex: this.currentChapterIndex,
          scrollPosition
        }
      }
    },

    getChapterProgress(bookName) {
      return this.readingHistory[bookName] || { chapterIndex: 0, scrollPosition: 0 }
    },
    
    updateReaderSettings(settings) {
      const currentStyle = this.readerSettings.window.style || 'normal'
      
      if (settings.windowStyle !== undefined) {
        this.readerSettings.window.style = settings.windowStyle
        currentStyle = settings.windowStyle
      }
      if (settings.useLastPosition !== undefined) {
        this.readerSettings.window.useLastPosition = settings.useLastPosition
      }
      
      if (!this.readerSettings[currentStyle]) {
        this.readerSettings[currentStyle] = {
          bounds: { x: null, y: null, width: 800, height: 600 },
          style: {}
        }
      }
      
      if (!this.readerSettings[currentStyle].style) {
        this.readerSettings[currentStyle].style = {}
      }
      
      if (settings.fontFamily !== undefined) {
        this.readerSettings[currentStyle].style.fontFamily = settings.fontFamily
      }
      if (settings.fontSize !== undefined) {
        this.readerSettings[currentStyle].style.fontSize = settings.fontSize
      }
      if (settings.lineHeight !== undefined) {
        this.readerSettings[currentStyle].style.lineHeight = settings.lineHeight
      }
      if (settings.paragraphSpacing !== undefined) {
        this.readerSettings[currentStyle].style.paragraphSpacing = settings.paragraphSpacing
      }
      if (settings.bgOpacity !== undefined) {
        this.readerSettings[currentStyle].style.bgOpacity = settings.bgOpacity
      }
      if (settings.bgTheme !== undefined) {
        this.readerSettings[currentStyle].style.bgTheme = settings.bgTheme
      }
      if (settings.textOpacity !== undefined) {
        this.readerSettings[currentStyle].style.textOpacity = settings.textOpacity
      }
      if (settings.textColor !== undefined) {
        this.readerSettings[currentStyle].style.textColor = settings.textColor
      }
      if (settings.margin !== undefined) {
        this.readerSettings[currentStyle].style.margin = settings.margin
      }
      if (settings.columnCount !== undefined) {
        this.readerSettings[currentStyle].style.columnCount = settings.columnCount
      }
      if (settings.columnGap !== undefined) {
        this.readerSettings[currentStyle].style.columnGap = settings.columnGap
      }
      if (settings.cellPadding !== undefined) {
        this.readerSettings[currentStyle].style.cellPadding = settings.cellPadding
      }
      if (settings.borderColor !== undefined) {
        this.readerSettings[currentStyle].style.borderColor = settings.borderColor
      }
      if (settings.headerBgColor !== undefined) {
        this.readerSettings[currentStyle].style.headerBgColor = settings.headerBgColor
      }
      if (settings.scrollSpeed !== undefined) {
        this.readerSettings[currentStyle].style.scrollSpeed = settings.scrollSpeed
      }
    },
    
    updateWindowBounds(bounds) {
      const currentStyle = this.readerSettings.window.style || 'normal'
      if (!this.readerSettings[currentStyle]) {
        this.readerSettings[currentStyle] = {
          bounds: { x: null, y: null, width: 800, height: 600 },
          style: {}
        }
      }
      this.readerSettings[currentStyle].bounds = {
        ...this.readerSettings[currentStyle].bounds,
        ...bounds
      }
    },
    
    getWindowBounds() {
      const currentStyle = this.readerSettings.window.style || 'normal'
      return this.readerSettings[currentStyle]?.bounds || { x: null, y: null, width: 800, height: 600 }
    },
    
    getWindowStyle() {
      return this.readerSettings.window.style || 'normal'
    },
    
    getCurrentStyle() {
      const styleMode = this.readerSettings.window?.style || 'normal'
      return this.readerSettings[styleMode]?.style || this.readerSettings.normal?.style || {}
    },
  },
  persist: {
    key: 'book',
    storage: localStorage,
    paths: ['readerSettings', 'readingHistory'],
  },
})

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(0) + ' MB'
}

function isChapterTitle(line, index, totalLines, lines) {
  const chapterPatterns = [
    /^第[一二三四五六七八九十\d]+[章卷]/,
    /^Chapter\s+\d+/i,
    /^第[0-9]+章/,
    /^卷\s*\d+/,
    /^第[0-9]+卷/,
    /^正文[：:]/,
    /^番外/,
    /^楔子/,
    /^引子/
  ]
  
  if (line.length > 2 && line.length < 50) {
    for (const pattern of chapterPatterns) {
      if (pattern.test(line)) return true
    }
  }
  
  if (index > 0 && index < totalLines - 10 && line.length > 3 && line.length < 30) {
    const prevLine = lines[index - 1] || ''
    if (prevLine.trim() === '' && /^[第卷]/.test(line)) return true
  }
  
  return false
}

function cleanTitle(line) {
  return line.replace(/^第[一二三四五六七八九十\d]+[章卷].*/, '').substring(0, 50) || line.substring(0, 50)
}
