// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from .env.development
require('dotenv').config({ path: '.env.development' });

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
// Enable CORS for all routes. This replaces the OPTIONS handling in your old files.
app.use(cors());
// Enable Express to parse JSON bodies
app.use(express.json());

// --- API ROUTES ---
// We map the URL to the handler function you created.
app.get('/api/getSessions', getSessionsHandler);
app.get('/api/getMessages', getMessagesHandler);
app.post('/api/storeMessage', storeMessageHandler);
app.post('/api/storeFileMessage', storeFileMessageHandler);
app.delete('/api/deleteSession', deleteSessionHandler);
app.put('/api/updateSession', updateSessionHandler);

// Basic health check route
app.get('/', (req, res) => {
  res.status(200).send('Eira Backend Server is running!');
});

app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});