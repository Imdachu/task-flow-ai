const Task = require('../models/Task');
const Column = require('../models/Column');
const { GeminiError, summarizeProject, askTask: askGeminiTask } = require('../services/gemini');
const { sanitizeInput } = require('../utils/sanitize');

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
  // prompt prepared

    // Call Gemini API for insights
    let insights;
    try {
      insights = await askGeminiTask(task, siblings, { retries: 3, timeoutMs: 10000 });
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
            // providerSnippet may be an Error object; stringify safely to avoid serialization errors
            try {
              const util = require('util');
              const snippet = geminiError.original ? util.inspect(geminiError.original, { depth: 2, maxArrayLength: 20 }) : undefined;
              return res.status(502).json({ error: 'AI service rejected request', code: geminiError.code, status: geminiError.status, providerSnippet: snippet });
            } catch (e) {
              return res.status(502).json({ error: 'AI service rejected request', code: geminiError.code, status: geminiError.status });
            }
          default:
            return res.status(502).json({ error: 'AI request failed', code: geminiError.code, status: geminiError.status });
        }
      }

      return res.status(502).json({ error: 'Failed to generate insights using Gemini API', details: geminiError.message });
    }
    try {
      const util = require('util');
      // Keep minimal logging only on unexpected shapes
      // Example: log type for debugging in case of unusual non-string responses
      if (typeof insights !== 'string') {
        const preview = util.inspect(insights, { depth: 2, maxArrayLength: 20 });
        console.warn('[tasks.controller] askTask non-string insights preview:', preview);
      }
    } catch (logErr) {
      console.error('[tasks.controller] failed to preview insights safely', logErr);
    }

  // Return the AI-generated insights
  // Normalize insights to a plain string for frontend
    let normalized = '';
    try {
      if (typeof insights === 'string') {
        normalized = insights;
      } else if (!insights) {
        normalized = '';
      } else if (Array.isArray(insights?.candidates) && insights.candidates.length) {
        normalized = insights.candidates.map(c => c?.content ?? c?.output ?? c?.text ?? '').join('\n');
      } else if (Array.isArray(insights?.outputs) && insights.outputs.length) {
        normalized = insights.outputs.map(o => {
          try {
            const parts = (o?.content?.[0]?.parts) || [];
            return parts.map(p => p?.text || '').join('');
          } catch (_) { return '' }
        }).join('\n');
      } else if (typeof insights === 'object') {
        // Try to extract common nested text fields, fallback to a safe string
        try {
          if (insights?.text) normalized = String(insights.text);
          else if (insights?.output) normalized = String(insights.output);
          else {
            const util = require('util');
            normalized = util.inspect(insights, { depth: 2, maxArrayLength: 50 });
          }
        } catch (e) {
          normalized = String(insights);
        }
      } else {
        normalized = String(insights);
      }
    } catch (normErr) {
      console.error('[tasks.controller] Failed to normalize insights:', normErr);
      normalized = String(insights);
    }

    res.json({ insights: normalized });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

module.exports = { createTask, updateTask, deleteTask, moveTask, askTask };
