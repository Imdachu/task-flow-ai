// Fallback Gemini service (local summarization and suggestions)
// Keeps endpoints working without the external SDK.
const { sanitizeInput } = require('../utils/sanitize');

class GeminiError extends Error {
  constructor(code, message, original) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
    this.original = original;
  }
}

async function summarizeProject(compactTasks = []) {
  const tasks = Array.isArray(compactTasks) ? compactTasks : [];
  if (tasks.length === 0) return 'No tasks to summarize.';
  const top = tasks.slice(0, 5).map((t, i) => `${i + 1}. ${sanitizeInput(String(t.title || 'Untitled'))}`);
  return `Project has ${tasks.length} task(s). Top tasks: ${top.join('; ')}.`;
}

async function askTask(task = {}, siblingTasks = []) {
  try {
    const desc = String(task.description || '').trim();
    const suggestions = [];
    if (!desc) suggestions.push('Add a description explaining the goal and acceptance criteria.');
    if (desc && desc.length < 40) suggestions.push('Expand the description with expected outcomes.');
    if (!task.assignee) suggestions.push('Assign the task to an owner.');
    if (Array.isArray(siblingTasks) && siblingTasks.length) suggestions.push('Check sibling tasks for overlapping scope.');
    if (suggestions.length === 0) suggestions.push('Looks clear — consider adding acceptance criteria if applicable.');
    return suggestions.join(' ');
  } catch (err) {
    throw new GeminiError('gateway', 'Local askTask failed', err);
  }
}

module.exports = { summarizeProject, askTask, GeminiError };
