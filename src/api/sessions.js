'use strict';

const { supabase } = require('./supabase');

async function getOrCreateSession(phoneHash) {
  const { data: existing, error: findError } = await supabase
    .from('bot_sessions')
    .select('id, phone_hash, current_step, patient_id, state_data, minor')
    .eq('phone_hash', phoneHash)
    .maybeSingle();

  if (findError) throw new Error(`Session lookup failed: ${findError.message}`);

  if (existing) {
    await supabase
      .from('bot_sessions')
      .update({ last_message: new Date().toISOString() })
      .eq('id', existing.id);
    return existing;
  }

  const { data: created, error: createError } = await supabase
    .from('bot_sessions')
    .insert({
      phone_hash: phoneHash,
      current_step: 'idle',
      state_data: {}
    })
    .select('id, phone_hash, current_step, patient_id, state_data, minor')
    .single();

  if (createError) throw new Error(`Session create failed: ${createError.message}`);
  return created;
}

async function updateSession(sessionId, updates) {
  const { error } = await supabase
    .from('bot_sessions')
    .update({ ...updates, last_message: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw new Error(`Session update failed: ${error.message}`);
}

module.exports = { getOrCreateSession, updateSession };