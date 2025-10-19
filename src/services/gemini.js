const axios = require('axios');
const { default: PQueue } = require('p-queue');
const { sanitizeInput } = require('../utils/sanitize');

// Basic configuration - will read GEMINI_API_KEY from environment
// Default to Google's Generative Language endpoint for Gemini (server-side)
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Basic queue to limit concurrent requests (lightweight rate limiting)
const queue = new PQueue({ concurrency: 2, intervalCap: 5, interval: 1000 });

// Default axios instance without a fixed timeout; we'll use AbortController per-request
const client = axios.create({
  baseURL: GEMINI_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

class GeminiError extends Error {
  constructor(message, { code = 'gateway', status, original } = {}) {
    super(message);
    this.name = 'GeminiError';
    this.code = code; // 'timeout' | 'rate_limit' | 'gateway' | 'bad_request' | 'unauthorized'
    this.status = status;
    this.original = original;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function payloadToString(payload) {
  // If payload.messages exists (chat style), join user/system messages into a single string
  if (payload && Array.isArray(payload.messages)) {
    return payload.messages.map(m => `${m.role.toUpperCase()}: ${String(m.content)}`).join('\n\n');
  }
  // Fallback: stringify
  try { return JSON.stringify(payload).slice(0, 10000); } catch (e) { return String(payload); }
}

async function callGemini(payload, retries = 2, timeoutMs = 10000) {
  if (!GEMINI_API_KEY) throw new GeminiError('Gemini API key not configured', { code: 'unauthorized' });

  return queue.add(async () => {
    const attempt = (n) => Math.min(1000 * Math.pow(2, n), 10000);

    for (let attemptIdx = 0; attemptIdx <= retries; attemptIdx++) {
      const controller = new AbortController();
      const signal = controller.signal;
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        if (client.defaults.baseURL && client.defaults.baseURL.includes('generativelanguage.googleapis.com')) {
          const googlePayload = { contents: [{ parts: [{ text: payloadToString(payload) }] }] };
          const path = `?key=${encodeURIComponent(GEMINI_API_KEY)}`;
          const res = await client.post(path, googlePayload, { signal });
          clearTimeout(timeout);
          const data = res.data;
          const candidates = data?.candidates;

          const tryExtractText = (obj) => {
            if (!obj) return null;
            if (typeof obj === 'string') return obj;
            if (Array.isArray(obj)) {
              for (const item of obj) {
                const t = tryExtractText(item);
                if (t) return t;
              }
              return null;
            }
            if (obj.text && typeof obj.text === 'string') return obj.text;
            if (obj.parts && Array.isArray(obj.parts)) {
              for (const p of obj.parts) if (p && typeof p.text === 'string') return p.text;
            }
            if (obj.content) return tryExtractText(obj.content);
            if (obj.output) return tryExtractText(obj.output);
            for (const k of Object.keys(obj)) {
              const v = obj[k];
              if (typeof v === 'string' && v.length > 0) return v;
              if (Array.isArray(v) || (v && typeof v === 'object')) {
                const t = tryExtractText(v);
                if (t) return t;
              }
            }
            return null;
          };

          let text = null;
          if (Array.isArray(candidates) && candidates.length) {
            text = tryExtractText(candidates[0]);
          }

          if (!text) text = tryExtractText(data);

          if (text && typeof text === 'string') return String(text).trim();

          throw new GeminiError('No text content returned by provider', { code: 'gateway', status: res.status, original: data });
        }

        const res = await client.post('', payload, {
          headers: { Authorization: `Bearer ${GEMINI_API_KEY}` },
          signal,
        });
        clearTimeout(timeout);

        if (res.status < 200 || res.status >= 300) {
          const snippet = (() => {
            try {
              const d = res.data;
              if (!d) return `HTTP ${res.status}`;
              const keys = Object.keys(d).slice(0, 5);
              const picked = {};
              keys.forEach(k => { picked[k] = d[k]; });
              return JSON.stringify(picked).slice(0, 1000);
            } catch (e) {
              return `HTTP ${res.status}`;
            }
          })();

          if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            throw new GeminiError(`Gemini bad request`, { code: 'bad_request', status: res.status, original: snippet });
          }
          throw new Error(`Gemini HTTP ${res.status}: ${snippet}`);
        }

        const choice = res.data?.choices?.[0];
        if (choice) return choice.message?.content || choice.text || String(choice);
        return res.data;
      } catch (err) {
        clearTimeout(timeout);

        if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
          if (attemptIdx >= retries) {
            throw new GeminiError('Gemini request timed out', { code: 'timeout', original: err });
          }
        }

        const status = err.response?.status;
        if (status) {
          if (status === 401 || status === 403) {
            throw new GeminiError('Gemini unauthorized', { code: 'unauthorized', status, original: err.response?.data });
          }
          if (status >= 400 && status < 500 && status !== 429) {
            throw new GeminiError('Gemini bad request', { code: 'bad_request', status, original: err.response?.data });
          }
        }

        if (attemptIdx >= retries) {
          const code = status === 429 ? 'rate_limit' : 'gateway';
          throw new GeminiError(`Gemini API error: ${err.message || String(err)}`, { code, status, original: err });
        }

        const backoff = attempt(attemptIdx) + Math.floor(Math.random() * 200);
        await sleep(backoff);
      }
    }
    throw new GeminiError('Gemini: exhausted retries', { code: 'gateway' });
  });
}

function buildSummarizePrompt(compactTasks) {
  // compactTasks: [{title, description, id}]
  const lines = compactTasks.map((t) => `- ${sanitizeInput(t.title)}: ${sanitizeInput(t.description || '')}`);
  return `You are a concise assistant. Provide a very short summary (2-4 sentences) of the task list below. Focus on high-level progress, blockers, and themes. Keep it short and use plain text. Do not fabricate facts.

Tasks:\n${lines.join('\n')}`;
}

async function summarizeProject(compactTasks, options = {}) {
  const prompt = buildSummarizePrompt(compactTasks);

  const payload = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'You are a concise project assistant.' }, { role: 'user', content: prompt }],
    max_tokens: 256,
    temperature: 0.2,
  };

  const res = await callGemini(payload, options.retries ?? 2, options.timeoutMs ?? 10000);

  return String(res).trim();
}

function buildAskPrompt(task, siblingTasks = []) {
  const sanitized = `Title: ${sanitizeInput(task.title)}\nDescription: ${sanitizeInput(task.description || '')}`;
  const siblings = siblingTasks.length ? '\n\nSibling tasks:\n' + siblingTasks.map((t) => `- ${sanitizeInput(t.title)}: ${sanitizeInput(t.description || '')}`).join('\n') : '';
  return `You are an assistant to help improve task clarity and suggest next steps. Use the task context below and be brief (1-3 short suggestions). Avoid guessing or inventing missing details.\n\n${sanitized}${siblings}`;
}

async function askTask(task, siblingTasks = [], options = {}) {
  const prompt = buildAskPrompt(task, siblingTasks);
  const payload = {
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: 'You are a helpful task assistant.' }, { role: 'user', content: prompt }],
    max_tokens: 256,
    temperature: 0.3,
  };
  const res = await callGemini(payload, options.retries ?? 2, options.timeoutMs ?? 10000);
  return String(res).trim();
}

module.exports = { summarizeProject, askTask, GeminiError };
