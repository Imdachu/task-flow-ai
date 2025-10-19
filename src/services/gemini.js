// src/services/gemini.js
// Clean, single-file implementation with SDK support and fallback.
// Exports: summarizeProject(compactTasks, options), askTask(task, siblingTasks, options), GeminiError

const { sanitizeInput } = require('../utils/sanitize');

class GeminiError extends Error {
  constructor(code, message, original) {
    super(message || code);
    this.name = 'GeminiError';
    this.code = code || 'gateway';
    this.original = original;
  }
}

function buildSummarizePrompt(compactTasks) {
  const lines = (Array.isArray(compactTasks) ? compactTasks : []).map((t) => `- ${sanitizeInput(String(t.title || ''))}: ${sanitizeInput(String(t.description || ''))}`);
  return `You are a concise assistant. Provide a very short summary (2-4 sentences) of the task list below. Focus on high-level progress, blockers, and themes. Keep it short and use plain text. Do not fabricate facts.\n\nTasks:\n${lines.join('\n')}`;
}

function buildAskPrompt(task, siblingTasks = []) {
  const sanitized = `Title: ${sanitizeInput(String(task.title || ''))}\nDescription: ${sanitizeInput(String(task.description || ''))}`;
  const siblings = (Array.isArray(siblingTasks) && siblingTasks.length)
    ? '\n\nSibling tasks:\n' + siblingTasks.map((t) => `- ${sanitizeInput(String(t.title || ''))}: ${sanitizeInput(String(t.description || ''))}`).join('\n')
    : '';
  return `You are an assistant to help improve task clarity and suggest next steps. Use the task context below and be brief (1-3 short suggestions). Avoid guessing or inventing missing details.\n\n${sanitized}${siblings}`;
}

async function localSummarize(compactTasks = [], options = {}) {
  try {
    const tasks = Array.isArray(compactTasks) ? compactTasks : [];
    if (tasks.length === 0) return 'No tasks to summarize.';

    const limit = Number(options.maxTasks) || 50;
    const slice = tasks.slice(0, limit);

    const count = tasks.length;
    const top = slice.slice(0, 3).map((t, i) => `${i + 1}. ${sanitizeInput(String(t.title || 'Untitled'))}`);
    const hasDescriptions = slice.some(t => t.description && String(t.description).trim().length > 0);
    const omitted = count > limit ? ` ${count - limit} more task(s) omitted.` : '';

    const parts = [`Project contains ${count} task(s).`];
    if (top.length) parts.push(`Top tasks: ${top.join('; ')}.`);
    parts.push(hasDescriptions ? 'Some tasks include descriptions.' : 'Tasks are mostly title-only.');

    return (parts.join(' ') + omitted).trim();
  } catch (err) {
    throw new GeminiError('gateway', 'Local summarization failed', err);
  }
}

async function localAsk(task = {}, siblingTasks = [], options = {}) {
  try {
    const suggestions = [];
    const title = String(task.title || '').trim();
    const desc = String(task.description || '').trim();
    if (!title) suggestions.push('Add a clear title that summarizes the goal.');
    if (!desc) suggestions.push('Add a description explaining the goal and acceptance criteria.');
    if (desc && desc.length < 40) suggestions.push('Expand the description with expected outcomes and acceptance criteria.');
    if (!task.assignee) suggestions.push('Assign the task to an owner.');
    if (Array.isArray(siblingTasks) && siblingTasks.length) suggestions.push('Verify sibling tasks for overlap or dependency.');

    return (suggestions.length ? suggestions.slice(0, 3) : ['Looks clear — consider adding acceptance criteria if applicable.']).join(' ');
  } catch (err) {
    throw new GeminiError('gateway', 'Local askTask failed', err);
  }
}

