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
        fontSize: 18,
        lineHeight: 28,
        bgTheme: '#f5f5f5',
        bgOpacity: 100,
        textColor: '#333333'
      }
    }
  },
  getters: {
    sortedBooks: (state) => {
      return [...state.books].sort((a, b) => {
        const timeA = state.readingHistory[a.filePath]?.lastReadTime || 0
        const timeB = state.readingHistory[b.filePath]?.lastReadTime || 0
        return timeB - timeA
      })
    },
    currentChapter: (state) => state.chapterList[state.currentChapterIndex]
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
          console.log('this.chapterList: ', this.chapterList);
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
    
    updateReadTime(filePath) {
      this.readingHistory[filePath] = {
        ...this.readingHistory[filePath],
        lastReadTime: Date.now()
      }
    },
    
    setCurrentChapterIndex(index) {
      this.currentChapterIndex = index
    },
    
    updateReaderSettings(settings) {
      this.readerSettings = { ...this.readerSettings, ...settings }
    },
    
    saveSettingsToStorage() {
      try {
        localStorage.setItem('bookReaderSettings', JSON.stringify(this.readerSettings))
        localStorage.setItem('bookReadingHistory', JSON.stringify(this.readingHistory))
      } catch (e) {
        console.error('保存设置失败:', e)
      }
    },
    
    loadSettingsFromStorage() {
      try {
        const settings = localStorage.getItem('bookReaderSettings')
        if (settings) {
          this.readerSettings = JSON.parse(settings)
        }
        const history = localStorage.getItem('bookReadingHistory')
        if (history) {
          this.readingHistory = JSON.parse(history)
        }
      } catch (e) {
        console.error('加载设置失败:', e)
      }
    }
  }
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
