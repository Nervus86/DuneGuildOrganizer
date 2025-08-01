import express from 'express';
import ResourceType from '../models/ResourceType.js';
import ResourceValue from '../models/ResourceValue.js';
import User from '../models/User.js';
import ExchangeRate from '../models/ExchangeRate.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Crea una nuova risorsa globale
router.post('/types', authMiddleware, requireRole('admin'), async (req, res) => {
  const { name, unit } = req.body;
  try {
    const resource = await ResourceType.create({ name, unit });
    res.status(201).json(resource);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Leggi tutte le risorse globali
router.get('/types', authMiddleware, async (req, res) => {
  const types = await ResourceType.find().sort('name');
  res.json(types);
});

// Aggiungi o aggiorna valore risorsa per una gilda
router.post('/values', authMiddleware, requireRole('admin', 'organizer'), async (req, res) => {
  const { resourceId, value } = req.body;

  const resource = await ResourceType.findById(resourceId);
  if (!resource) return res.status(404).json({ message: 'Resource not found' });

  const newVal = await ResourceValue.create({
    resource: resourceId,
    guild: req.user.id,
    value
  });

  res.status(201).json(newVal);
});

// Recupera i valori attivi per una gilda
router.get('/values', authMiddleware, async (req, res) => {
  const values = await ResourceValue.aggregate([
    { $match: { guild: new mongoose.Types.ObjectId(req.user.id) } },
    { $sort: { effectiveFrom: -1 } },
    {
      $group: {
        _id: '$resource',
        resource: { $first: '$resource' },
        value: { $first: '$value' },
        effectiveFrom: { $first: '$effectiveFrom' }
      }
    },
    {
      $lookup: {
        from: 'resourcetypes',
        localField: 'resource',
        foreignField: '_id',
        as: 'resourceInfo'
      }
    },
    { $unwind: '$resourceInfo' }
  ]);

  res.json(values.map(v => ({
    resource: v.resourceInfo.name,
    unit: v.resourceInfo.unit,
    value: v.value,
    effectiveFrom: v.effectiveFrom
  })));
});


router.get('/search', authMiddleware, async (req, res) => {
  const query = req.query.query || ''
  const regex = new RegExp(query, 'i')

  try {
    const user = await User.findById(req.user.id).populate('guild')
    if (!user.guild) return res.status(400).json({ message: 'User not in a guild' })

    const guildId = user.guild._id

    const resources = await ResourceType.find({ name: { $regex: regex } }).limit(10)

    const results = await Promise.all(
      resources.map(async (resource) => {
        const latestRate = await ExchangeRate.findOne({
          guild: guildId,
          resource: resource._id,
        })
          .sort({ effectiveFrom: -1 })
          .lean()

        return {
          _id: resource._id,
          name: resource.name,
          ratio: latestRate?.ratio ?? null,
        }
      })
    )

    res.json(results)
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/crafted-tree', async (req, res) => {
  const { rawIds, type } = req.body;

  if (!rawIds || !Array.isArray(rawIds)) {
    return res.status(400).json({ message: 'Missing or invalid rawIds' });
  }

  if (!type || typeof type !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid type' });
  }

  try {
    const allResources = await ResourceType.find({}).lean();
    const craftedResources = allResources.filter(r => r.isCrafted);
    const resourceMap = new Map(allResources.map(r => [r._id.toString(), r]));

    // Build Exchange Rates Map (craftedId|inputId -> ratio)
    const exchangeRates = await ExchangeRate.find({ 'resources.type': type }).lean();
    const exchangeRateMap = new Map();
    for (const ex of exchangeRates) {
      const craftedId = ex.resource.toString();
      const typeGroup = ex.resources.find(g => g.type === type);
      if (!typeGroup) continue;
      for (const res of typeGroup.resources) {
        const inputId = res.resource.toString();
        const key = `${craftedId}|${inputId}`;
        exchangeRateMap.set(key, res.ratio);
      }
    }

    // Build Inputs array for a resource
    const buildInputs = (resource) => {
      const typeInputGroups = resource.inputs.filter(group => group.type === type);
      const inputs = [];
      for (const group of typeInputGroups) {
        for (const r of group.resources) {
          const inputResource = resourceMap.get(r.resource.toString());
          if (inputResource) {
            const rateKey = `${resource._id.toString()}|${inputResource._id.toString()}`;
            inputs.push({
              resourceId: inputResource._id.toString(),
              resource: inputResource.name,
              amountPerUnit: r.amountPerUnit,
              exchangeRate: exchangeRateMap.get(rateKey) ?? null,
              amountFinal: r.amountPerUnit * (exchangeRateMap.get(rateKey) ?? 1)
            });
          }
        }
      }
      return inputs;
    };

    // Recursive Tree Builder
    const buildTree = async (currentId, seen) => {
      const children = [];

      for (const resource of craftedResources) {
        const resourceId = resource._id.toString();
        if (seen.has(resourceId)) continue;
        const typeInputGroups = resource.inputs.filter(group => group.type === type);
        if (!typeInputGroups.length) continue;

        const usesCurrent = typeInputGroups.some(group =>
          group.resources.some(r => r.resource.toString() === currentId)
        );

        if (usesCurrent) {
          seen.add(resourceId);
          const childNode = {
            _id: resource._id,
            name: resource.name,
            inputs: buildInputs(resource),
            children: await buildTree(resourceId, seen)
          };
          children.push(childNode);
        }
      }

      return children;
    };

    const initialRawIds = rawIds.map(id => id.toString());

    // Find crafted roots that use these rawIds
    const craftedRoots = craftedResources.filter(resource =>
      resource.inputs.some(group =>
        group.type === type &&
        group.resources.some(input => initialRawIds.includes(input.resource.toString()))
      )
    );

    const result = [];
    const seen = new Set();

    for (const crafted of craftedRoots) {
      seen.add(crafted._id.toString());
      const node = {
        _id: crafted._id,
        name: crafted.name,
        inputs: buildInputs(crafted),
        children: await buildTree(crafted._id.toString(), seen)
      };
      result.push(node);
    }

    res.json(result);
  } catch (err) {
    console.error('Error during crafted-tree build:', err);
    res.status(500).json({ message: 'Server error' });
  }
});






router.post('/exchange-rates', authMiddleware, async (req, res) => {
  const { craftedIds, type } = req.body
  console.log('Exchange rates request:', { craftedIds, type })
  if (!craftedIds || !Array.isArray(craftedIds)) {
    return res.status(400).json({ message: 'Missing or invalid craftedIds' })
  }

  if (!['small', 'medium', 'large'].includes(type)) {
    return res.status(400).json({ message: 'Invalid type value' })
  }

  try {
    console.log('Searching rates for resources:', craftedIds, 'and type:', type)

    const rates = await ExchangeRate.find({
      resource: { $in: craftedIds },
      resources: { $elemMatch: { type } }
    }).lean()

    const filtered = rates.map(rate => {
      const matchingGroup = rate.resources.find(group => group.type === type)
      return matchingGroup
        ? [...matchingGroup.resources]
        : null
    }).filter(Boolean)

    res.json(filtered[0])
  } catch (err) {
    console.error('Error fetching exchange rates:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router;
