// server.js (FINAL PATH-CHECKED VERSION)
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Handlers are in the ./api/ directory relative to this file
const registerHandler = require('./api/register');
const loginHandler = require('./api/login');
const getSessionsHandler = require('./api/getSessions');
const getMessagesHandler = require('./api/getMessages');
const storeMessageHandler = require('./api/storeMessage');
const deleteSessionHandler = require('./api/deleteSession');
const updateSessionHandler = require('./api/updateSession');
const storeFileMessageHandler = require('./api/storeFileMessage');
const changeNameHandler = require('./api/changeName');
const changePasswordHandler = require('./api/changePassword');
// Middleware is in ./api/_utils/ relative to this file
const authenticateToken = require('./api/_utils/authMiddleware');

const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.post('/api/register', registerHandler);
app.post('/api/login', loginHandler);

app.use('/api', authenticateToken); // Apply middleware to all /api routes

app.get('/api/sessions', getSessionsHandler);
app.get('/api/messages', getMessagesHandler);
app.post('/api/messages', storeMessageHandler);
app.put('/api/sessions', updateSessionHandler);
app.delete('/api/sessions', deleteSessionHandler);
app.post('/api/file-messages', storeFileMessageHandler);
app.put('/api/user/name', changeNameHandler);
app.put('/api/user/password', changePasswordHandler);
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
