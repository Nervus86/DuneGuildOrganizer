import express from 'express';
import ExchangeRate from '../models/ExchangeRate.js';
import ResourceType from '../models/ResourceType.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Inserisci un nuovo tasso di cambio per una risorsa
router.post('/', authMiddleware, requireRole('admin', 'organizer'), async (req, res) => {
  const { resourceId, ratio } = req.body;

  const exists = await ResourceType.findById(resourceId);
  if (!exists) return res.status(404).json({ message: 'Resource not found' });

  const rate = await ExchangeRate.create({
    guild: req.user.id,
    resource: resourceId,
    ratio
  });

  res.status(201).json(rate);
});

// Ottieni il tasso attuale per ogni risorsa della gilda
router.get('/current', authMiddleware, async (req, res) => {
  const latestRates = await ExchangeRate.aggregate([
    { $match: { guild: new mongoose.Types.ObjectId(req.user.id) } },
    { $sort: { effectiveFrom: -1 } },
    {
      $group: {
        _id: '$resource',
        ratio: { $first: '$ratio' },
        effectiveFrom: { $first: '$effectiveFrom' }
      }
    },
    {
      $lookup: {
        from: 'resourcetypes',
        localField: '_id',
        foreignField: '_id',
        as: 'resource'
      }
    },
    { $unwind: '$resource' }
  ]);

  res.json(latestRates.map(rate => ({
    resourceId: rate._id,
    name: rate.resource.name,
    unit: rate.resource.unit,
    ratio: rate.ratio,
    effectiveFrom: rate.effectiveFrom
  })));
});

// Recupera storico tassi di cambio per una risorsa
router.get('/history/:resourceId', authMiddleware, async (req, res) => {
  const resourceId = req.params.resourceId;
  const history = await ExchangeRate.find({
    guild: req.user.id,
    resource: resourceId
  }).sort({ effectiveFrom: -1 });

  res.json(history);
});

export default router;
