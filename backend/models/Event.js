import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  name: String,
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  resources: [{
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceType' },
    quantity: Number
  }],
  exchangeSnapshot: [{
    resource: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceType' },
    ratio: Number
  }],
  screenshot: { type: String },
  distributions: [{
    craftedId: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceType' },
    totalCrafted: Number,
    totalDistributable: Number,
    distributedPerPlayer: Number,
    totalDistributed: Number,
    retainedByGuild: Number,
    rawUsed: mongoose.Schema.Types.Mixed,
    rawLeft: mongoose.Schema.Types.Mixed
  }],
  guild: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', required: true },  
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Event', eventSchema);
