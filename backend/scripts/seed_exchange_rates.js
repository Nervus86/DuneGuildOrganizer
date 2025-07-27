import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ResourceType from '../models/ResourceType.js';
import ExchangeRate from '../models/ExchangeRate.js';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

// ⚠️ Inserisci qui l'ID dell'admin o della gilda
const guildId = '6883b89a79a639063a789221'; // <-- sostituisci con ObjectId valido

// Recupera le risorse dal DB
const water = await ResourceType.findOne({ name: 'Water' });
const time = await ResourceType.findOne({ name: 'Time' });
const ore = await ResourceType.findOne({ name: 'Aluminum Ore' });
const jasmium = await ResourceType.findOne({ name: 'Jasmium Crystal' });
const alu_ingot = await ResourceType.findOne({ name: 'Aluminum Ingot' });
const dura_ingot = await ResourceType.findOne({ name: 'Duraluminum Ingot' });
if (!alu_ingot || !dura_ingot || !water || !time || !jasmium || !ore) {
  console.error('⚠️ Risorse mancanti:');
  if (!alu_ingot) console.error('❌ alu_ingot non trovata');
  if (!dura_ingot) console.error('❌ dura_ingot non trovata');
  if (!water) console.error('❌ water non trovata');
  if (!time) console.error('❌ time non trovata');
  if (!jasmium) console.error('❌ jasmium non trovata');
  if (!ore) console.error('❌ ore non trovata');
  process.exit(1);
}

// Inserisci i tassi di scambio (es: 1 ogni 5 prodotti)
await ExchangeRate.deleteMany({ guild: guildId }); // opzionale: pulizia

const rates = await ExchangeRate.insertMany([
  {
    guild: guildId,
    resource: alu_ingot._id,
    resources: [
      {
        type: 'large',
        resources: [
          { name:"Water", resource: water._id, ratio: 1 },
          { name:"Time", resource: time._id, ratio: 1 },
          { name:"Aluminum Ore", resource: ore._id, ratio: 1.75 }
        ]
      },
      {
        type: 'medium',
        resources: [
          { name:"Water", resource: water._id, ratio: 1 },
          { name:"Time", resource: time._id, ratio: 1 },
          { name:"Aluminum Ore", resource: ore._id, ratio: 1 }
        ]
      },
    ]
  },
  {
    guild: guildId,
    resource: dura_ingot._id,
    resources: [
      {
        type: 'large',
        resources: [
          { name:"Water", resource: water._id, ratio: 1 },
          { name:"Time", resource: time._id, ratio: 1 },
          { name:"Jasmium Crystal", resource: jasmium._id, ratio: 1.33 },
          { name:"Aluminum Ingot", resource: alu_ingot._id, ratio: 1 }
        ]
      },
      {
        type: 'medium',
        resources: [
          { name:"Water", resource: water._id, ratio: 1 },
          { name:"Time", resource: time._id, ratio: 1 },
          { name:"Jasmium Crystal", resource: jasmium._id, ratio: 1 },
          { name:"Aluminum Ingot", resource: alu_ingot._id, ratio: 1 }
        ]
      },
    ]
  },

]);

console.log('Tassi di scambio inseriti:', rates);
process.exit();
