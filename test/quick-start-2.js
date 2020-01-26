'use strict';
const smsPdu = require('../lib/sms-pdu.js');

const pdu_list = smsPdu.generateSubmit('09012345678', 'こんにちわ');
console.log(pdu_list);