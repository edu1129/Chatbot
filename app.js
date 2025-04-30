const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GAS_WEB_APP_URL = process.env.GAS_WEB_APP_URL;
const GAS_SECRET = process.env.GAS_SECRET;

if (!GAS_WEB_APP_URL || !GAS_SECRET) {
    console.error("FATAL ERROR: GAS_WEB_APP_URL or GAS_SECRET environment variable is not set.");
    process.exit(1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

async function forwardToGas(action, payload) {
    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-GAS-Secret': GAS_SECRET
            },
            body: JSON.stringify({ action, ...payload }),
        });
        return { status: response.status, data: await response.json() };
    } catch (error) {
        console.error(`Error forwarding action '${action}' to GAS:`, error);
        return { status: 500, data: { success: false, message: 'Failed to communicate with the backend service.' } };
    }
}

app.post('/api/signup', async (req, res) => {
    const { gmail, password, geminiApiKey } = req.body;
    if (!gmail || !password || !geminiApiKey) {
        return res.status(400).json({ success: false, message: 'Missing required fields for signup.' });
    }
    const { status, data } = await forwardToGas('signup', { gmail, password, geminiApiKey });
    res.status(status).json(data);
});

app.post('/api/login', async (req, res) => {
    const { gmail, password } = req.body;
    if (!gmail || !password) {
        return res.status(400).json({ success: false, message: 'Missing required fields for login.' });
    }
    const { status, data } = await forwardToGas('login', { gmail, password });
    res.status(status).json(data);
});

app.post('/api/chat', async (req, res) => {
    const { gmail, prompt, systemPrompt } = req.body;
     if (!gmail || !prompt) {
        return res.status(400).json({ success: false, message: 'Missing user identifier or prompt.' });
    }
    const { status, data } = await forwardToGas('chat', { gmail, prompt, systemPrompt });
    res.status(status).json(data);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
