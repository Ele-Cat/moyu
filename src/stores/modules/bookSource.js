import { defineStore } from "pinia";
import { load } from "@tauri-apps/plugin-store";

let store = null;
let storePromise = null;

async function getStore() {
  if (store) return store;
  if (storePromise) return storePromise;
  
  storePromise = load("bookSource.json", { autoSave: false })
    .then(s => {
      store = s;
      return s;
    })
    .catch(e => {
      console.error("加载store失败:", e);
      storePromise = null;
      throw e;
    });
  
  return storePromise;
}

export const useBookSourceStore = defineStore("bookSource", {
  state: () => ({
    sources: [],
    currentSource: null,
    searchHistory: [],
    bookshelf: [],
    loaded: false,
    saving: false,
  }),
  getters: {
    getEnabledSources: (state) => state.sources.filter((s) => s.enabled !== false),
    getSourceByUrl: (state) => (url) =>
      state.sources.find((s) => s.bookSourceUrl === url),
  },
  actions: {
    async init() {
      if (this.loaded) return;
      try {
        const s = await getStore();
        const sources = await s.get("sources");
        const currentSource = await s.get("currentSource");
        const searchHistory = await s.get("searchHistory");
        const bookshelf = await s.get("bookshelf");

        if (sources) this.sources = sources;
        if (currentSource) this.currentSource = currentSource;
        if (searchHistory) this.searchHistory = searchHistory;
        if (bookshelf) this.bookshelf = bookshelf;

        this.loaded = true;
      } catch (e) {
        console.error("初始化书源存储失败:", e);
        this.loaded = true;
      }
    },

    async save() {
      if (this.saving) return;
      this.saving = true;
      try {
        const s = await getStore();
        await s.set("sources", this.sources);
        await s.set("currentSource", this.currentSource);
        await s.set("searchHistory", this.searchHistory);
        await s.set("bookshelf", this.bookshelf);
        await s.save();
      } catch (e) {
        console.error("保存书源失败:", e);
      } finally {
        this.saving = false;
      }
    },

    addSource(source) {
      const exists = this.sources.some(
        (s) => s.bookSourceUrl === source.bookSourceUrl
      );
      if (!exists) {
        this.sources.push({ ...source, enabled: true });
      }
    },

    async addSources(sourceList) {
      const newSources = [];
      for (const source of sourceList) {
        const exists = this.sources.some(
          (s) => s.bookSourceUrl === source.bookSourceUrl
        );
        if (!exists) {
          newSources.push({ ...source, enabled: true });
        }
      }
      if (newSources.length > 0) {
        this.sources.push(...newSources);
        await this.save();
      }
    },

    removeSource(url) {
      this.sources = this.sources.filter((s) => s.bookSourceUrl !== url);
      if (this.currentSource?.bookSourceUrl === url) {
        this.currentSource = null;
      }
      this.save();
    },

    toggleSource(url) {
      const source = this.sources.find((s) => s.bookSourceUrl === url);
      if (source) {
        source.enabled = !source.enabled;
        this.save();
      }
    },

    setCurrentSource(source) {
      this.currentSource = source;
      this.save();
    },

    addSearchHistory(keyword) {
      if (!keyword.trim()) return;
      this.searchHistory = this.searchHistory.filter((k) => k !== keyword);
      this.searchHistory.unshift(keyword);
      if (this.searchHistory.length > 20) {
        this.searchHistory.pop();
      }
      this.save();
    },

    clearSearchHistory() {
      this.searchHistory = [];
      this.save();
    },

    addToBookshelf(book) {
      const exists = this.bookshelf.some(
        b => b.bookUrl === book.bookUrl && b.sourceUrl === book.sourceUrl
      );
      if (!exists) {
        this.bookshelf.unshift(book);
        this.save();
      }
    },

    updateBookProgress(bookUrl, progress) {
      const book = this.bookshelf.find(b => b.bookUrl === bookUrl);
      if (book) {
        book.readProgress = progress;
        this.save();
      }
    },

    exportSources() {
      return JSON.stringify(this.sources, null, 2);
    },

    async importSources(jsonStr) {
      try {
        const data = JSON.parse(jsonStr);
        if (Array.isArray(data)) {
          await this.addSources(data);
        } else if (data.bookSourceUrl) {
          this.addSource(data);
          await this.save();
        }
        return { success: true };
      } catch (e) {
        return { success: false, error: e.message };
      }
    },
  },
});
