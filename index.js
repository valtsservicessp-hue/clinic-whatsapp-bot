'use strict';

require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check — Railway uses this to confirm the app is alive
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Placeholder webhook — replaced on Day 3 with real Twilio handler
app.post('/webhook/whatsapp', (req, res) => {
  console.log('Received webhook — session pending');
  res.status(200).send('<Response></Response>');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ClinicOS bot listening on port ${PORT}`);
});