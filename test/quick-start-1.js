'use strict';
const smsPdu = require('../lib/sms-pdu.js');

const number = '09012345678'; // Telephone number (in this case, national number)
const text = 'How are you doing?'; // Text
const pdu_list = smsPdu.generateSubmit(number, text);
console.log(pdu_list);