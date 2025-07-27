import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ResourceType from '../models/ResourceType.js';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

// Elimina risorse precedenti
await ResourceType.deleteMany({});


const water = await ResourceType.create({ name: 'Water', unit: 'ml' });
const time = await ResourceType.create({ name: 'Time', unit: 's' });
const rawMat1 = await ResourceType.create({ name: 'Aluminum Ore', unit: 'pz' });
const rawMat2 = await ResourceType.create({ name: 'Jasmium Crystal', unit: 'pz' });

const crafted1 = await ResourceType.create({
  name: 'Aluminum Ingot',
  unit: 'pz',
  isCrafted: true,
  inputs: [
    {
      type: 'large',
      resources: [
        { resource: water._id, amountPerUnit: 200 },
        { resource: time._id, amountPerUnit: 30 },
        { resource: rawMat1._id, amountPerUnit: 4 },
      ],
      result: 1
    },
    {
      type: 'medium',
      resources: [
        { resource: water._id, amountPerUnit: 200 },
        { resource: time._id, amountPerUnit: 20 },
        { resource: rawMat1._id, amountPerUnit: 7 },
      ],
      result: 1
    }
  ]
});

const crafted2 = await ResourceType.create({
  name: 'Duraluminum Ingot',
  unit: 'pz',
  isCrafted: true,
  inputs: [
    {
      type: 'medium',
      resources: [
        { resource: water._id, amountPerUnit: 650 },
        { resource: time._id, amountPerUnit: 5 },
        { resource: crafted1._id, amountPerUnit: 1 },
        { resource: rawMat2._id, amountPerUnit: 4 }
      ],
      result: 1
    },
     {
      type: 'large',
      resources: [
        { resource: water._id, amountPerUnit: 650 },
        { resource: time._id, amountPerUnit: 5 },
        { resource: crafted1._id, amountPerUnit: 1 },
        { resource: rawMat2._id, amountPerUnit: 3 }
      ],
      result: 1
    }
  ]
});

console.log('Risorse inserite:');
console.log({ water, rawMat1, rawMat2, crafted1, crafted2 });

process.exit();
