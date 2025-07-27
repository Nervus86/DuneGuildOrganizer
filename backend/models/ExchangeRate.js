import mongoose from 'mongoose';

const exchangeRateSchema = new mongoose.Schema({
  guild: { type: mongoose.Schema.Types.ObjectId, ref: 'Guild', required: true },
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceType', required: true },

  // Per ogni tipo (es. small, medium, large), elenco delle risorse e relativi rapporti
  resources: [
    {
      type: {
        type: String,
        enum: ['small', 'medium', 'large'],
        required: true,
      },
      resources: [
        {
          resource: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceType', required: true },
          ratio: { type: Number, required: true },
        }
      ]
    }
  ],

  effectiveFrom: { type: Date, default: Date.now }
});

exchangeRateSchema.index({ guild: 1, resource: 1, effectiveFrom: -1 });

export default mongoose.model('ExchangeRate', exchangeRateSchema);
