'use strict';
const Groq = require('groq-sdk');

// Groq client — initialized once.
// API key is read exclusively from process.env (set via .env on the server).
// This module is BACKEND ONLY — never import it from frontend code.
let _client = null;

function getClient() {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'your_groq_api_key_here') {
      throw new Error('GROQ_API_KEY is not set in .env');
    }
    _client = new Groq({ apiKey });
  }
  return _client;
}

// Default model
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

/**
 * Chat completion helper.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {object} opts  — { model, maxTokens, temperature, json }
 * @returns {Promise<string>} — raw text content of the first choice
 */
async function chat(systemPrompt, userPrompt, opts = {}) {
  const client = getClient();
  const {
    model       = DEFAULT_MODEL,
    maxTokens   = 512,
    temperature = 0.7,
    json        = false,
  } = opts;

  const completion = await client.chat.completions.create({
    model,
    max_tokens:   maxTokens,
    temperature,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt   },
    ],
  });

  return completion.choices[0]?.message?.content ?? '';
}

module.exports = { chat };
