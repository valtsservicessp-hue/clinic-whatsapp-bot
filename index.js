'use strict';

require('dotenv').config();
const express = require('express');
const webhookRouter = require('./src/bot/webhook');

const app = express();

// Twilio sends form-encoded payloads (not JSON)
app.use(express.urlencoded({ extended: false }));

// Health check — Railway pings this
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// All /webhook/* routes
app.use('/webhook', webhookRouter);

// Generic error handler — never leak stack traces to the client
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(500).send('Internal server error');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ClinicOS bot listening on port ${PORT}`);
});