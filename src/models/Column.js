const { Schema, model, Types } = require('mongoose');

const columnSchema = new Schema(
  {
    projectId: { type: Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

columnSchema.index({ projectId: 1, title: 1 }, { unique: false });

module.exports = model('Column', columnSchema);
