import { defineStore } from "pinia";

export const useReminderStore = defineStore("reminder", {
  state: () => {
    return {
      todos: [],
      historyTodos: [],
    };
  },
  getters: {
    pendingTodos: (state) => state.todos.filter(t => t.status === 'pending'),
    completedTodos: (state) => state.todos.filter(t => t.status === 'completed'),
  },
  actions: {
    addTodo(todo) {
      const newTodo = {
        ...todo,
        id: todo.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        completedAt: null,
        status: 'pending'
      }
      this.todos.push(newTodo)
    },
    
    updateTodo(id, updates) {
      const index = this.todos.findIndex(t => t.id === id)
      if (index > -1) {
        this.todos[index] = { ...this.todos[index], ...updates }
      }
    },
    
    deleteTodo(id) {
      this.todos = this.todos.filter(t => t.id !== id)
    },
    
    completeTodo(id) {
      const todoIndex = this.todos.findIndex(t => t.id === id)
      if (todoIndex > -1) {
        const todo = this.todos[todoIndex]
        todo.status = 'completed'
        todo.completedAt = new Date().toISOString()
        this.historyTodos.unshift({ ...todo })
        this.todos.splice(todoIndex, 1)
      }
    },
    
    deleteHistoryTodo(id, completedAt) {
      this.historyTodos = this.historyTodos.filter(t => 
        !(t.id === id && t.completedAt === completedAt)
      )
    },
    
    snoozeTodo(id, delayMinutes) {
      const todo = this.todos.find(t => t.id === id)
      if (todo) {
        const newTime = new Date(Date.now() + delayMinutes * 60 * 1000)
        todo.scheduleTime = newTime.toISOString()
      }
    },
  },
  persist: {
    key: 'reminder',
    storage: localStorage,
    paths: ['todos', 'historyTodos'],
  },
});
