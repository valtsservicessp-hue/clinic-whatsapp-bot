'use strict';

const EMERGENCY_KEYWORDS = [
  'heart attack', 'chest pain', "can't breathe", 'unconscious',
  'stroke', 'suicide', 'overdose', 'emergency', 'bleeding heavily', 'fainted'
];

const MEDICAL_KEYWORDS = [
  'results', 'diagnosis', 'symptoms', 'treatment', 'prescription',
  'medication', 'blood test', 'lab report', 'fever', 'pain',
  'interpret', 'is it serious', 'is this normal'
];

const EMERGENCY_MSG =
  'Please call emergency services immediately — 911 in the US or your local emergency number. ' +
  'Do not wait. I cannot provide medical assistance through this chat.';

const MEDICAL_REDIRECT_MSG =
  "I'm not able to assess medical symptoms or interpret results.\n" +
  'Please contact the clinic directly:\n' +
  '📞 +1 800 555 0100 — Mon–Fri 8 AM–6 PM\n' +
  'If this is urgent, please seek care immediately.';

function checkSafetyGuards(message) {
  const lower = message.toLowerCase();
  if (EMERGENCY_KEYWORDS.some(kw => lower.includes(kw))) return EMERGENCY_MSG;
  if (MEDICAL_KEYWORDS.some(kw => lower.includes(kw))) return MEDICAL_REDIRECT_MSG;
  return null;
}

module.exports = { checkSafetyGuards };