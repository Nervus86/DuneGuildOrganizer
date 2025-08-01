import { defineStore } from 'pinia'
import axios from 'axios'

export const useResourceStore = defineStore('resource', {
  state: () => ({
    suggestions: [],
  }),
  actions: {
    async searchResources(query) {
      if (!query || query.length < 2) {
        this.suggestions = []
        return
      }

      try {
        const res = await axios.get(
          `http://localhost:3000/api/resources/search?query=${encodeURIComponent(query)}`
        )
        this.suggestions = res.data
      } catch (err) {
        console.error('Failed to fetch resource suggestions:', err)
        this.suggestions = []
      }
    },
    clearSuggestions() {
      this.suggestions = []
    },
    async fetchCraftedFromRaw(payload) {
      if(!payload.rawIds.length) {
        console.warn('No raw IDs provided for crafted resources fetch')
        return
      }else{
        console.log('payloads:', payload)
      }
      try {
        console.log('Fetching crafted resources with payload:', payload)
        const res = await axios.post('http://localhost:3000/api/resources/crafted-tree', payload)
        //console.log('Crafted resources fetched:', res.data)
        this.craftedSuggestions = res.data
        return res.data
      } catch (err) {
        console.error('Errore fetch crafted:', err)
        return []
      }
    },
     async fetchExchangeRates(craftedIds, type) {
      try {
        const res = await axios.post(
          'http://localhost:3000/api/resources/exchange-rates',
          { craftedIds, type },
        )

        this.exchangeRates = res.data
        console.log('Exchange rates:', res.data)
      } catch (err) {
        console.error('Errore nel fetch exchange rates:', err)
        this.exchangeRates = []
      }
    },

    clearExchangeRates() {
      this.exchangeRates = []
    }
  },
})
