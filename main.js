const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// System prompt fetched from server
let systemPrompt = '';

// Fetch system prompt from server on page load
async function loadConfig() {
    try {
        const res = await fetch('/api/config');
        const config = await res.json();
        systemPrompt = config.systemPrompt;
        console.log('System prompt loaded:', systemPrompt);
    } catch (err) {
        console.warn('Could not load system prompt from server:', err);
    }
}

// 1. Initialize your counter and arrays
let count = 0;
const localResponses = [
    "ayin??",
    "idc",
    "umbiko",
    "ayinn"
];

function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
async function callAIApi(userText) {
    // Client now calls local proxy to keep API key secret and avoid CORS/auth issues
    try {
        // If the page was opened via file:// the relative path resolves to file:///api/generate
        // so detect that and use the absolute localhost URL for the proxy instead.
        const apiPath = (typeof location !== 'undefined' && location.protocol === 'file:')
            ? 'http://localhost:3000/api/generate'
            : '/api/generate';

        if (typeof location !== 'undefined' && location.protocol === 'file:') {
            console.warn('Running from file:// — using http://localhost:3000 for proxy requests. Prefer opening via http://localhost:3000/main.html');
        }
        console.log("the prompt is",systemPrompt)
        const res = await fetch(apiPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: userText })
        });

        const payload = await res.json();
        if (!res.ok) {
            throw new Error(payload.error || JSON.stringify(payload));
        }

        return payload.reply || 'No reply from server';
    } catch (err) {
        console.error('callAIApi (client) error:', err);
        throw err;
    }
}

async function handleSend() {
    const text = userInput.value.trim();
    if (text === '') return;

    addMessage(text, 'user');
    userInput.value = '';
    count++; // Increment the counter

    if (count <= 10) {
        // AI API Flow
        try {
            const aiReply = await callAIApi(text);
            addMessage(aiReply, 'bot');
        } catch (error) {
            console.error('handleSend API error:', error);
            addMessage("Oops! API error: " + (error.message || 'unknown error'), 'bot');
        }
    } else {
        // Local Array Flow
        const randomReply = localResponses[Math.floor(Math.random() * localResponses.length)];
        addMessage(randomReply, 'bot');
    }
}

sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

// Load configuration (system prompt) from server on page load
loadConfig();