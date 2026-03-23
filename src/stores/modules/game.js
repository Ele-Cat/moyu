import { defineStore } from "pinia";

const DIFFICULTY = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard'
}

const STORAGE_KEY = 'maze_game_records'

function loadRecords() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

export const useGameStore = defineStore("game", {
  state: () => {
    const records = loadRecords()
    return {
      mazeRecords: records,
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
        saveRecords(this.mazeRecords)
      }
    },
    resetMazeRecords() {
      this.mazeRecords = {}
      saveRecords({})
    }
  }
});
