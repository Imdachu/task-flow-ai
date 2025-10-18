const { Schema, model, Types } = require('mongoose');

const taskSchema = new Schema(
  {
    projectId: { type: Types.ObjectId, ref: 'Project', required: true, index: true },
    columnId: { type: Types.ObjectId, ref: 'Column', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    position: { type: Number, required: true, index: true },
  },
  { timestamps: true }
);

taskSchema.index({ columnId: 1, position: 1 });
taskSchema.index({ projectId: 1, createdAt: -1 });

module.exports = model('Task', taskSchema);
