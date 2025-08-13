// server.js
const express = require('express');
const cors = require('cors');

// Load environment variables. We'll create the .env file on the server.
require('dotenv').config();

// --- IMPORT YOUR NEW ROUTE HANDLERS ---
const getSessionsHandler = require('./api/getSessions');
const getMessagesHandler = require('./api/getMessages');
const storeMessageHandler = require('./api/storeMessage');
const storeFileMessageHandler = require('./api/storeFileMessage');
const deleteSessionHandler = require('./api/deleteSession');
const updateSessionHandler = require('./api/updateSession');

const app = express();
const port = process.env.PORT || 8080;

// --- MIDDLEWARE ---
app.use(cors()); // Handles CORS for all routes
app.use(express.json()); // Handles parsing JSON request bodies

// --- API ROUTES ---
// Map URL endpoints to your handler files.
app.get('/api/sessions', getSessionsHandler);       // e.g., /api/sessions?email=user@example.com
app.get('/api/messages', getMessagesHandler);     // e.g., /api/messages?session_id=123
app.delete('/api/sessions', deleteSessionHandler);  // e.g., /api/sessions?session_id=123

app.post('/api/messages', storeMessageHandler);
app.post('/api/file-messages', storeFileMessageHandler);
app.put('/api/sessions', updateSessionHandler);

app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});