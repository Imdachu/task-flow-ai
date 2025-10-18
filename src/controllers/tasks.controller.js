const Task = require('../models/Task');
const Column = require('../models/Column');

// POST /api/tasks
async function createTask(req, res, next) {
  try {
    const { columnId, title, description } = req.body;
    if (!columnId) return res.status(400).json({ error: 'columnId is required' });
    if (!title) return res.status(400).json({ error: 'title is required' });

    const column = await Column.findById(columnId);
    if (!column) return res.status(400).json({ error: 'Column not found' });

    // compute position as max + 1
    const last = await Task.findOne({ columnId }).sort({ position: -1 }).select('position');
    const position = last ? last.position + 1 : 1;

    const task = await Task.create({
      projectId: column.projectId,
      columnId,
      title,
      description: description || '',
      position,
    });

    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

// PUT /api/tasks/:id
async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (Object.keys(update).length === 0) return res.status(400).json({ error: 'Nothing to update' });

    const task = await Task.findByIdAndUpdate(id, update, { new: true });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/tasks/:id
async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;
    const task = await Task.findByIdAndDelete(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTask, updateTask, deleteTask };
