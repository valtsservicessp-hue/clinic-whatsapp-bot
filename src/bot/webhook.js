'use strict';

const express = require('express');
const twilio = require('twilio');
const crypto = require('crypto');

const { getOrCreateSession } = require('../api/sessions');
const { checkSafetyGuards } = require('./guards');
const { routeStep } = require('./stepRouter');

const router = express.Router();
const MessagingResponse = twilio.twiml.MessagingResponse;

// Verify the request actually came from Twilio
function validateTwilioSignature(req, res, next) {
  const twilioSignature = req.headers['x-twilio-signature'];
  const url = `${process.env.WEBHOOK_URL}${req.originalUrl}`;

  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    twilioSignature,
    url,
    req.body
  );

  if (!isValid) {
    console.warn('Invalid Twilio signature — request rejected');
    return res.status(403).send('Forbidden');
  }
  next();
}

// SHA-256 the phone number — never store raw
function hashPhone(phoneNumber) {
  return crypto.createHash('sha256').update(phoneNumber).digest('hex');
}

router.post('/whatsapp', validateTwilioSignature, async (req, res) => {
  try {
    const fromNumber = req.body.From;       // e.g. "whatsapp:+15551234567"
    const messageBody = req.body.Body || '';
    const phoneHash = hashPhone(fromNumber);

    const session = await getOrCreateSession(phoneHash);
    console.log(`Incoming message — session_id=${session.id}, step=${session.current_step}`);

    // Safety guards run BEFORE any step logic — emergency redirects are uninterruptible
    const guardResponse = checkSafetyGuards(messageBody);
    if (guardResponse) {
      const twiml = new MessagingResponse();
      twiml.message(guardResponse);
      return res.type('text/xml').send(twiml.toString());
    }

    // Otherwise run the state machine
    const replyText = await routeStep(session, messageBody);

    const twiml = new MessagingResponse();
    twiml.message(replyText);
    res.type('text/xml').send(twiml.toString());

  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;