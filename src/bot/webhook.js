'use strict';

const express = require('express');
const twilio = require('twilio');
const crypto = require('crypto');

const { getOrCreateSession } = require('../api/sessions');
const { checkSafetyGuards } = require('./guards');

const router = express.Router();
const MessagingResponse = twilio.twiml.MessagingResponse;

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

function hashPhone(phoneNumber) {
  return crypto.createHash('sha256').update(phoneNumber).digest('hex');
}

async function forwardToMake(session, messageBody, fromNumber) {
  const payload = {
    session: {
      id: session.id,
      phone_hash: session.phone_hash,
      current_step: session.current_step,
      patient_id: session.patient_id,
      state_data: session.state_data,
      minor: session.minor
    },
    message: {
      body: messageBody,
      from: fromNumber
    }
  };

  const response = await fetch(process.env.MAKE_BOOKING_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Make webhook returned ${response.status}`);
  }
  console.log(`Forwarded to Make — session_id=${session.id}`);
}

router.post('/whatsapp', validateTwilioSignature, async (req, res) => {
  try {
    const fromNumber = req.body.From;
    const messageBody = req.body.Body || '';
    const phoneHash = hashPhone(fromNumber);

    const session = await getOrCreateSession(phoneHash);
    console.log(`Incoming message — session_id=${session.id}, step=${session.current_step}`);

    const guardResponse = checkSafetyGuards(messageBody);
    if (guardResponse) {
      const twiml = new MessagingResponse();
      twiml.message(guardResponse);
      return res.type('text/xml').send(twiml.toString());
    }

    forwardToMake(session, messageBody, fromNumber).catch(err => {
      console.error('Failed to forward to Make:', err.message);
    });

    const emptyTwiml = new MessagingResponse();
    res.type('text/xml').send(emptyTwiml.toString());

  } catch (err) {
    console.error('Webhook error:', err.message);
    res.status(500).send('Internal server error');
  }
});

module.exports = router;