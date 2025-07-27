export function calculateDistribution({
  rawInputs,
  craftedResource,
  exchangeRatio,
  numPlayers
}) {
  const totalCraftable = craftedResource.inputs.map(input => {
    const available = rawInputs[input.resource.toString()] || 0;
    return Math.floor(available / input.amountPerUnit);
  });

  const totalCrafted = Math.min(...totalCraftable);
  const totalDistributable = Math.floor(totalCrafted / exchangeRatio);
  const distributedPerPlayer = Math.floor(totalDistributable / numPlayers);
  const totalDistributed = distributedPerPlayer * numPlayers;
  const retainedByGuild = totalCrafted - (totalDistributed * exchangeRatio);

  const rawUsed = {};
  for (const input of craftedResource.inputs) {
    rawUsed[input.resource.toString()] = totalDistributed * exchangeRatio * input.amountPerUnit;
  }

  const rawLeft = {};
  for (const input of craftedResource.inputs) {
    const available = rawInputs[input.resource.toString()] || 0;
    rawLeft[input.resource.toString()] = available - (rawUsed[input.resource.toString()] || 0);
  }

  return {
    craftedId: craftedResource._id,
    totalCrafted,
    totalDistributable,
    distributedPerPlayer,
    totalDistributed,
    retainedByGuild,
    rawUsed,
    rawLeft
  };
}
