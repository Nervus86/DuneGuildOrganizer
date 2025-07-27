import mongoose from 'mongoose';

const resourceValueSchema = new mongoose.Schema({
  guild: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // si assume che chi crea la gilda sia un utente admin
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceType', required: true },
  value: { type: Number, required: true },
  effectiveFrom: { type: Date, default: Date.now }
});

resourceValueSchema.index({ guild: 1, resource: 1, effectiveFrom: -1 }); // per velocizzare lookup

export default mongoose.model('ResourceValue', resourceValueSchema);
