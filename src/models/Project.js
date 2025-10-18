const { Schema, model } = require('mongoose');

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
  },
  { timestamps: true }
);

projectSchema.index({ name: 1 });

module.exports = model('Project', projectSchema);
