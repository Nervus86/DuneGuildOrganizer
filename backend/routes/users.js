import express from 'express';
import User from '../models/User.js';
import Event from '../models/Event.js';
import ResourceType from '../models/ResourceType.js';
import { authMiddleware, requireGuildRole } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authMiddleware, async (req, res) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
        id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role
    });
});

router.get('/me/contributions', authMiddleware, async (req, res) => {
    const events = await Event.find({ participants: req.user.id })
        .populate('distributions.craftedId', 'name unit')
        .populate('resources.resource', 'name unit')
        .sort({ date: -1 });

    const result = [];
    const totals = {
        received: {}, // { resourceId: total }
        contributed: {} // { resourceId: total }
    };

    for (const event of events) {
        const entry = {
            eventId: event._id,
            eventName: event.name,
            date: event.date,
            received: [],
            contributed: []
        };

        const numPlayers = event.participants.length;

        // Calcolo ricevuto (risorse lavorate)
        for (const dist of event.distributions) {
            const amount = dist.distributedPerPlayer;
            entry.received.push({
                resource: dist.craftedId.name,
                unit: dist.craftedId.unit,
                amount
            });

            totals.received[dist.craftedId._id] = (totals.received[dist.craftedId._id] || 0) + amount;
        }

        // Calcolo versato (risorse grezze)
        for (const res of event.resources) {
            const perPlayer = Math.floor(res.quantity / numPlayers);
            entry.contributed.push({
                resource: res.resource.name,
                unit: res.resource.unit,
                amount: perPlayer
            });

            totals.contributed[res.resource._id] = (totals.contributed[res.resource._id] || 0) + perPlayer;
        }

        result.push(entry);
    }

    res.json({
        byEvent: result,
        totals
    });
});

router.get('/search', authMiddleware, requireGuildRole('leader','officer'), async (req, res) => {
    const { query } = req.query
    console.log(query)

  if (!query) return res.status(400).json({ message: 'Query required' })

  const users = await User.find({
    displayName: { $regex: new RegExp(query, 'i') },
    guild: req.user.guild,
  }).limit(10).select('displayName _id')

  console.log(users)

  res.json(users)
})

export default router;