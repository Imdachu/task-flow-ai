const Task = require('../models/Task');
const Column = require('../models/Column');
const { GeminiError, summarizeProject } = require('../services/gemini');

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

/**
 * Controller to handle AI insights for a specific task.
 */
async function askTask(req, res) {
  try {
    const { id } = req.params;

    // Fetch the task details
    const task = await Task.findById(id).lean();
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Optionally fetch sibling tasks in the same column
    const siblings = await Task.find({ columnId: task.columnId, _id: { $ne: id } })
      .select('title description')
      .lean();

    // Format the prompt for Gemini API
    const prompt = [
      { title: sanitizeInput(task.title), description: sanitizeInput(task.description || '') },
      ...siblings.map(sibling => ({ title: sanitizeInput(sibling.title), description: sanitizeInput(sibling.description || '') }))
    ];

    // Call Gemini API for insights
    let insights;
    try {
      insights = await summarizeProject(prompt, { retries: 3, timeoutMs: 10000 });
    } catch (geminiError) {
      if (geminiError instanceof GeminiError) {
        switch (geminiError.code) {
          case 'timeout':
            return res.status(504).json({ error: 'AI request timed out', code: geminiError.code });
          case 'rate_limit':
            return res.status(429).json({ error: 'AI service rate limited', code: geminiError.code });
          case 'unauthorized':
            return res.status(503).json({ error: 'AI service unauthorized', code: geminiError.code });
          case 'bad_request':
            return res.status(502).json({ error: 'AI service rejected request', code: geminiError.code, status: geminiError.status, providerSnippet: geminiError.original });
          default:
            return res.status(502).json({ error: 'AI request failed', code: geminiError.code, status: geminiError.status });
        }
      }

      return res.status(502).json({ error: 'Failed to generate insights using Gemini API', details: geminiError.message });
    }

    // Return the AI-generated insights
    res.json({ insights });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

module.exports = { createTask, updateTask, deleteTask, moveTask, askTask };
