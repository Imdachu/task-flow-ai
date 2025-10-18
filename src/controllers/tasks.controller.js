const Task = require('../models/Task');
const Column = require('../models/Column');

// POST /api/tasks
async function createTask(req, res, next) {
  try {
    const { columnId, title, description } = req.body;

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

// PATCH /api/tasks/:id/move
async function moveTask(req, res, next) {
  try {
    const { id } = req.params;
    const { destColumnId, beforeTaskId, afterTaskId } = req.body;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const destColumn = await Column.findById(destColumnId);
    if (!destColumn) return res.status(400).json({ error: 'Destination column not found' });

    // Compute new position based on neighbors
    let newPosition;

    if (beforeTaskId && afterTaskId) {
      // Between two tasks
      const before = await Task.findById(beforeTaskId).select('position');
      const after = await Task.findById(afterTaskId).select('position');
      if (!before || !after) return res.status(400).json({ error: 'Invalid neighbor task IDs' });
      newPosition = (before.position + after.position) / 2;
    } else if (beforeTaskId) {
      // After a task (beforeTaskId is above in visual terms)
      const before = await Task.findById(beforeTaskId).select('position');
      if (!before) return res.status(400).json({ error: 'Invalid beforeTaskId' });
      newPosition = before.position + 1;
    } else if (afterTaskId) {
      // Before a task (afterTaskId is below in visual terms)
      const after = await Task.findById(afterTaskId).select('position');
      if (!after) return res.status(400).json({ error: 'Invalid afterTaskId' });
      newPosition = after.position - 1;
    } else {
      // Dropped at the end of the column
      const last = await Task.findOne({ columnId: destColumnId }).sort({ position: -1 }).select('position');
      newPosition = last ? last.position + 1 : 1;
    }

    // Update task
    task.columnId = destColumnId;
    task.position = newPosition;
    await task.save();

    res.json({ task });
  } catch (err) {
    next(err);
  }
}

module.exports = { createTask, updateTask, deleteTask, moveTask };
