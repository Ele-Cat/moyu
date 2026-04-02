import { useMusicSourceStore } from '@/stores/modules/musicSource'

class MusicSdk {
  constructor() {
    this.sourceStore = null
  }

  init() {
    if (!this.sourceStore) {
      this.sourceStore = useMusicSourceStore()
    }
  }

  async getCurrentInstance() {
    this.init()
    const source = this.sourceStore.getCurrentSource()
    if (!source) {
      throw new Error('未选择音源')
    }

    if (source.status !== 'ready') {
      const success = await this.sourceStore.loadSource(source.id)
      if (!success) {
        throw new Error('音源加载失败')
      }
    }

    const instance = this.sourceStore.getSourceInstance(source.id)
    if (!instance) {
      throw new Error('音源实例不存在')
    }

    return instance
  }

  async search(keyword, page = 1, type = 'music') {
    try {
      const instance = await this.getCurrentInstance()
      
      if (instance.search) {
        return await instance.search(keyword, page, type)
      }

      if (instance.musicSearch) {
        return await instance.musicSearch(keyword, page)
      }

      throw new Error('音源不支持搜索功能')
    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  }

  async getMusicUrl(musicInfo, quality = '128k') {
    try {
      const instance = await this.getCurrentInstance()
      
      if (instance.getMusicUrl) {
        return await instance.getMusicUrl(musicInfo, quality)
      }

      if (instance.musicUrl) {
        return await instance.musicUrl(musicInfo, quality)
      }

      throw new Error('音源不支持获取音乐链接')
    } catch (error) {
      console.error('Get music url error:', error)
      throw error
    }
  }

  async getLyric(musicInfo) {
    try {
      const instance = await this.getCurrentInstance()
      
      if (instance.getLyric) {
        return await instance.getLyric(musicInfo)
      }

      if (instance.lyric) {
        return await instance.lyric(musicInfo)
      }

      throw new Error('音源不支持获取歌词')
    } catch (error) {
      console.error('Get lyric error:', error)
      throw error
    }
  }

  async getSongListDetail(songListInfo, page = 1) {
    try {
      const instance = await this.getCurrentInstance()
      
      if (instance.getSongListDetail) {
        return await instance.getSongListDetail(songListInfo, page)
      }

      if (instance.songListDetail) {
        return await instance.songListDetail(songListInfo, page)
      }

      throw new Error('音源不支持获取歌单详情')
    } catch (error) {
      console.error('Get song list detail error:', error)
      throw error
    }
  }

  async getLeaderboard(leaderboardInfo) {
    try {
      const instance = await this.getCurrentInstance()
      
      if (instance.getLeaderboard) {
        return await instance.getLeaderboard(leaderboardInfo)
      }

      if (instance.leaderboard) {
        return await instance.leaderboard(leaderboardInfo)
      }

      throw new Error('音源不支持获取排行榜')
    } catch (error) {
      console.error('Get leaderboard error:', error)
      throw error
    }
  }

  async getLeaderboardList() {
    try {
      const instance = await this.getCurrentInstance()
      
      if (instance.getLeaderboardList) {
        return await instance.getLeaderboardList()
      }

      if (instance.leaderboardList) {
        return await instance.leaderboardList()
      }

      throw new Error('音源不支持获取排行榜列表')
    } catch (error) {
      console.error('Get leaderboard list error:', error)
      throw error
    }
  }

  async getRecommendSongList(page = 1) {
    try {
      const instance = await this.getCurrentInstance()
      
      if (instance.getRecommendSongList) {
        return await instance.getRecommendSongList(page)
      }

      if (instance.recommendSongList) {
        return await instance.recommendSongList(page)
      }

      throw new Error('音源不支持获取推荐歌单')
    } catch (error) {
      console.error('Get recommend song list error:', error)
      throw error
    }
  }

  async getHotSearch() {
    try {
      const instance = await this.getCurrentInstance()
      
      if (instance.getHotSearch) {
        return await instance.getHotSearch()
      }

      if (instance.hotSearch) {
        return await instance.hotSearch()
      }

      return []
    } catch (error) {
      console.error('Get hot search error:', error)
      return []
    }
  }
}

export default new MusicSdk()
