import { defineStore } from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null,
    suggestions: [],
  }),
  actions: {
    async login(username, password) {
      const res = await axios.post('http://localhost:3000/api/auth/login', {
        username,
        password
      })

      this.token = res.data.token
      this.user = res.data.user
      localStorage.setItem('token', this.token)
      axios.defaults.headers.common.Authorization = `Bearer ${this.token}`
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      delete axios.defaults.headers.common.Authorization
    },
    async fetchUser() {
      if (!this.token) return
      axios.defaults.headers.common.Authorization = `Bearer ${this.token}`
      const res = await axios.get('http://localhost:3000/api/users/me')
      this.user = res.data
    },
    async searchGuildMembers(query) {
      if (!query || query.length < 2) {
        this.suggestions = []
        return
      }

      try {
        const res = await axios.get(`http://localhost:3000/api/users/search?query=${encodeURIComponent(query)}`)
        this.suggestions = res.data
      } catch (err) {
        console.error('Failed to fetch member suggestions:', err)
        this.suggestions = []
      }
    },
    async clearSuggestions() {
      this.suggestions = []
    }
  }
})
