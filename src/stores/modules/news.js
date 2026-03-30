import { defineStore } from "pinia";

export const useNewsStore = defineStore("news", {
  state: () => ({
    subscriptions: [],
  }),
  
  actions: {
    addSubscription(source) {
      if (!this.subscriptions.find(s => s.id === source.id)) {
        this.subscriptions.push({ ...source })
      }
    },
    
    removeSubscription(sourceId) {
      const index = this.subscriptions.findIndex(s => s.id === sourceId)
      if (index > -1) {
        this.subscriptions.splice(index, 1)
      }
    },
    
    updateSubscriptions(newSubscriptions) {
      this.subscriptions = newSubscriptions
    },
    
    isSubscribed(sourceId) {
      return this.subscriptions.some(s => s.id === sourceId)
    }
  },
  
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        paths: ['subscriptions'],
      },
    ],
  },
})
