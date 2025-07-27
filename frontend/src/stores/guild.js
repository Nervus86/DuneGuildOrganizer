import { defineStore } from 'pinia'
import axios from 'axios'

export const useGuildStore = defineStore('guild', {
  state: () => ({
    members: [],
    memberCount: 0,
  }),

  actions: {
    async fetchMembers() {
      const { data } = await axios.get('http://localhost:3000/api/guilds/members/list')
      this.members = data.members
      this.memberCount = data.members.length
    },

    async fetchMemberCount() {
      const { data } = await axios.get('http://localhost:3000/api/guilds/members/count')
      this.memberCount = data.count
    },

    clear() {
      this.members = []
      this.memberCount = 0
    },

     async fetchEventCount() {
      try {
        const res = await axios.get('http://localhost:3000/api/guilds/events/count')
        this.eventCount = res.data.count
      } catch (err) {
        console.error('Failed to fetch event count:', err)
        this.eventCount = 0
      }
    },

  },
})
