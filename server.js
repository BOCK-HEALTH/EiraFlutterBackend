const express = require('express');
const cors = require('cors');
const path = require('path');

// --- Load environment variables from .env.development using absolute path ---
require('dotenv').config({ path: path.resolve(__dirname, '.env.development') });

// --- IMPORT YOUR ROUTE HANDLERS ---
const getSessionsHandler = require('./api/getSessions.js');
const getMessagesHandler = require('./api/getMessages.js');
const storeMessageHandler = require('./api/storeMessage.js');
const storeFileMessageHandler = require('./api/storeFileMessage.js');
const deleteSessionHandler = require('./api/deleteSession.js');
const updateSessionHandler = require('./api/updateSession.js');

const app = express();
const port = process.env.PORT || 8080;

// --- GLOBAL MIDDLEWARE ---
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies

// --- API ROUTES ---
app.get('/api/getSessions', getSessionsHandler);
app.get('/api/getMessages', getMessagesHandler);
app.post('/api/storeMessage', storeMessageHandler);
app.post('/api/storeFileMessage', storeFileMessageHandler);
app.delete('/api/deleteSession', deleteSessionHandler);
app.put('/api/updateSession', updateSessionHandler);

// --- HEALTH CHECK ROUTE ---
app.get('/', (req, res) => {
  res.status(200).send('Eira Backend Server is running!');
});

// --- START SERVER ---
app.listen(8080, '0.0.0.0', () => {
  console.log(`Server is listening on http://0.0.0.0:${8080}`);
});
