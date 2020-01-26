'use strict';
const mSerialPort = require('serialport');
let sms = require('../lib/sms-pdu.js');


let number = '09077016581';

//let text = '[Howdy]';
//let text = 'SMS (short message service) is a text messaging service component of most telephone, Internet, and mobile device systems. It uses standardized communication protocols to enable mobile devices to exchange short text messages. An intermediary service can facilitate a text-to-voice conversion to be sent to landlines.';

let text = 'こんにちは。こんばんは。';
//let text = 'こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。こんにちは。こんばんは。';

let pdu_list = sms.generateSubmit(number, text);

let receiveCallback = () => { };

let port = new mSerialPort('/dev/QWS.EC25.AT', {
  autoOpen: false,
  baudRate: 115200,
});

(async () => {
  await openPort();
  console.log('Connected.');

  port.on('data', (buf) => {
    receiveData(buf);
  });

  for (let pdu of pdu_list) {
    let at1 = 'AT+CMGS=' + pdu.length + '\r';
    let line_list_1 = await sendData(at1);
    if(!/^\>/.test(line_list_1[0])) {
      throw new Error('ERROR');
    }

    let at2 = pdu.hex + String.fromCharCode(26); // Ctrl+z
    let line_list_2 = await sendData(at2);
    if(line_list_2[1] !== 'OK') {
      throw new Error('ERROR');
    }
  }

  await closePort();
  process.exit();

})().catch((error) => {
  console.error(error);
  process.exit();
});

function openPort(at) {
  return new Promise((resolve, reject) => {
    port.open((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function closePort() {
  return new Promise((resolve, reject) => {
    port.close((error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function sendData(at) {
  return new Promise((resolve, reject) => {
    console.log('>> ' + at);
    let buf = Buffer.from(at);
    port.write(buf, (error) => {
      if (error) {
        reject(error);
      } else {
        receiveCallback = (res_line_list) => {
          resolve(res_line_list);
        };
      }
    });
  });
}

function receiveData(buf) {
  let res = buf.toString('utf8');
  console.log('<< ' + res);
  let line_list_raw = res.split(/\r\n/);
  let line_list = [];
  for(let line of line_list_raw) {
    if(line !== '') {
      line_list.push(line);
    }
  }

  receiveCallback(line_list);
}

