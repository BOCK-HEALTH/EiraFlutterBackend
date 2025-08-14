// server.js (CORRECTED ROUTES)
const express = require('express');
const cors = require('cors');

// This one line loads all environment variables from your .env file
require('dotenv').config();

// --- IMPORT YOUR SECURE ROUTE HANDLERS ---
const getSessionsHandler = require('./api/getSessions');
const getMessagesHandler = require('./api/getMessages');
const storeMessageHandler = require('./api/storeMessage');
// const storeFileMessageHandler = require('./api/storeFileMessage'); // Uncomment if you add this back
const deleteSessionHandler = require('./api/deleteSession');
const updateSessionHandler = require('./api/updateSession');

const app = express();
const port = process.env.PORT || 8080;

// --- GLOBAL MIDDLEWARE ---
app.use(cors());
app.use(express.json()); // For parsing JSON request bodies

// --- API ROUTES (Now matching the Flutter app exactly) ---
app.get('/api/getSessions', getSessionsHandler);
app.get('/api/getMessages', getMessagesHandler);
app.post('/api/storeMessage', storeMessageHandler);
app.put('/api/updateSession', updateSessionHandler);
app.delete('/api/deleteSession', deleteSessionHandler); // Note: The handler expects the ID in the body
// app.post('/api/storeFileMessage', storeFileMessageHandler); // Uncomment if you add this back

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});