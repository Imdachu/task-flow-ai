const STRIP_TAGS_REGEX = /<[^>]*>/g;
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const sanitizeHtml = require('sanitize-html');

function stripTags(input) {
  if (!input) return '';
  return String(input).replace(STRIP_TAGS_REGEX, '');
}

function removeControlChars(input) {
  if (!input) return '';
  return String(input).replace(CONTROL_CHARS, '');
}

// Basic prompt-injection guard: remove common 'system' tokens and long sequences of dashes
function guardPromptInjection(input) {
  if (!input) return '';
  return String(input)
    .replace(/\b(system|user|assistant)\b/gi, '')
    .replace(/[-]{3,}/g, '-')
    .trim();
}

function sanitizeInput(input, maxLen = 200) {
  let s = removeControlChars(input);
  s = stripTags(s);
  s = guardPromptInjection(s);
  if (s.length > maxLen) s = s.slice(0, maxLen - 1) + '…';
  return sanitizeHtml(s, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

module.exports = { sanitizeInput };
