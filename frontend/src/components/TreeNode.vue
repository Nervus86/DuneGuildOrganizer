<template>
  <li class="px-4 py-2">
    <div class="flex justify-between items-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700">
    <span>{{ node.name }}: {{ craftableAmount }} ({{ perPlayerAmount }} per player)</span>
  </div>

    <!-- Inputs (per riferimento, ma ora il calcolo parte dalle raw) -->
    <ul
      class="ml-4 text-sm text-gray-600 dark:text-gray-400"
      v-if="node.inputs && node.inputs.length"
    >
      <li v-for="(input, index) in node.inputs" :key="index">
        {{ input.resource }} requires {{ input.amountFinal }} per craft
      </li>
    </ul>

    <!-- Recursive Children -->
    <ul
      v-if="node.children && node.children.length"
      class="bg-white dark:bg-gray-800 shadow rounded mt-2 ml-4 border-l border-gray-300 dark:border-gray-700"
    >
      <TreeNode
        v-for="child in node.children"
        :key="child._id"
        :node="child"
        :resource-qta="resourceQta"
        :members-count="membersCount"
      />
    </ul>
  </li>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  node: Object,
  resourceQta: Object, // { resourceId: qta }
  membersCount: Number
})
const calculateCraftableAmount = (node, resourceQta) => {
  if (!node.inputs || node.inputs.length === 0) {
    // Se è raw resource, ritorna la quantità disponibile
    return resourceQta[node._id] || 0
  }

  let craftableUnits = Infinity

  for (const input of node.inputs) {
    // Se è una raw resource (non ha children), usa resourceQta
    const isRaw = !node.children.find(child => child._id === input.resourceId)

    const availableAmount = isRaw
      ? (resourceQta[input.resourceId] || 0)
      : calculateCraftableAmount(node.children.find(child => child._id === input.resourceId), resourceQta)

    const possibleUnits = Math.floor(availableAmount / input.amountFinal)

    craftableUnits = Math.min(craftableUnits, possibleUnits)
  }

  return craftableUnits
}




const craftableAmount = computed(() => {
  return calculateCraftableAmount(props.node, props.resourceQta)
})

const perPlayerAmount = computed(() => {
  if (props.membersCount === 0) return 0
  return Math.floor(craftableAmount.value / props.membersCount)
})
</script>

<style scoped>
span {
  font-weight: 500;
}
</style>
