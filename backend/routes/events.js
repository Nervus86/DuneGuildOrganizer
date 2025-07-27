import express from 'express';
import Event from '../models/Event.js';
import ExchangeRate from '../models/ExchangeRate.js';
import mongoose from 'mongoose';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import upload from '../middleware/upload.js';


const router = express.Router();

// Crea un evento
router.post('/', authMiddleware, requireRole('admin', 'organizer'), upload.single('screenshot'), // accetta file
    async (req, res) => {
        const { name, date, participants, resources } = JSON.parse(req.body.data)

        const resourceMap = {};
        for (const r of resources) {
            resourceMap[r.resource] = r.quantity;
        }

        const craftedResources = await ResourceType.find({ _id: { $in: Object.keys(resourceMap) }, isCrafted: true }).populate('inputs.resource');
        const latestRates = await ExchangeRate.find({ guild: req.user.id }).sort({ effectiveFrom: -1 });

        const exchangeSnapshot = [];
        const distributions = [];

        for (const crafted of craftedResources) {
            const exchange = latestRates.find(r => r.resource.toString() === crafted._id.toString());
            if (!exchange) continue;

            exchangeSnapshot.push({ resource: crafted._id, ratio: exchange.ratio });

            const result = calculateDistribution({
                rawInputs: resourceMap,
                craftedResource: crafted,
                exchangeRatio: exchange.ratio,
                numPlayers: participants.length
            });

            distributions.push(result);
        }
        const event = await Event.create({
            name,
            date,
            createdBy: req.user.id,
            participants,
            resources,
            exchangeSnapshot,
            distributions // <-- nuovo campo
        });

        res.status(201).json(event);
    });

// Ottieni tutti gli eventi dell’utente loggato
router.get('/', authMiddleware, async (req, res) => {
    const events = await Event.find({ createdBy: req.user.id }).populate('resources.resource participants', 'displayName username');
    res.json(events);
});

export default router;
