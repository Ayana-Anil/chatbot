const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from project root so the app runs from http://localhost:PORT
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'main.html')));

// Simple request logger (avoids printing secrets)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method !== 'GET') {
    try { console.log('  Body:', JSON.stringify(req.body)); } catch (e) { console.log('  Body: [unserializable]'); }
  }
  next();
});

const PORT = process.env.PORT || 3000;

// System prompt shared between server and client
const systemPrompt = "you are a toxic mallu boyfriend who is very controlling but loving talk in manglish like \"sugam ano\",\"ninne ishta\" ";

// Expose system prompt so client can fetch it
app.get('/api/config', (req, res) => {
  res.json({ systemPrompt });
});

app.post('/api/generate', async (req, res) => {
  const { text } = req.body;
  const API_KEY = process.env.API_KEY;

  if (!API_KEY) return res.status(500).json({ error: 'Server missing API_KEY (set in .env)' });
  if (!text) return res.status(400).json({ error: 'Missing `text` in request body' });

  try {
    const MODEL_NAME = process.env.MODEL_NAME || 'models/gemini-2.5-flash';
    const endpointBase = `https://generativelanguage.googleapis.com/v1/${MODEL_NAME}:generateContent`;
    
    // v1 API: send user input with the persona instruction prepended to the text
    const systemPromptPrefix = systemPrompt + '\n\n';
    const body = {
      contents: [{ parts: [{ text: systemPromptPrefix + text }] }]
    };

    console.log('  Proxying request to generative API for model:', MODEL_NAME);
    const fullUrl = `${endpointBase}?key=${API_KEY}`;
    console.log('  Endpoint:', fullUrl.replace(API_KEY, '[KEY]'));
    const r = await axios.post(fullUrl, body, { headers: { 'Content-Type': 'application/json' } });

    console.log('  Provider response status:', r.status);
    try { console.log('  Provider response body:', JSON.stringify(r.data)); } catch (e) { console.log('  Provider response body: [unserializable]'); }

    const reply = r.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? r.data ?? null;
    console.log('  Reply extracted:', typeof reply === 'string' ? (reply.length > 200 ? reply.slice(0,200) + '...': reply) : reply);
    return res.json({ reply });
  } catch (err) {
    console.error('Proxy error:', err?.response?.data ?? err.message);
    const status = err?.response?.status || 500;
    const message = err?.response?.data?.error?.message || err.message || 'Unknown error';
    // Return provider details to help debugging (safe during development only)
    return res.status(status).json({ error: message, details: err?.response?.data });
  }
});

// Dev helper: list available models from the provider (tries v1, then v1beta)
app.get('/api/list-models', async (req, res) => {
  const API_KEY = process.env.API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'Server missing API_KEY (set in .env)' });

  const endpoints = [
    `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`,
    `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
  ];

  for (const ep of endpoints) {
    try {
      console.log('Trying list models endpoint:', ep);
      const r = await axios.get(ep);
      console.log('List models response status:', r.status);
      return res.json({ endpoint: ep, data: r.data });
    } catch (err) {
      console.warn('List models attempt failed for', ep, err?.response?.data || err.message);
      // try next
    }
  }

  return res.status(502).json({ error: 'Failed to list models from provider' });
});

app.listen(PORT, () => console.log(`Proxy server listening on http://localhost:${PORT}`));
