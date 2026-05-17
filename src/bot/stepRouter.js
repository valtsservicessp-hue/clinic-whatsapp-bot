'use strict';

const { updateSession } = require('../api/sessions');

async function routeStep(session, messageBody) {
  switch (session.current_step) {
    case 'idle':
      await updateSession(session.id, { current_step: 'id_collect' });
      return (
        'Hello! 👋 Welcome to ClinicOS.\n\n' +
        'To book an appointment, please send me your National ID number.'
      );

    case 'id_collect':
      return 'Thanks — patient lookup is being set up. Please try again shortly.';

    case 'clinic_select':
      return 'Clinic selection coming soon.';

    case 'slot_select':
      return 'Slot selection coming soon.';

    case 'payment':
      return 'Payment options coming soon.';

    default:
      return 'Sorry, something went wrong. Please send "hello" to start over.';
  }
}

module.exports = { routeStep };