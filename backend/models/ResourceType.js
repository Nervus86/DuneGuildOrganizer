import mongoose from 'mongoose';

const craftedInputSchema = new mongoose.Schema({
   type: {
    type: String,
    required: false,
    enum: ['small', 'medium', 'large'], // vincolo enum
  },
  resources: [
    {
      resource: { type: mongoose.Schema.Types.ObjectId, ref: 'ResourceType', required: true },
      amountPerUnit: { type: Number, required: true } // quante unità di questa risorsa servono
    }
  ],
  result: { type: Number, required: true } // quante unità prodotte con questi input
});

const resourceTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  unit: { type: String, default: '' },
  isCrafted: { type: Boolean, default: false },

  // array di configurazioni crafting (es. medium, large...)
  inputs: [craftedInputSchema]
});

export default mongoose.model('ResourceType', resourceTypeSchema);
