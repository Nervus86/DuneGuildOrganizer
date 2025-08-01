<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import { ref, watch } from 'vue'
import FormField from '@/components/FormField.vue'
import FormControl from '@/components/FormControl.vue'
import FormCheckRadioGroup from '@/components/FormCheckRadioGroup.vue'
import TreeNode from '@/components/TreeNode.vue'
import PillTag from '@/components/PillTag.vue'
import LayoutAuthenticated from '@/layouts/LayoutAuthenticated.vue'
import SectionMain from '@/components/SectionMain.vue'
import SectionTitleLineWithButton from '@/components/SectionTitleLineWithButton.vue'
import { useUserStore } from '@/stores/user'
import { useResourceStore } from '@/stores/resource'
import { mdiAccount, mdiDiamond } from '@mdi/js'

const userStore = useUserStore()
const resourceStore = useResourceStore()

const newEvent = ref({})
const defaultNewEvent = () => ({
  members: [],
  resources: [],
  screenshot: null,
})
newEvent.value = defaultNewEvent()

const memberSearch = ref('')
const resourceSearch = ref('')
const resourceQta = ref({})
const bonusResource = ref(false)
const guildRefined = ref(false)
const RefineType = ref('large')

watch(memberSearch, async (val) => {
  if (val.length >= 2) {
    userStore.searchGuildMembers(val)
  } else {
    userStore.clearSuggestions()
  }
})

watch(resourceSearch, (newVal) => {
  if (newVal.length >= 2) {
    resourceStore.searchResources(newVal)
  } else {
    resourceStore.clearSuggestions()
  }
})

const selectResource = (resource) => {
  const exists = newEvent.value.resources.find((r) => r._id === resource._id)
  if (!exists) {
    newEvent.value.resources.push(resource)
  }
  resourceSearch.value = ''
  resourceStore.clearSuggestions()
  fetchPossibleCrafted()
}

const selectMember = (member) => {
  if (!newEvent.value.members.find((m) => m._id === member._id)) {
    newEvent.value.members.push(member)
    userStore.clearSuggestions()
  }
  memberSearch.value = ''
}

const possibleCrafted = ref([])
const nodesMap = ref({})

const buildNodesMap = (nodes) => {
  for (const n of nodes) {
    nodesMap.value[n._id] = n
    if (n.children && n.children.length) {
      buildNodesMap(n.children)
    }
  }
}

const fetchPossibleCrafted = async () => {
  console.log('Fetching possible crafted resources...')
  const rawIds = newEvent.value.resources.map((r) => r._id || r)

  try {
    const payload = {
      rawIds,
      type: RefineType.value,
    }
    console.log('payload:', payload)
    const craftedList = await resourceStore.fetchCraftedFromRaw(payload)
    if (!craftedList?.length) return
    possibleCrafted.value = craftedList
    nodesMap.value = {}
    buildNodesMap(craftedList)
    //await resourceStore.fetchExchangeRates(craftedList.map((cl=>cl._id)), RefineType.value)
    //console.log('Exchange rates:', resourceStore.exchangeRates)
  } catch (err) {
    console.error('Error fetching crafted resources:', err)
  }
}
watch(guildRefined, async (newVal) => {
  console.log('Guild refined changed:', newVal)
  if (!newVal || newVal.length === 0) return
  if (!newEvent.value.resources) return
  fetchPossibleCrafted()
})
</script>

<template>
  <LayoutAuthenticated>
    <SectionMain class="bg-white">
      <SectionTitleLineWithButton title="New Event" main />
      <FormField label="Members">
        <FormControl v-model="memberSearch" :icon="mdiAccount" placeholder="Type player name..." />
        <ul
          v-if="userStore.suggestions.length"
          class="bg-white dark:bg-gray-800 shadow rounded mt-1"
        >
          <li
            v-for="s in userStore.suggestions"
            :key="s._id"
            class="px-4 py-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
            @click="selectMember(s)"
          >
            {{ s.displayName }}
          </li>
        </ul>
        <div class="mt-2">
          Selected:
          <PillTag
            v-for="m in newEvent.members"
            :key="m._id"
            color="success"
            :label="m.displayName"
            class="ml-2 mb-2 inline-block"
          />
        </div>
      </FormField>
      <hr class="my-4" />
      <FormField label="Resource">
        <FormControl
          v-model="resourceSearch"
          :icon="mdiDiamond"
          placeholder="Type resource name..."
        />
        <ul v-if="resourceStore.suggestions.length" class="bg-white rounded shadow mt-1">
          <li
            v-for="r in resourceStore.suggestions"
            :key="r._id"
            class="px-4 py-2 hover:bg-gray-200 cursor-pointer"
            @click="selectResource(r)"
          >
            {{ r.name }}
          </li>
        </ul>
        <div class="mt-2">
          <div class="px-4 py-2 flex justify-between items-center">
            <span>Selected:</span>
          </div>
          <ul class="bg-white dark:bg-gray-800 shadow rounded mt-1">
            <li
              v-for="m in newEvent.resources"
              :key="m._id"
              color="success"
              :label="m.name"
              class="px-4 py-2 flex justify-between items-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              {{ m.name }}
              <FormControl
                v-model="resourceQta[m._id]"
                type="number"
                placeholder="qta"
                class="inline-block w-30 ml-2"
              />
            </li>
          </ul>
        </div>
      </FormField>
      <FormField label="Revenue" v-if="newEvent.resources.length > 0">
        <div class="px-4 py-2 flex justify-between items-center row">
          <span>
            <FormCheckRadioGroup
              v-model="guildRefined"
              name="buttons-switch"
              type="switch"
              :options="{
                outline: 'Guild Refined',
              }"
            />
          </span>
          <span>
            <FormCheckRadioGroup
              v-model="bonusResource"
              name="buttons-switch"
              type="switch"
              :options="{
                outline: '25% bonus',
              }"
            />
          </span>
        </div>
      </FormField>
      <div v-if="guildRefined" class="flex flex-col">
        <div class="flex flex-row">
          <span class="ml-4">Refinery type:</span>
          <FormCheckRadioGroup
            v-model="RefineType"
            name="buttons-switch"
            class="ml-4"
            type="radio"
            :options="{
              small: 'Small',
              medium: 'Medium',
              large: 'Large',
            }"
          />
        </div>
        <ul class="bg-white dark:bg-gray-800 shadow rounded mt-4 ml-4">
          <TreeNode
            v-for="node in possibleCrafted"
            :key="node._id"
            :node="node"
            :resource-qta="resourceQta"
            :members-count="newEvent.members.length"
            :nodes-map="nodesMap"
          />
        </ul>
      </div>
    </SectionMain>
  </LayoutAuthenticated>
</template>
