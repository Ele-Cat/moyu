import { defineStore } from "pinia";

export const useGameStore = defineStore("game", {
  state: () => {
    return {
      mazeRecords: {},
      game2048Best: 0,
      breakoutBest: 0,
      snakeBest: 0,
      tetrisBest: 0,
      typingBest: null,
    };
  },
  getters: {
    getMazeRecord: (state) => (difficulty) => {
      return state.mazeRecords[difficulty] || null
    },
    getAllMazeRecords: (state) => {
      return state.mazeRecords
    }
  },
  actions: {
    saveMazeRecord(difficulty, time) {
      const current = this.mazeRecords[difficulty]
      if (!current || time < current) {
        this.mazeRecords[difficulty] = time
      }
    },
    save2048Score(score) {
      if (score > this.game2048Best) {
        this.game2048Best = score
      }
    },
    saveBreakoutScore(score) {
      if (score > this.breakoutBest) {
        this.breakoutBest = score
      }
    },
    saveSnakeScore(score) {
      if (score > this.snakeBest) {
        this.snakeBest = score
      }
    },
    saveTetrisScore(score) {
      if (score > this.tetrisBest) {
        this.tetrisBest = score
      }
    },
    saveTypingScore(data) {
      if (!this.typingBest || data.wpm > this.typingBest.wpm) {
        this.typingBest = data
      }
    },
    resetMazeRecords() {
      this.mazeRecords = {}
    }
  },
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        paths: ['mazeRecords', 'game2048Best', 'breakoutBest', 'snakeBest', 'tetrisBest', 'typingBest'],
      },
    ],
  },
});