async function callGeminiPrompt(prompt, modelName = 'gemini-2.5-flash', options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiError('unauthorized', 'Gemini API key not configured');

  try {
    // Use the REST endpoint directly to avoid SDK compatibility issues.
    const axios = require('axios');

    // If no modelName provided, try to discover a suitable model for this API key
    const resolvedModel = await (async () => {
      if (modelName && String(modelName).trim()) return modelName;
      try { return await discoverModelForKey(apiKey); } catch (_) { return 'gemini-2.5-flash'; }
    })();

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(resolvedModel)}:generateContent?key=${apiKey}`;

    const parts = [{ text: String(prompt) }];
    const body = {
      // Use the 'contents' format expected by the service
      contents: [{ parts }],
    };

    const resp = await axios.post(endpoint, body, { headers: { 'Content-Type': 'application/json' } });
    if (!resp || !resp.data) throw new Error('Empty response from Gemini REST API');

    const data = resp.data;

    // helper: extract text from nested candidate/content structures
    const extractFromCandidate = (candidate) => {
      try {
        // candidate.content can be an array of content blocks
        const blocks = candidate?.content || candidate?.output || [];
        if (typeof blocks === 'string') return blocks;
        if (!Array.isArray(blocks)) {
          // maybe an object with parts
          const parts = blocks?.parts || [];
          return Array.isArray(parts) ? parts.map(p => p?.text || '').join('') : String(blocks);
        }
        // blocks is array
        return blocks.map(b => {
          if (typeof b === 'string') return b;
          if (Array.isArray(b?.parts)) return b.parts.map(p => p?.text || '').join('');
          // nested content array
          if (Array.isArray(b?.content)) return b.content.map(c => {
            if (Array.isArray(c?.parts)) return c.parts.map(p => p?.text || '').join('');
            return c?.text || '';
          }).join('');
          return b?.text || '';
        }).join('\n');
      } catch (e) {
        return '';
      }
    };

    // 1) candidates
    if (Array.isArray(data?.candidates) && data.candidates.length) {
      const texts = data.candidates.map(c => extractFromCandidate(c));
      return texts.join('\n').trim();
    }

    // 2) outputs (v1beta 'outputs' shape)
    if (Array.isArray(data?.outputs) && data.outputs.length) {
      const out = data.outputs.map(o => {
        try {
          const content = o?.content || [];
          if (!Array.isArray(content)) return '';
          return content.map(cnt => {
            if (Array.isArray(cnt.parts)) return cnt.parts.map(p => p?.text || '').join('');
            return cnt?.text || '';
          }).join('');
        } catch (_) { return '' }
      }).join('\n');
      return String(out).trim();
    }

    // 3) direct text fields
    if (data?.text) return String(data.text).trim();

    // Fallback: stringify safely
    try { return String(JSON.stringify(data)); } catch (e) { return String(data); }
  } catch (err) {
    // If axios returned a response body, log it for diagnostic purposes
    try {
      if (err && err.response) {
          // Log minimal error metadata (status only) to avoid noisy large payloads
          console.error('[gemini] REST error status:', err.response.status);
        }
    } catch (logErr) {
      console.error('[gemini] failed to log REST error details', logErr);
    }
    const msg = String(err?.message || err || '');
    if (msg.toLowerCase().includes('unauthor') || msg.includes('401')) throw new GeminiError('unauthorized', 'Gemini unauthorized', err);
    if (msg.includes('429') || msg.toLowerCase().includes('rate')) throw new GeminiError('rate_limited', 'Gemini rate limit', err);
    if (msg.toLowerCase().includes('badrequest') || msg.includes('400')) throw new GeminiError('bad_request', 'Gemini bad request', err);
    throw new GeminiError('gateway', `Gemini REST error: ${msg}`, err);
  }
}

// Discover a suitable generateContent model using the provided API key
const _modelCache = { model: null, ts: 0 };
async function discoverModelForKey(apiKey) {
  // cache for 10 minutes
  if (_modelCache.model && (Date.now() - _modelCache.ts) < 1000 * 60 * 10) return _modelCache.model;
  const axios = require('axios');
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const resp = await axios.get(url, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
  if (!resp || !resp.data || !Array.isArray(resp.data.models)) throw new Error('No models returned from ListModels');

  const models = resp.data.models;
  // ranking preference: gemini-2.5-flash, gemini-2.5-pro, gemini-flash-latest, any gemini-2.5*
  const prefer = [ 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-flash-latest' ];
  const candidates = [];
  for (const m of models) {
    const name = String(m.name || '').toLowerCase();
    // only consider generators (skip embeddings)
    if (!name.includes('gemini') && !name.includes('flash') && !name.includes('pro')) continue;
    candidates.push(m.name);
  }
  // prefer stable names if available
  for (const p of prefer) {
    const found = candidates.find(c => String(c || '').toLowerCase().includes(p));
    if (found) { _modelCache.model = found; _modelCache.ts = Date.now(); return found; }
  }
  if (candidates.length) { _modelCache.model = candidates[0]; _modelCache.ts = Date.now(); return candidates[0]; }
  throw new Error('No suitable Gemini model available for generateContent');
}

async function summarizeProject(compactTasks = [], options = {}) {
  if (process.env.GEMINI_API_KEY) {
    try {
        const prompt = buildSummarizePrompt(compactTasks);
        const text = await callGeminiPrompt(prompt, undefined, options);
      return String(text).trim();
    } catch (err) {
      console.warn('Gemini SDK failed, falling back to local summarizer:', err?.message || err);
      return localSummarize(compactTasks, options);
    }
  } else {
    return localSummarize(compactTasks, options);
  }
}

async function askTask(task = {}, siblingTasks = [], options = {}) {
  // If a GEMINI_API_KEY is configured, call the REST API. Otherwise fall back to local suggestions.
  if (process.env.GEMINI_API_KEY) {
    try {
        // GEMINI_API_KEY present — will attempt remote call (no noisy info log)
  const prompt = buildAskPrompt(task, siblingTasks);
  const text = await callGeminiPrompt(prompt, undefined, options);
      return String(text).trim();
    } catch (err) {
  // Fall back silently to local suggestions on remote call failure
      return localAsk(task, siblingTasks, options);
    }
  }

  // No API key: default to local fallback for reliability
  return localAsk(task, siblingTasks, options);
}

module.exports = { summarizeProject, askTask, GeminiError };
