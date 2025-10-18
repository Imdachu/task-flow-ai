const Project = require('../models/Project');
const Column = require('../models/Column');
const Task = require('../models/Task');

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

module.exports = { createProject, listProjects, getProjectBoard };