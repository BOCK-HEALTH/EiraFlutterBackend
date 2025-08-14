// server.js (FINAL CODE)
const express = require('express');
const cors = require('cors');

// This one line loads all environment variables
require('dotenv').config();

// --- IMPORT YOUR SECURE ROUTE HANDLERS ---
const getSessionsHandler = require('./api/getSessions');
const getMessagesHandler = require('./api/getMessages');
const storeMessageHandler = require('./api/storeMessage');
// const storeFileMessageHandler = require('./api/storeFileMessage'); // Uncomment if you add this file back
const deleteSessionHandler = require('./api/deleteSession');
const updateSessionHandler = require('./api/updateSession');

const app = express();
const port = process.env.PORT || 8080;

// --- GLOBAL MIDDLEWARE ---
app.use(cors());
app.use(express.json()); // For parsing JSON request bodies

// --- API ROUTES ---
app.get('/api/sessions', getSessionsHandler);
app.get('/api/messages', getMessagesHandler);
app.post('/api/messages', storeMessageHandler);
app.put('/api/sessions', updateSessionHandler);
app.delete('/api/sessions', deleteSessionHandler);
// app.post('/api/file-messages', storeFileMessageHandler); // Uncomment if you add this file back

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});