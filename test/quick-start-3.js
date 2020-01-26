'use strict';
const smsPdu = require('../lib/sms-pdu.js');

const number = '09012345678';

// Long text
// - Quoted from Wikipedia (https://en.wikipedia.org/wiki/SMS)
const text = 'SMS (short message service) is a text messaging service component of most telephone, Internet, and mobile device systems. It uses standardized communication protocols to enable mobile devices to exchange short text messages. An intermediary service can facilitate a text-to-voice conversion to be sent to landlines.'

const pdu_list = smsPdu.generateSubmit('09012345678', text);
console.log(pdu_list);