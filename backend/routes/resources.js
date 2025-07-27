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

router.post('/crafted-from', async (req, res) => {
  const { rawIds } = req.body;
  const rawIdStrings = rawIds.map(id => id.toString());

  if (!rawIds || !Array.isArray(rawIds)) {
    return res.status(400).json({ message: 'Missing or invalid rawIds' })
  }

  try {
    const craftedResources = await ResourceType.find({ isCrafted: true })

    const matched = craftedResources.filter(resource => {
      if (!resource.inputs?.length) return false;

      const found = resource.inputs.some(inputGroup => {
        if (!inputGroup.resources?.length) return false;

        return inputGroup.resources.some(r => {
          const id = r.resource?.toString?.()
          const match = rawIdStrings.includes(id.toString());
          return match;
        });
      });

      /*if (found) {
        console.log('Matched:', resource.name);
      }*/

      return found;
    });
    res.json(matched)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error' })
  }
})

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