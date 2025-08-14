// server.js (FINAL CORRECTED CODE)
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const getSessionsHandler = require('./api/getSessions');
const getMessagesHandler = require('./api/getMessages');
const storeMessageHandler = require('./api/storeMessage');
const storeFileMessageHandler = require('./api/storeFileMessage'); // <<< THIS LINE IS NOW UNCOMMENTED
const deleteSessionHandler = require('./api/deleteSession');
const updateSessionHandler = require('./api/updateSession');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/api/getSessions', getSessionsHandler);
app.get('/api/getMessages', getMessagesHandler);
app.post('/api/storeMessage', storeMessageHandler);
app.put('/api/updateSession', updateSessionHandler);
app.delete('/api/deleteSession', deleteSessionHandler);
app.post('/api/storeFileMessage', storeFileMessageHandler); // <<< THIS LINE IS NOW UNCOMMENTED

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});