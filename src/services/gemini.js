const axios = require('axios');
const { default: PQueue } = require('p-queue');
const { sanitizeInput } = require('../utils/sanitize');

// Basic configuration - will read GEMINI_API_KEY from environment
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://api.openai.com/v1/chat/completions';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Basic queue to limit concurrent requests (lightweight rate limiting)
const queue = new PQueue({ concurrency: 2, intervalCap: 5, interval: 1000 });

// Default axios instance with timeout
const client = axios.create({
  baseURL: GEMINI_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

async function callGemini(payload, retries = 2) {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  // wrap in queue to throttle
  return queue.add(async () => {
    try {
      const res = await client.post('', payload, {
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
        },
      });

      // adapt for different LLM providers: try to extract text
      const choice = res.data?.choices?.[0];
      if (choice) return choice.message?.content || choice.text || JSON.stringify(choice);
      return res.data;
    } catch (err) {
      if (retries > 0) {
        return callGemini(payload, retries - 1);
      }
      const msg = err.response?.data || err.message || String(err);
      throw new Error(`Gemini API error: ${msg}`);
    }
  });
}

function buildSummarizePrompt(compactTasks) {
  // compactTasks: [{title, description, id}]
  const lines = compactTasks.map((t) => `- ${sanitizeInput(t.title)}: ${sanitizeInput(t.description || '')}`);
  return `You are a concise assistant. Provide a very short summary (2-4 sentences) of the task list below. Focus on high-level progress, blockers, and themes. Keep it short and use plain text. Do not fabricate facts.

Tasks:\n${lines.join('\n')}`;
}

async function summarizeProject(compactTasks) {
  const prompt = buildSummarizePrompt(compactTasks);

  // Construct Gemini-compatible payload (OpenAI ChatCompletion-like)
  const payload = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'You are a concise project assistant.' }, { role: 'user', content: prompt }],
    max_tokens: 256,
    temperature: 0.2,
  };

  const res = await callGemini(payload);
  return String(res).trim();
}

function buildAskPrompt(task, siblingTasks = []) {
  const sanitized = `Title: ${sanitizeInput(task.title)}\nDescription: ${sanitizeInput(task.description || '')}`;
  const siblings = siblingTasks.length ? '\n\nSibling tasks:\n' + siblingTasks.map((t) => `- ${sanitizeInput(t.title)}: ${sanitizeInput(t.description || '')}`).join('\n') : '';
  return `You are an assistant to help improve task clarity and suggest next steps. Use the task context below and be brief (1-3 short suggestions). Avoid guessing or inventing missing details.\n\n${sanitized}${siblings}`;
}

async function askTask(task, siblingTasks = []) {
  const prompt = buildAskPrompt(task, siblingTasks);
  const payload = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'You are a helpful task assistant.' }, { role: 'user', content: prompt }],
    max_tokens: 256,
    temperature: 0.3,
  };
  const res = await callGemini(payload);
  return String(res).trim();
}

module.exports = { summarizeProject, askTask };
