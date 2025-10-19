const Project = require('../models/Project');
const Column = require('../models/Column');
const Task = require('../models/Task');
const { summarizeProject: geminiSummarize, GeminiError } = require('../services/gemini');

// Simple in-memory cache: { [projectId_updatedAt]: { summary, ts } }
const summaryCache = new Map();

// POST /api/projects
async function createProject(req, res, next) {
  try {
    const { name, description } = req.body;
    const project = await Project.create({ name, description });
    // Create default columns
    const defaultColumns = ['To Do', 'In Progress', 'Done'];
    const columns = await Column.insertMany(
      defaultColumns.map(title => ({ projectId: project._id, title }))
    );
    res.status(201).json({ project, columns });
  } catch (err) {
    next(err);
  }
}

// GET /api/projects
async function listProjects(req, res, next) {
  try {
    const projects = await Project.find({}, 'name description createdAt').sort({ createdAt: -1 });
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

// GET /api/projects/:id
async function getProjectBoard(req, res, next) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    const columns = await Column.find({ projectId: id }).sort({ createdAt: 1 });
    // Get all tasks for this project, grouped by column
    const tasks = await Task.find({ projectId: id }).sort({ position: 1 });
    const tasksByColumn = {};
    columns.forEach(col => {
      tasksByColumn[col._id] = tasks.filter(t => t.columnId.equals(col._id));
    });
    res.json({
      project: { id: project._id, name: project.name, description: project.description },
      columns: columns.map(col => ({ id: col._id, title: col.title })),
      tasksByColumn,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/projects/:id/summarize
async function summarizeProject(req, res, next) {
  try {
    const { id } = req.params;
    const project = await Project.findById(id, 'name description updatedAt');
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI summarization not available: GEMINI_API_KEY not configured' });
    }

    const cacheKey = `${project._id.toString()}_${project.updatedAt.getTime()}`;
    const cached = summaryCache.get(cacheKey);
    if (cached && (Date.now() - cached.ts) < 1000 * 60 * 5) {
      return res.json({ summary: cached.summary, cached: true });
    }

    const MAX_TASKS = 50;
    const tasks = await Task.find({ projectId: id })
      .select('title description columnId')
      .sort({ position: 1 })
      .lean();

    const compact = tasks.slice(0, MAX_TASKS).map(t => ({ id: String(t._id), title: t.title, description: (t.description || '').slice(0, 200) }));

    const more = tasks.length > MAX_TASKS;

    let summary;
    try {
      summary = await geminiSummarize(compact.concat(more ? [{ title: '...and more tasks', description: `${tasks.length - MAX_TASKS} additional tasks omitted` }] : []), { retries: 2, timeoutMs: 8000 });
    } catch (geminiError) {
      if (geminiError instanceof GeminiError) {
        switch (geminiError.code) {
          case 'timeout':
            return res.status(504).json({ error: 'AI summarization timed out', code: geminiError.code });
          case 'rate_limit':
            return res.status(429).json({ error: 'AI service rate limited', code: geminiError.code });
          case 'unauthorized':
            return res.status(503).json({ error: 'AI service unauthorized', code: geminiError.code });
          case 'bad_request':
            return res.status(502).json({ error: 'AI service rejected request', code: geminiError.code, status: geminiError.status, providerSnippet: geminiError.original });
          default:
            return res.status(502).json({ error: 'AI summarization failed', code: geminiError.code, status: geminiError.status });
        }
      }

      return res.status(502).json({ error: 'Failed to generate summary using Gemini API', details: geminiError ? geminiError.message : 'unknown error' });
    }

    summaryCache.set(cacheKey, { summary, ts: Date.now() });

    res.json({ summary, cached: false, more });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}

module.exports = { createProject, listProjects, getProjectBoard, summarizeProject };
