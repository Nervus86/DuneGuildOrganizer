// --- backend/server.js ---
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import userRoutes from './routes/users.js';
import resourceRoutes from './routes/resources.js';
import exchangeRoutes from './routes/exchange.js';
import guildRoutes from './routes/guilds.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/guilds', guildRoutes);



mongoose.connect(process.env.MONGO_URI).then(() => {
  app.listen(3000, () => console.log('Server on http://localhost:3000'));
});
