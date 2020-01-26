'use strict';
let smsPdu = require('../lib/sms-pdu.js');

let number = '09077016581';
//let number = '+819012345678';

let text = '[Howdy]';
//let text = 'SMS (short message service) is a text messaging service component of most telephone, Internet, and mobile device systems. It uses standardized communication protocols to enable mobile devices to exchange short text messages. An intermediary service can facilitate a text-to-voice conversion to be sent to landlines.';

//let text = '1234567';
//let text = '你好！';
//let text = 'こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。';

//let pdu_list = sms.generateSubmit(number, text, { encoding: "gsm" });
let pdu_list = smsPdu.generateSubmit(number, text);
console.log(pdu_list);